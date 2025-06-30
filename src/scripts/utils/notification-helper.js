import SwalNotification from "./notification"; // Import helper untuk notifikasi swal
import CONFIG from "../config"; // Import konfigurasi (termasuk VAPID key)

// Objek helper untuk mengelola notifikasi push dan service worker
const NotificationHelper = {
  // Inisialisasi helper, menerima fungsi subscribe & unsubscribe dari luar
  async init({ subscribe, unsubscribe }) {
    this._subscribe = subscribe;
    this._unsubscribe = unsubscribe;

    // Cek dukungan Notification API
    if (!("Notification" in window)) {
      console.log("Browser ini tidak mendukung notifikasi");
      return;
    }

    // Daftarkan service worker untuk push notification
    await this._registerServiceWorker();
  },

  // Mendaftarkan service worker
  async _registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker tidak didukung di browser ini");
      return;
    }

    try {
      // Daftarkan service worker di root path agar cakupan luas
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service worker berhasil didaftarkan", registration);

      return registration;
    } catch (error) {
      console.error("Gagal mendaftarkan service worker", error);
      return null;
    }
  },

  // Meminta izin notifikasi ke user, tampilkan dialog konfirmasi
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("Browser ini tidak mendukung notifikasi");
      return;
    }

    // Tampilkan dialog konfirmasi menggunakan SwalNotification
    const result = await SwalNotification.confirm({
      title: "Aktifkan Notifikasi?",
      text: "Kami akan mengirimkan info cerita baru dan update penting.",
      icon: "question",
      confirmText: "Ya, Aktifkan",
      cancelText: "Tidak, Terima kasih",
    });

    if (result.isConfirmed) {
      // Minta izin notifikasi dari browser
      const permission = await window.Notification.requestPermission();

      if (permission === "granted") {
        await this.subscribe(); // Lanjutkan subscribe jika diizinkan
      } else {
        SwalNotification.info("Izin notifikasi ditolak");
      }
    }
  },

  // Melakukan subscribe ke push service
  async subscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        return existingSubscription; // Sudah subscribe
      }

      // Konversi VAPID public key ke Uint8Array
      const vapidPublicKey = CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY;
      const convertedVapidKey = this._urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe ke push manager
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("Berhasil subscribe ke push service", newSubscription);

      await this._subscribe(newSubscription); // Simpan ke server

      SwalNotification.success("Berhasil mengaktifkan notifikasi");
      return newSubscription;
    } catch (error) {
      console.error("Gagal subscribe ke push service", error);
      SwalNotification.error(`Gagal subscribe: ${error.message}`);
      return null;
    }
  },

  // Melakukan unsubscribe dari push service
  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return;
      }

      await subscription.unsubscribe();
      await this._unsubscribe(); // Hapus dari server

      SwalNotification.info("Berhasil menonaktifkan notifikasi");
    } catch (error) {
      console.error("Gagal unsubscribe dari push service", error);
      SwalNotification.error(`Gagal menonaktifkan notifikasi: ${error.message}`);
    }
  },

  // Mengecek apakah user sudah subscribe push notification
  async _isSubscribed() {
    // Tambahkan pengecekan di sini
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.ready) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Gagal memeriksa status subscription", error);
      return false;
    }
  },

  // Utility: konversi VAPID key dari base64 ke Uint8Array
  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },

  // Mengirim notifikasi uji coba ke user
  async sendTestNotification() {
    try {
      console.log("Mengirim notifikasi uji coba");

      if (!("Notification" in window)) {
        SwalNotification.error("Notifikasi tidak didukung di browser ini");
        return;
      }

      if (Notification.permission !== "granted") {
        SwalNotification.warning("Izin notifikasi belum diberikan");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          SwalNotification.error("Izin notifikasi ditolak");
          return;
        }
      }

      // Jika browser mendukung service worker & push API
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;

        // Jika pushManager tersedia, tampilkan notifikasi via service worker
        if ("pushManager" in registration) {
          const testPayload = {
            title: "Notifikasi Uji Coba",
            message: "Ini adalah notifikasi uji coba dari aplikasi!",
            url: "/",
          };

          // Tampilkan notifikasi menggunakan service worker
          registration.showNotification(testPayload.title, {
            body: testPayload.message,
            icon: "images/story.svg",
            badge: "images/logo.png",
            data: {
              url: testPayload.url,
            },
          });

          SwalNotification.success("Notifikasi uji coba berhasil dikirim!");
        } else {
          // Fallback: pakai Notification API langsung
          new Notification("Notifikasi Uji Coba", {
            body: "Ini adalah notifikasi uji coba dari aplikasi!",
            icon: "images/story.svg",
          });
        }
      } else {
        // Fallback jika tidak ada service worker
        new Notification("Notifikasi Uji Coba", {
          body: "Ini adalah notifikasi uji coba (API browser dasar)",
          icon: "images/story.svg",
        });
      }
    } catch (error) {
      console.error("Gagal mengirim notifikasi uji coba", error);
      SwalNotification.error(`Gagal mengirim notifikasi uji coba: ${error.message}`);
    }
  },

  // Render tombol subscribe/unsubscribe pada elemen container
  async renderSubscribeButton(containerElement) {
    try {
      const isSubscribed = await this._isSubscribed();

      containerElement.innerHTML = "";

      const button = document.createElement("button");
      button.classList.add("btn", "notification-button");

      if (isSubscribed) {
        // Jika sudah subscribe, tampilkan dropdown dengan opsi
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "notification-dropdown";

        const mainButton = document.createElement("button");
        mainButton.classList.add("btn", "notification-button");
        mainButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi <i class="fas fa-caret-down"></i>';

        const dropdownContent = document.createElement("div");
        dropdownContent.className = "notification-dropdown-content";

        const testLink = document.createElement("a");
        testLink.href = "javascript:void(0)";
        testLink.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Uji Coba';
        testLink.addEventListener("click", async () => {
          await this.sendTestNotification();
        });

        const disableLink = document.createElement("a");
        disableLink.href = "javascript:void(0)";
        disableLink.innerHTML = '<i class="fas fa-bell-slash"></i> Nonaktifkan';
        disableLink.addEventListener("click", async () => {
          await this.unsubscribe();
          this.renderSubscribeButton(containerElement);
        });

        dropdownContent.appendChild(testLink);
        dropdownContent.appendChild(disableLink);

        buttonContainer.appendChild(mainButton);
        buttonContainer.appendChild(dropdownContent);

        containerElement.appendChild(buttonContainer);
      } else {
        // Jika belum subscribe, tampilkan tombol enable
        button.innerHTML = '<i class="fas fa-bell"></i> Aktifkan Notifikasi';
        button.addEventListener("click", async () => {
          await this.requestPermission();
          this.renderSubscribeButton(containerElement);
        });

        containerElement.appendChild(button);
      }
    } catch (error) {
      console.error("Gagal menampilkan tombol notifikasi", error);
    }
  },
};

export default NotificationHelper; // Ekspor helper notifikasi
