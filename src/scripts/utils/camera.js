// Kelas Camera untuk mengelola akses kamera, mengambil foto, dan mengganti device kamera
export default class Camera {
  #videoElement;
  #canvasElement;
  #selectElement;
  #stream = null;

  // Konstruktor menerima elemen video, canvas, dan select (untuk memilih kamera)
  constructor({ video, canvas, select }) {
    this.#videoElement = video;
    this.#canvasElement = canvas;
    this.#selectElement = select;
  }

  // Meluncurkan kamera dan menampilkan daftar device video yang tersedia
  async launch() {
    try {
      // Cek dukungan kamera di browser
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        throw new Error("Kamera tidak didukung di browser ini. Silakan gunakan browser modern dan pastikan akses HTTPS.");
      }

      if (this.#stream) {
        this.stop();
      }

      // Minta izin kamera dengan constraint minimal
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Langsung stop stream awal, hanya untuk izin
      initialStream.getTracks().forEach((track) => track.stop());

      // Enumerasi device video yang tersedia
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      if (this.#selectElement) {
        // Bersihkan opsi kamera sebelumnya
        this.#selectElement.innerHTML = "";

        // Tambahkan opsi untuk setiap device kamera
        videoDevices.forEach((device, index) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || `Camera ${index + 1}`;
          this.#selectElement.appendChild(option);
        });

        // Event saat user memilih kamera lain
        if (!this.#selectElement.onchange) {
          this.#selectElement.onchange = () => {
            this.switchCamera(this.#selectElement.value);
          };
        }
      }

      // Aktifkan kamera pertama secara default
      if (videoDevices.length > 0) {
        await this.switchCamera(videoDevices[0]?.deviceId);
      } else {
        throw new Error("Tidak ada perangkat kamera yang ditemukan");
      }

      return true;
    } catch (error) {
      console.error("Gagal meluncurkan kamera:", error);
      throw error;
    }
  }

  // Berpindah ke kamera lain berdasarkan deviceId
  async switchCamera(deviceId) {
    try {
      // Cek dukungan kamera di browser
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        throw new Error("Kamera tidak didukung di browser ini. Silakan gunakan browser modern dan pastikan akses HTTPS.");
      }

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      // Stop stream lama jika ada
      if (this.#stream) {
        this.#stream.getTracks().forEach((track) => track.stop());
        this.#stream = null;
      }

      try {
        this.#stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // Penanganan error spesifik untuk beberapa kasus
        if (error.name === "NotReadableError") {
          throw new Error("Kamera sedang digunakan aplikasi lain. Silakan tutup aplikasi lain yang menggunakan kamera.");
        } else if (error.name === "NotAllowedError") {
          throw new Error("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
        } else if (error.name === "NotFoundError") {
          throw new Error("Kamera tidak ditemukan. Silakan sambungkan kamera dan coba lagi.");
        } else {
          throw error;
        }
      }

      if (this.#videoElement) {
        this.#videoElement.srcObject = this.#stream;

        // Promise resolve saat metadata video sudah siap
        return new Promise((resolve) => {
          this.#videoElement.onloadedmetadata = () => {
            this.#videoElement.classList.remove("loading");
            this.#videoElement
              .play()
              .then(resolve)
              .catch((error) => {
                console.error("Gagal memutar video:", error);
                this.#videoElement.classList.remove("loading");
                throw error;
              });
          };
        });
      }

      return true;
    } catch (error) {
      console.error("Gagal mengganti kamera:", error);

      // Hapus loading state jika error
      if (this.#videoElement) {
        this.#videoElement.classList.remove("loading");
      }

      throw error;
    }
  }

  // Mengambil foto dari stream video aktif
  async takePhoto() {
    if (!this.#stream) {
      throw new Error("Stream kamera tidak tersedia");
    }

    const context = this.#canvasElement.getContext("2d");

    // Pastikan ukuran canvas sesuai video
    this.#canvasElement.width = this.#videoElement.videoWidth;
    this.#canvasElement.height = this.#videoElement.videoHeight;

    // Gambar frame video ke canvas
    context.drawImage(this.#videoElement, 0, 0);

    // Convert canvas ke data URL (JPEG, kualitas 80%)
    return this.#canvasElement.toDataURL("image/jpeg", 0.8);
  }

  // Menghentikan stream kamera aktif
  stop() {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.#stream = null;
    }

    if (this.#videoElement && this.#videoElement.srcObject) {
      this.#videoElement.srcObject = null;
      this.#videoElement.classList.remove("loading");
    }
  }

  // Menambahkan event listener ke tombol "cheese" (ambil foto)
  addCheeseButtonListener(buttonSelector, callback) {
    const button = document.querySelector(buttonSelector);
    if (button) {
      button.addEventListener("click", callback);
    }
  }

  // Static: menghentikan semua stream video di seluruh halaman
  static stopAllStreams() {
    // Stop semua stream pada elemen video di halaman
    document.querySelectorAll("video").forEach((video) => {
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      }
    });
  }

  // Mengecek apakah kamera sedang aktif
  isActive() {
    return !!this.#stream;
  }
}
