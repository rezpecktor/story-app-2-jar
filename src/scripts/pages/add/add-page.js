import * as StoryAPI from "../../data/api";
import AddPresenter from "./add-presenter";
import { generateLoaderAbsoluteTemplate } from "../../templates";
import MAP from "../../utils/map";
import Notification from "../../utils/notification";
import Camera from "../../utils/camera";
import LoadingIndicator from "../../components/loading";
import L from "leaflet";

// Kelas AddPage bertanggung jawab untuk halaman tambah cerita baru
export default class AddPage {
  #presenter; // Presenter untuk menghubungkan view dan model
  #form; // Form HTML untuk input cerita baru
  #camera; // Instance kamera untuk mengambil foto
  #map; // Instance peta Leaflet
  #isCameraReady = false; // Status kamera aktif/tidak
  #takeDocumentations = []; // Array foto yang diambil/dipilih

  // Membersihkan resource saat halaman ditinggalkan
  cleanup() {
    console.log("Cleaning up AddPage resources");
    if (this.#camera) {
      this.#camera.stop();
      this.#camera = null;
    }
    this.#isCameraReady = false;
  }

  // Render tampilan form tambah cerita
  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Publikasi Cerita Anda!</h1>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <fieldset class="form-control">
              <legend class="new-form__description__title">Cerita apa yang akan kamu bagikan? <span aria-hidden="true" style="color: red">*</span></legend>  
              <div class="new-form__description__container">
                <label for="description-input" class="sr-only">Cerita Anda</label>
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Bagikan cerita menarikmu!"
                  required
                  aria-required="true"
                ></textarea>
              </div>
            </fieldset>
            
            <fieldset class="form-control">
              <legend class="new-form__documentations__title">Foto <span aria-hidden="true" style="color: red">*</span></legend>
  
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    Unggah Gambar
                  </button>
                  <label for="documentations-input" class="sr-only">Upload image files</label>
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden="hidden"
                    aria-required="true"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <h3 class="camera-heading">Camera Preview</h3>
                  <video id="camera-video" class="new-form__camera__video" aria-label="Camera preview">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas" aria-hidden="true"></canvas>
  
                  <div class="new-form__camera__tools">
                    <label for="camera-select">Select Camera:</label>
                    <select id="camera-select" aria-label="Choose camera device"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs" aria-live="polite" aria-label="Uploaded photos list"></ul>
              </div>
            </fieldset>
            
