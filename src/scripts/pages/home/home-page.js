import LoadingIndicator from "../../components/loading";
import HomePresenter from "./home-presenter";
import * as StoryAPI from "../../data/api";
import MAP from "../../utils/map";
import StoryIdb from "../../utils/database";
import Notification from "../../utils/notification";
import { generateStoriesEmptyListTemplate, generateStoryItemTemplate, generateStoriesListErrorTemplate, generateStoryShellTemplate, generatePendingStoryItemTemplate } from "../../templates";

// Kelas HomePage bertanggung jawab untuk tampilan dan logika halaman utama (daftar cerita & map)
export default class HomePage {
  #presenter = null; // Presenter untuk menghubungkan view dan model
  #map = null; // Instance peta

  // Render tampilan awal halaman home (map & daftar cerita)
  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <div class="stories-header">
          <h1 class="section-title">Daftar Cerita</h1>
          <div id="sync-container"></div>
        </div>

        <div class="stories-list__container">
          <div id="pending-stories"></div>
          <div id="stories-list">
            <div class="stories-list">
              ${generateStoryShellTemplate()}
              ${generateStoryShellTemplate()}
              ${generateStoryShellTemplate()}
            </div>
          </div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  // Dipanggil setelah render, untuk setup presenter, map, dan load data
  async afterRender() {
    LoadingIndicator.show("map-loading-container");
    LoadingIndicator.show("stories-list-loading-container");

    await this.initMap();
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI,
      favoriteModel: StoryIdb,
    });

    await this.#presenter.showHome();
    await this.checkPendingStories();

    LoadingIndicator.hide("stories-list-loading-container");
  }

  // Mengecek dan menampilkan cerita yang masih pending (belum tersinkronisasi)
  async checkPendingStories() {
    try {
      const stories = await StoryIdb.getStories();
      const pendingStories = stories.filter((story) => story.isPending);

      if (pendingStories.length > 0) {
        // Tampilkan daftar pending stories
        const pendingHtml = pendingStories.reduce((acc, story) => {
          return acc + generatePendingStoryItemTemplate(story);
        }, "");

        document.getElementById("pending-stories").innerHTML = `
          <div class="pending-stories-container">
            <h2 class="pending-stories-title">Pending Stories (${pendingStories.length})</h2>
            <div class="stories-list pending-stories-list">
              ${pendingHtml}
            </div>
          </div>
        `;

        // Tampilkan tombol sync
        document.getElementById("sync-container").innerHTML = `
          <button id="sync-button" class="btn sync-button">
            <i class="fas fa-sync-alt"></i> Sync Pending Stories
          </button>
        `;

        document.getElementById("sync-button").addEventListener("click", async () => {
          await this.syncPendingStories();
        });
      }
    } catch (error) {
      console.error("Error checking pending stories:", error);
    }
  }

  // Sinkronisasi cerita pending ke server
  async syncPendingStories() {
    try {
      const syncButton = document.getElementById("sync-button");
      if (!syncButton) return;

      LoadingIndicator.showButtonLoading(syncButton);

      const result = await StoryAPI.syncPendingStories();

      if (result.ok) {
        Notification.success(result.message);
        await this.#presenter.showHome();
        await this.checkPendingStories();
      } else {
        Notification.error(result.message);
      }

      LoadingIndicator.hideButtonLoading(syncButton);
    } catch (error) {
      console.error("Error syncing pending stories:", error);
      Notification.error("Gagal menyinkronkan cerita pending: " + error.message);

      const syncButton = document.getElementById("sync-button");
      if (syncButton) {
        LoadingIndicator.hideButtonLoading(syncButton);
      }
    }
  }

  // Menampilkan daftar cerita ke halaman
  async showStories(message, stories, fromCache = false) {
    if (fromCache) {
      Notification.info("Menampilkan cerita dari cache offline");
    }

    if (stories.length <= 0) {
      this.showEmptyStory();
      return;
    }

    // Ambil status favorit untuk setiap story
    const favoriteStatuses = await Promise.all(stories.map((story) => StoryIdb.isFavorite(story.id)));

    const html = stories.reduce((accumulator, story, index) => {
      // Tambahkan marker ke map jika ada koordinat
      if (story.lat && story.lon) {
        const coor = [story.lat, story.lon];

        this.#map.addMarker(coor, { alt: story.name }, { content: `<strong>${story.name}</strong><br>${story.description}` });
      }

      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          userName: story.name,
          description: story.description,
          photo: story.photoUrl || story.photo,
          createdAt: story.createdAt,
          location: { lat: story.lat, lon: story.lon } || {
            lat: null,
            lon: null,
          },
          isFavorite: favoriteStatuses[index], // Status favorit
        })
      );
    }, "");

    document.getElementById("stories-list").innerHTML = `
    <div class="stories-list">${html}</div>
    `;

    // Tambahkan event listener ke tombol favorit
    document.querySelectorAll(".favorite-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const storyId = button.getAttribute("data-id");

        if (storyId) {
          const story = stories.find((s) => s.id === storyId);
          if (story) {
            const result = await StoryIdb.toggleFavoriteStory(story);

            // Update tampilan tombol favorit
            if (result.isFavorite) {
              button.classList.add("favorited");
              button.querySelector("i").className = "fas fa-heart";
              button.title = "Hapus dari favorit";
            } else {
              button.classList.remove("favorited");
              button.querySelector("i").className = "far fa-heart";
              button.title = "Tambah ke favorit";
            }

            Notification.success(result.message);
          }
        }
      });
    });
  }

  // Tampilkan tampilan kosong jika tidak ada cerita
  showEmptyStory() {
    document.getElementById("stories-list").innerHTML = generateStoriesEmptyListTemplate();
  }

  // Tampilkan pesan error jika gagal memuat daftar cerita
  // Jika offline, tampilkan pesan khusus offline
  showErrorStoryList(message) {
    LoadingIndicator.hide("stories-list-loading-container");

    if (!navigator.onLine) {
      document.getElementById("stories-list").innerHTML = `
        <div class="offline-page">
          <img src="images/offline.svg" alt="Offline">
          <h2>Kamu sedang offline</h2>
          <p>Periksa koneksi internetmu lalu coba lagi</p>
          <button class="retry-button" id="retry-button">
            <i class="fas fa-sync-alt"></i> Coba Lagi
          </button>
        </div>
      `;

      document.getElementById("retry-button").addEventListener("click", () => {
        if (navigator.onLine) {
          this.#presenter.showHome();
        } else {
          Notification.warning("Masih offline. Silakan cek koneksi internetmu.");
        }
      });
    } else {
      document.getElementById("stories-list").innerHTML = generateStoriesListErrorTemplate(message);
      Notification.error(message || "Gagal menampilkan cerita. Mohon coba lagi.");
    }
  }

  // Inisialisasi peta Leaflet di halaman home
  async initMap() {
    try {
      const mapContainer = document.querySelector("#map");
      if (!mapContainer) {
        return;
      }

      this.#map = await MAP.build("#map", {
        zoom: 5,
        locate: true,
        scrollWheelZoom: false,
      });

      LoadingIndicator.hide("map-loading-container");
    } catch (error) {
      LoadingIndicator.hide("map-loading-container");
      document.querySelector(".stories-list__map__container").innerHTML += '<div class="error-message">Gagal menampilkan peta. Silakan coba lagi.</div>';
      Notification.warning("Gagal menampilkan peta, beberapa fitur mungkin tidak tersedia.");
    }
  }
}
