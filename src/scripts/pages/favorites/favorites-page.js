import Notification from "../../utils/notification";
import LoadingIndicator from "../../components/loading";
import StoryIdb from "../../utils/database";
import FavoritesPresenter from "./favorites-presenter";
import { generateStoriesEmptyListTemplate, generateStoryItemTemplate, generateFavoriteStoryItemTemplate, generateStoriesErrorListTemplate } from "../../templates";

// Kelas FavoritesPage bertanggung jawab untuk tampilan dan logika halaman daftar cerita favorit
export default class FavoritesPage {
  #presenter = null; // Presenter untuk menghubungkan view dan model

  // Render tampilan awal halaman favorit (skeleton loading)
  async render() {
    return `
      <section class="container">
        <div class="favorites-header">
          <h1 class="section-title">Favorite Stories</h1>
          <p class="favorites-subtitle">Stories you've saved for later</p>
        </div>

        <div class="stories-list__container">
          <div id="favorites-list">
            <div class="skeleton-container">
              <div class="skeleton-story"></div>
              <div class="skeleton-story"></div>
              <div class="skeleton-story"></div>
            </div>
          </div>
          <div id="favorites-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  // Dipanggil setelah render, untuk setup presenter dan load data favorit
  async afterRender() {
    LoadingIndicator.show("favorites-list-loading-container");

    this.#presenter = new FavoritesPresenter({
      view: this,
      favoriteModel: StoryIdb,
    });

    await this.#presenter.showFavorites();

    LoadingIndicator.hide("favorites-list-loading-container");
  }

  // Tampilkan daftar cerita favorit
  async showFavoriteStories(stories) {
    if (stories.length <= 0) {
      this.showEmptyFavorites();
      return;
    }

    // Urutkan berdasarkan waktu terakhir difavoritkan
    stories.sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt));

    const html = stories.reduce((accumulator, story) => {
      return accumulator.concat(
        generateFavoriteStoryItemTemplate({
          ...story,
          userName: story.name,
          description: story.description,
          photo: story.photoUrl || story.photo,
          createdAt: story.createdAt,
          location: story.lat && story.lon ? { lat: story.lat, lon: story.lon } : null,
        })
      );
    }, "");

    document.getElementById("favorites-list").innerHTML = `
      <div class="stories-list">${html}</div>
    `;

    // Tambahkan event listener ke tombol hapus favorit
    document.querySelectorAll(".favorite-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const storyId = button.getAttribute("data-id");
        if (storyId) {
          await this.#presenter.toggleFavorite(storyId);
          // Refresh daftar favorit setelah dihapus
          await this.#presenter.showFavorites();
        }
      });
    });
  }

  // Tampilkan tampilan kosong jika tidak ada cerita favorit
  showEmptyFavorites() {
    document.getElementById("favorites-list").innerHTML = `
      <div class="favorites-empty">
        <h2>Tidak ada cerita favorit</h2>
        <p>Cerita yang kamu tandai sebagai favorit akan muncul di sini</p>
        <a href="#/" class="btn">Lihat Cerita</a>
      </div>
    `;
  }
  // Tampilkan pesan error jika gagal memuat daftar favorit
  showError(message) {
    LoadingIndicator.hide("favorites-list-loading-container");

    document.getElementById("favorites-list").innerHTML = `
      <div class="favorites-error">
        <h2>Terjadi kesalahan</h2>
        <p>${message}</p>
        <button class="btn" id="retry-favorites">Coba Lagi</button>
      </div>
    `;

    // Event klik untuk mencoba memuat ulang daftar favorit
    document.getElementById("retry-favorites").addEventListener("click", () => {
      this.#presenter.showFavorites();
    });

    Notification.error(message || "Gagal memuat daftar cerita favorit");
  }
}
