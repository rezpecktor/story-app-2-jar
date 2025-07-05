// Ganti seluruh isi file notification-helper.js dengan kode ini

import SwalNotification from "./notification"; // Import utilitas notifikasi swal
import CONFIG from "../config"; // Import konfigurasi (termasuk VAPID key)

// Objek utilitas untuk mengelola notifikasi push dan service worker
const NotificationHelper = {
  // Inisialisasi helper, menerima fungsi subscribe & unsubscribe dari luar
  async init({ subscribe, unsubscribe }) {
    this._subscribe = subscribe;
    this._unsubscribe = unsubscribe;

    // Periksa apakah Notification API didukung
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Daftarkan service worker untuk push notification
    await this._registerServiceWorker();
  },

  // Mendaftarkan service worker
  async _registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported in the browser");
      return;
    }

    try {
      // Registrasi service worker di root path agar jangkauan maksimal
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service worker registered", registration);

      return registration;
    } catch (error) {
      console.error("Failed to register service worker", error);
      return null;
    }
  },

  // Meminta izin notifikasi ke user, tampilkan dialog konfirmasi
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Tampilkan dialog konfirmasi menggunakan SwalNotification
    const result = await SwalNotification.confirm({
      title: "Enable Notifications?",
      text: "We'll notify you about new stories and important updates",
      icon: "question",
      confirmText: "Yes, Enable",
      cancelText: "No, Thanks",
    });

    if (result.isConfirmed) {
      // Ajukan permintaan izin notifikasi ke browser
      const permission = await window.Notification.requestPermission();

      if (permission === "granted") {
        await this.subscribe(); // Lanjutkan subscribe jika diizinkan
      } else {
        SwalNotification.info("Notification permission denied");
      }
    }
  },

  // Melakukan subscribe ke push service
  async subscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        return existingSubscription; // Sudah terdaftar
      }

      // Ubah VAPID public key ke Uint8Array
      const vapidPublicKey = CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY;
      const convertedVapidKey = this._urlBase64ToUint8Array(vapidPublicKey);

      // Lakukan subscribe ke push manager
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("Successfully subscribed to push service", newSubscription);

      await this._subscribe(newSubscription); // Simpan ke server

      SwalNotification.success("Successfully subscribed to notifications");
      return newSubscription;
    } catch (error) {
      console.error("Failed to subscribe to push service", error);
      SwalNotification.error(`Failed to subscribe: ${error.message}`);
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

      SwalNotification.info("Successfully unsubscribed from notifications");
    } catch (error) {
      console.error("Failed to unsubscribe from push service", error);
      SwalNotification.error(`Failed to unsubscribe: ${error.message}`);
    }
  },

  // Mengecek apakah user sudah subscribe push notification
  async _isSubscribed() {
    // Tambahkan pengecekan di sini untuk mengatasi error
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.ready) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription status", error);
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
      console.log("Sending test notification");

      if (!("Notification" in window)) {
        SwalNotification.error("Notifications are not supported in this browser");
        return;
      }

      if (Notification.permission !== "granted") {
        SwalNotification.warning("Notification permission not granted");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          SwalNotification.error("Permission denied for notifications");
          return;
        }
      }

      // Jika browser mendukung service worker & push API
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;

        // Jika pushManager tersedia, tampilkan notifikasi via service worker
        if ("pushManager" in registration) {
          const testPayload = {
            title: "Test Notification",
            message: "This is a test notification from your app!",
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

          SwalNotification.success("Test notification sent!");
        } else {
          // Alternatif: gunakan Notification API langsung
          new Notification("Test Notification", {
            body: "This is a test notification from your app!",
            icon: "images/story.svg",
          });
        }
      } else {
        // Alternatif jika tidak ada service worker
        new Notification("Test Notification", {
          body: "This is a test notification (basic browser API)",
          icon: "images/story.svg",
        });
      }
    } catch (error) {
      console.error("Failed to send test notification", error);
      SwalNotification.error(`Failed to send test notification: ${error.message}`);
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
        mainButton.innerHTML = '<i class="fas fa-bell"></i> Notifications <i class="fas fa-caret-down"></i>';

        const dropdownContent = document.createElement("div");
        dropdownContent.className = "notification-dropdown-content";

        const testLink = document.createElement("a");
        testLink.href = "javascript:void(0)";
        testLink.innerHTML = '<i class="fas fa-paper-plane"></i> Send Test';
        testLink.addEventListener("click", async () => {
          await this.sendTestNotification();
        });

        const disableLink = document.createElement("a");
        disableLink.href = "javascript:void(0)";
        disableLink.innerHTML = '<i class="fas fa-bell-slash"></i> Disable';
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
        button.innerHTML = '<i class="fas fa-bell"></i> Enable Notifications';
        button.addEventListener("click", async () => {
          await this.requestPermission();
          this.renderSubscribeButton(containerElement);
        });

        containerElement.appendChild(button);
      }
    } catch (error) {
      console.error("Failed to render subscribe button", error);
    }
  },
};

export default NotificationHelper;