            <fieldset class="form-control">
              <legend class="new-form__location__title">Lokasi</legend>
  
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <label for="lat-input">Latitude</label>
                  <input id="lat-input" type="text" name="lat" value="-6.175389" disabled>
                  <label for="lon-input">Longitude</label>
                  <input id="lon-input" type="text" name="lon" value="106.827139" disabled>
                </div>
              </div>
            </fieldset>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button id="submit-button" class="btn" type="submit">Bagikan</button>
              </span>
              <a class="btn btn-outline" href="#/" role="button">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  // Dipanggil setelah render, untuk setup event listener dan inisialisasi
  async afterRender() {
    this.#takeDocumentations = [];
    this.#setupForm();

    this.#presenter = new AddPresenter({
      view: this,
      model: StoryAPI,
    });

    // Tampilkan loading pada map
    LoadingIndicator.show("map-loading-container");

    // Tunggu form benar-benar ter-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Set lokasi saat ini, lalu inisialisasi peta
    await this.#setCurrentLocation();
    await this.initMap();
    await this.#presenter.showAdd();
  }

  // Mendapatkan lokasi user saat ini dan mengisi input lat/lon
  async #setCurrentLocation() {
    try {
      if (MAP.isGeolocationAvailable()) {
        const position = await MAP.getCurrentPosition();
        if (position && position.coords) {
          const latInput = this.#form.elements.namedItem("lat");
          const lonInput = this.#form.elements.namedItem("lon");

          if (latInput && lonInput) {
            latInput.value = position.coords.latitude;
            lonInput.value = position.coords.longitude;
          }
        }
      }
    } catch (error) {
      // Handle error geolokasi
      let message = "Tidak bisa mendapatkan lokasi Anda.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Izin untuk mengakses lokasi ditolak.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Informasi lokasi tidak tersedia.";
          break;
        case error.TIMEOUT:
          message = "Permintaan untuk mendapatkan lokasi pengguna telah habis waktu.";
          break;
        default:
          message = "Terjadi kesalahan yang tidak diketahui.";
          break;
      }
      console.error(message, error.message);
      // Bisa tampilkan notifikasi ke user
    }
  }

  // Setup event listener pada form dan tombol-tombol
  #setupForm() {
    this.#form = document.getElementById("new-form");

    // Submit form
    this.#form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = document.getElementById("submit-button");
      LoadingIndicator.showButtonLoading(submitButton);

      try {
        const data = this.#collectFormData();
        await this.#presenter.postStory(data);
      } catch (error) {
        this.addFailed(error.message);
      } finally {
        LoadingIndicator.hideButtonLoading(submitButton);
      }
    });

    // Upload file gambar
    document.getElementById("documentations-input").addEventListener("change", async (event) => {
      await this.#handleFileInput(event.target.files);
    });

    // Klik tombol upload gambar
    document.getElementById("documentations-input-button").addEventListener("click", () => {
      document.getElementById("documentations-input").click();
    });

    // Buka kamera
    const cameraContainer = document.getElementById("camera-container");
    document.getElementById("open-documentations-camera-button").addEventListener("click", async (event) => {
      this.#toggleCamera(event, cameraContainer);
    });
  }

  // Inisialisasi peta Leaflet dan marker
  async initMap() {
    try {
      const lat = parseFloat(this.#form.elements.namedItem("lat").value);
      const lon = parseFloat(this.#form.elements.namedItem("lon").value);

      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found");
        return;
      }

      mapContainer.style.height = "300px";
      LoadingIndicator.show("map-loading-container");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Inisialisasi peta jika belum ada
      if (!this.#map) {
        this.#map = await MAP.build("#map", {
          center: [lat, lon],
          zoom: 13,
          scrollWheelZoom: false,
        });

        const mapInstance = this.#map.getMap();

        // Perbaiki layout peta
        setTimeout(() => {
          mapInstance.invalidateSize();
        }, 250);

        // Custom marker
        const customIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/6848/6848666.png",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([lat, lon], {
          draggable: true,
          icon: customIcon,
          alt: "Drag to set story location",
        }).addTo(mapInstance);

        // Update marker dan input lat/lon saat peta diklik
        mapInstance.on("click", (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng(e.latlng);
          this.#form.elements.namedItem("lat").value = lat.toFixed(6);
          this.#form.elements.namedItem("lon").value = lng.toFixed(6);
        });

        // Update input saat marker digeser
        marker.on("move", (event) => {
          const position = event.latlng;
          this.#form.elements.namedItem("lat").value = position.lat.toFixed(6);
          this.#form.elements.namedItem("lon").value = position.lng.toFixed(6);
        });
      }

      LoadingIndicator.hide("map-loading-container");
    } catch (error) {
      // Handle error peta
      console.error("Error initializing map:", error);
      LoadingIndicator.hide("map-loading-container");

      const mapContainer = document.querySelector(".new-form__location__map__container");
      if (mapContainer) {
        mapContainer.innerHTML += `
          <div class="map-error">
            <p>Failed to load map. Please try refreshing the page.</p>
          </div>
        `;
      }
    }
  }

  // Inisialisasi kamera dan event capture foto
  async #setupCamera() {
    try {
      const videoElement = document.getElementById("camera-video");
      const canvasElement = document.getElementById("camera-canvas");
      const selectElement = document.getElementById("camera-select");

      if (!videoElement || !canvasElement) {
        throw new Error("Camera elements not found");
      }

      // Buat instance kamera jika belum ada
      if (!this.#camera) {
        this.#camera = new Camera({
          video: videoElement,
          canvas: canvasElement,
          select: selectElement,
        });
      }

      // Status kamera
      const cameraContainer = document.getElementById("camera-container");
      let statusIndicator = cameraContainer.querySelector(".camera-status");
      if (!statusIndicator) {
        statusIndicator = document.createElement("div");
        statusIndicator.className = "camera-status";
        cameraContainer.appendChild(statusIndicator);
      }

      statusIndicator.textContent = "Requesting access...";
      statusIndicator.className = "camera-status inactive";

      // Mulai kamera
      videoElement.classList.add("loading");
      await this.#camera.launch();
      videoElement.classList.remove("loading");

      statusIndicator.textContent = "Camera active";
      statusIndicator.className = "camera-status active";

      // Event tombol ambil gambar
      this.#camera.addCheeseButtonListener("#camera-take-button", async () => {
        try {
          const photoDataUrl = await this.#camera.takePhoto();
          await this.#addTakenPicture(photoDataUrl);
          await this.#updateTakenList();
        } catch (error) {
          console.error("Failed to take photo:", error);
          Notification.error("Failed to take photo: " + error.message);
        }
      });

      return true;
    } catch (error) {
      // Handle error setup kamera
      console.error("Camera setup error:", error);
      this.#resetCameraUI();

      if (error.name === "NotAllowedError") {
        Notification.error("Camera access denied. Please allow camera access in your browser settings.");
      } else {
        Notification.error("Failed to setup camera: " + error.message);
      }

      throw error;
    }
  }

  // Reset tampilan kamera jika gagal
  #resetCameraUI() {
    const cameraContainer = document.getElementById("camera-container");
    const cameraButton = document.getElementById("open-documentations-camera-button");

    if (cameraContainer) {
      cameraContainer.classList.remove("open");
    }

    if (cameraButton) {
      cameraButton.disabled = false;
      cameraButton.textContent = "Buka Kamera";
    }

    this.#isCameraReady = false;

    if (this.#camera) {
      this.#camera.stop();
    }
  }

  // Buka/tutup kamera sesuai tombol
  async #toggleCamera(event, cameraContainer) {
    try {
      const isCurrentlyOpen = cameraContainer.classList.contains("open");
      const cameraButton = document.getElementById("open-documentations-camera-button");

      if (isCurrentlyOpen) {
        // Tutup kamera
        cameraContainer.classList.remove("open");
        this.#isCameraReady = false;
        cameraButton.textContent = "Buka Kamera";
        if (this.#camera) {
          this.#camera.stop();
        }
      } else {
        // Buka kamera
        cameraButton.disabled = true;
        cameraButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        cameraContainer.classList.add("open");

        try {
          await this.#setupCamera();
          this.#isCameraReady = true;
          cameraButton.textContent = "Tutup Kamera";
        } catch (error) {
          console.error("Failed to setup camera:", error);
          Notification.error(`Camera error: ${error.message}`);
          cameraContainer.classList.remove("open");
          this.#isCameraReady = false;
          cameraButton.textContent = "Buka Kamera";
        }

        cameraButton.disabled = false;
      }
    } catch (error) {
      // Handle error toggle kamera
      console.error("Error toggling camera:", error);
      this.#resetCameraUI();
      Notification.error("Failed to toggle camera: " + error.message);
    }
  }

  // Mengumpulkan data dari form untuk dikirim ke API
  #collectFormData() {
    const description = this.#form.elements.namedItem("description").value.trim();
    if (!description) {
      throw new Error("Please enter a description");
    }

    const firstPhoto = this.#takeDocumentations[0]?.file;
    if (!firstPhoto) {
      throw new Error("Please select or take at least one photo");
    }

    if (!(firstPhoto instanceof File)) {
      throw new Error("Invalid photo format. Please try again.");
    }

    const lat = parseFloat(this.#form.elements.namedItem("lat").value);
    const lon = parseFloat(this.#form.elements.namedItem("lon").value);

    return {
      description,
      photo: firstPhoto,
      lat: !isNaN(lat) ? lat : null,
      lon: !isNaN(lon) ? lon : null,
    };
  }

  // Handle upload file gambar dari input file
  async #handleFileInput(files) {
    const insertingPicturesPromises = Object.values(files).map(async (file) => {
      return await this.#addTakenPicture(file);
    });
    await Promise.all(insertingPicturesPromises);
    await this.#updateTakenList();
  }

  // Tambahkan foto ke daftar dokumentasi
  async #addTakenPicture(file) {
    try {
      let photoFile;

      if (typeof file === "string") {
        photoFile = await this.#convertBase64ToBlob(file, "image/jpeg");
      } else if (file instanceof File) {
        photoFile = file;
      } else {
        throw new Error("Invalid file format");
      }

      const newPicture = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: photoFile,
      };

      this.#takeDocumentations = [...this.#takeDocumentations, newPicture];
    } catch (error) {
      throw new Error("Failed to process picture. Please try again.");
    }
  }

  // Konversi base64 ke File (untuk hasil kamera)
  async #convertBase64ToBlob(base64, mimeType) {
    const base64Data = base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const binaryData = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }

    return new File([uint8Array], `camera-${Date.now()}.jpg`, {
      type: mimeType,
    });
  }

  // Update tampilan daftar foto yang sudah diambil/diupload
  async #updateTakenList() {
    const html = this.#takeDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.file);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn" aria-label="Delete photo ${currentIndex + 1}">
            <img src="${imageUrl}" alt="Uploaded photo ${currentIndex + 1} - Click to delete" width="150" height="150">
          </button>
        </li>
      `);
    }, "");

    document.getElementById("documentations-taken-list").innerHTML = html;

    // Event hapus foto
    document.querySelectorAll("button[data-deletepictureid]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;
        if (this.#removePicture(pictureId)) {
          this.#updateTakenList();
        }
      });
    });
  }

  // Hapus foto dari daftar dokumentasi
  #removePicture(pictureId) {
    const selectedPicture = this.#takeDocumentations.find((picture) => picture.id === pictureId);
    if (!selectedPicture) {
      return null;
    }

    this.#takeDocumentations = this.#takeDocumentations.filter((picture) => picture.id !== selectedPicture.id);
    return selectedPicture;
  }

  // Tampilkan notifikasi sukses tambah story
  addSuccess(message) {
    Notification.success(message || "Story posted successfully!");
    this.clearForm();
    location.hash = "/";
  }

  // Tampilkan notifikasi sukses simpan story lokal (offline)
  addPendingSuccess(message) {
    Notification.info(message || "Story saved locally!");
    this.clearForm();
    location.hash = "/";
  }

  // Tampilkan notifikasi gagal tambah story
  addFailed(message) {
    Notification.error(message || "Failed to post story. Please try again.");
  }

  // Reset form dan daftar foto
  clearForm() {
    this.#form.reset();
    this.#takeDocumentations = [];
    this.#updateTakenList();
  }
}
