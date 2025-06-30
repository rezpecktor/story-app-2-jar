import { getActiveRoute, getActivePathname } from "../routes/url-parser";
import NotificationHelper from "../utils/notification-helper";
import { getAccessToken, getLogout } from "../utils/auth";
import { transitionHelper } from "../utils";
import { getPage } from "../routes/routes";
import * as StoryAPI from "../data/api";
import Notification from "../utils/notification";
import { generateMainNavigationListTemplate, generateUnauthenticatedNavigationListTemplate, generateAuthenticatedNavigationListTemplate } from "../templates";

// Kelas App bertanggung jawab untuk inisialisasi aplikasi, navigasi, notifikasi, dan status jaringan
class App {
  #content;
  #drawerButton;
  #navigationDrawer;
  #isOnline = navigator.onLine;
  currentPage = null; // Menyimpan halaman aktif untuk cleanup

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer(); // Setup event drawer navigasi
    this._setupSkipLink(); // Setup skip link aksesibilitas
    this._initPushNotification(); // Inisialisasi push notification
    this._setupNetworkStatusListener(); // Setup listener status online/offline
  }

  // Setup listener status jaringan dan update banner offline/online
  _setupNetworkStatusListener() {
    window.addEventListener("online", () => {
      this.#isOnline = true;
      Notification.success("Anda kembali online!");
      this._updateOfflineBanner(false);
    });

    window.addEventListener("offline", () => {
      this.#isOnline = false;
      Notification.warning("Kamu masih offline.");
      this._updateOfflineBanner(true);
    });

    // Initial check
    this._updateOfflineBanner(!this.#isOnline);
  }

  // Tampilkan atau sembunyikan banner offline di atas halaman
  _updateOfflineBanner(show) {
    let banner = document.getElementById("offline-banner");

    // Jika status tidak berubah, tidak perlu update
    if ((show && banner) || (!show && !banner)) {
      return;
    }

    if (show) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "offline-banner";
        banner.className = "offline-banner";
        banner.innerHTML = '<i class="fas fa-wifi-slash"></i> Kamu offline';
        document.body.prepend(banner);
      }
    } else {
      if (banner) {
        banner.remove();
      }
    }
  }

  // Inisialisasi push notification dan handle subscribe/unsubscribe
  async _initPushNotification() {
    await NotificationHelper.init({
      subscribe: async (subscription) => {
        try {
          if (this.#isOnline) {
            await StoryAPI.subscribePushNotification(subscription);
          } else {
            // Jika offline, queue untuk dikirim saat online
            this._queueSubscriptionWhenOnline(subscription);
          }
          return true;
        } catch (error) {
          console.error("gagal ke store subscription dalam server", error);
          return false;
        }
      },
      unsubscribe: async () => {
        try {
          if (this.#isOnline) {
            await StoryAPI.unsubscribePushNotification();
          } else {
            // Jika offline, queue untuk dikirim saat online
            this._queueUnsubscriptionWhenOnline();
          }
          return true;
        } catch (error) {
          console.error("gagal menghapus subscription dari server", error);
          return false;
        }
      },
    });
  }

  // Queue subscribe push notification saat online
  _queueSubscriptionWhenOnline(subscription) {
    const handleOnline = async () => {
      try {
        await StoryAPI.subscribePushNotification(subscription);
        window.removeEventListener("online", handleOnline);
      } catch (error) {
        console.error("gagal mengirim queued subscription", error);
      }
    };
    window.addEventListener("online", handleOnline);
  }

  // Queue unsubscribe push notification saat online
  _queueUnsubscriptionWhenOnline() {
    const handleOnline = async () => {
      try {
        await StoryAPI.unsubscribePushNotification();
        window.removeEventListener("online", handleOnline);
      } catch (error) {
        console.error("gagal mengirim queued unsubscription", error);
      }
    };
    window.addEventListener("online", handleOnline);
  }

  // Setup skip link untuk aksesibilitas (lompat ke konten utama)
  _setupSkipLink() {
    const skipLink = document.getElementById("skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (event) => {
        event.preventDefault();
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.setAttribute("tabindex", "-1");
          mainContent.focus();
          mainContent.scrollIntoView();
        }
      });
    }
  }

  // Setup drawer navigasi (buka/tutup menu samping)
  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      const isTargetInsideDrawer = this.#navigationDrawer.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  // Setup daftar navigasi utama dan tombol logout sesuai status login
  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#navigationDrawer.children.namedItem("navlist-main");
    const navList = this.#navigationDrawer.children.namedItem("navlist");

    const currentPath = getActivePathname();

    if (!isLogin) {
      navListMain.innerHTML = "";
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();

      // Inisialisasi tombol push notification untuk user belum login
      const pushToolsContainer = document.getElementById("push-notification-tools");
      if (pushToolsContainer) {
        NotificationHelper.renderSubscribeButton(pushToolsContainer);
      }
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();

    const isAddPage = currentPath === "/add";
    navList.innerHTML = generateAuthenticatedNavigationListTemplate(isAddPage);

    // Inisialisasi tombol push notification untuk user login
    const pushToolsContainer = document.getElementById("push-notification-tools");
    if (pushToolsContainer) {
      NotificationHelper.renderSubscribeButton(pushToolsContainer);
    }

    // Setup tombol logout
    const logoutButton = document.getElementById("btn-logout");
    if (logoutButton) {
      logoutButton.addEventListener("click", (event) => {
        event.preventDefault();

        Notification.confirm({
          title: "Apakah dirimu sangat yakin ingin keluar?",
          text: "Anda perlu login untuk mengakses akun",
          icon: "question",
          confirmText: "Ya, Logout",
        }).then((result) => {
          if (result.isConfirmed) {
            getLogout();
            Notification.success("Logout akun berhasil");
            location.hash = "/login";
          }
        });
      });
    }
  }

  // Render halaman sesuai route aktif
  async renderPage() {
    const url = getActiveRoute();

    // Ambil page untuk route ini
    const page = getPage(url);

    // Bersihkan halaman sebelumnya jika ada cleanup
    if (this.currentPage && typeof this.currentPage.cleanup === "function") {
      this.currentPage.cleanup();
    }

    // Simpan halaman aktif untuk cleanup berikutnya
    this.currentPage = page;

    const mainContent = this.#content;
    mainContent.style.opacity = 0.5;

    const transition = transitionHelper({
      updateDOM: async () => {
        try {
          this.#content.innerHTML = `
            <main id="main-content" tabindex="-1">
              ${await page.render()}
            </main>
          `;
          await page.afterRender();

          // Update offline status jika perlu
          this._updateOfflineBanner(!this.#isOnline);
        } finally {
          mainContent.style.opacity = 1;
        }
      },
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: "smooth" });
      this.#setupNavigationList();
    });
  }
}

export default App;
