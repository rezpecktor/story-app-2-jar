import "../styles/styles.css"; // Import stylesheet utama aplikasi
import "../styles/responsives.css"; // Import stylesheet untuk responsivitas
import "tiny-slider/dist/tiny-slider.css"; // Import stylesheet untuk slider
import "leaflet/dist/leaflet.css"; // Import stylesheet untuk peta
import "sweetalert2/dist/sweetalert2.min.css"; // Import stylesheet untuk SweetAlert

import App from "./pages/app"; // Import kelas utama aplikasi
import Camera from "./utils/camera"; // Import utilitas kamera
import Swal from "sweetalert2"; // Import SweetAlert untuk popup
import NotificationHelper from "./utils/notification-helper"; // Import helper notifikasi push
import "idb"; // Import wrapper IndexedDB

// Variabel untuk menyimpan event install aplikasi (PWA)
let deferredPrompt;

// Fungsi global untuk menampilkan popup "Segera Hadir"
window.showComingSoonFeature = function () {
  Swal.fire({
    title: "Segera Hadir!",
    text: "Fitur ini belum tersedia, nantikan update selanjutnya.",
    icon: "info",
    confirmButtonColor: "#14b8a6",
    confirmButtonText: "Oke",
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  });
};

// Registrasi service worker untuk mendukung PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Hanya lakukan registrasi jika belum ada controller aktif
      if (!navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("ServiceWorker berhasil didaftarkan dengan scope: ", registration.scope);
      }
    } catch (error) {
      console.log("Gagal mendaftarkan ServiceWorker: ", error);
    }
  });
}

// Event sebelum prompt install aplikasi (PWA) muncul
window.addEventListener("beforeinstallprompt", (event) => {
  // Cegah prompt default agar bisa dikendalikan manual
  event.preventDefault();

  // Simpan event untuk digunakan saat tombol install diklik
  deferredPrompt = event;

  // Tampilkan tombol install aplikasi
  showInstallButton();
});

// Fungsi untuk menampilkan tombol install aplikasi di navigasi
function showInstallButton() {
  const navList = document.getElementById("navlist");
  if (!navList) return;

  // Cek jika tombol sudah pernah dibuat
  if (document.getElementById("install-button")) return;

  const installItem = document.createElement("li");
  const installButton = document.createElement("button");
  installButton.id = "install-button";
  installButton.className = "btn install-button";
  installButton.innerHTML = '<i class="fas fa-download"></i> Install Aplikasi';

  // Event klik tombol install aplikasi
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    // Tampilkan prompt install aplikasi
    deferredPrompt.prompt();

    // Tunggu respon pengguna
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Respon pengguna terhadap prompt install: ${outcome}`);

    // Setelah digunakan, hapus event
    deferredPrompt = null;

    // Sembunyikan tombol install
    installItem.style.display = "none";
  });

  installItem.appendChild(installButton);
  navList.appendChild(installItem);
}

// Event ketika aplikasi berhasil diinstall sebagai PWA
window.addEventListener("appinstalled", (event) => {
  console.log("Aplikasi berhasil diinstall", event);
  // Sembunyikan tombol install jika masih ada
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.parentElement.style.display = "none";
  }
});

let appInstance = null;

// Inisialisasi aplikasi saat DOM sudah siap
document.addEventListener("DOMContentLoaded", async () => {
  if (appInstance) {
    console.warn("Aplikasi sudah diinisialisasi, proses dilewati");
    return;
  }

  // Buat instance App dan render halaman utama
  appInstance = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await appInstance.renderPage();

  // Render ulang halaman saat hash URL berubah (navigasi SPA)
  window.addEventListener("hashchange", async () => {
    if (appInstance) {
      // Pastikan kamera dimatikan sebelum pindah halaman
      Camera.stopAllStreams();

      // Render halaman baru
      await appInstance.renderPage();
    }
  });

  // Cek jika aplikasi berjalan dalam mode standalone (PWA)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    console.log("Aplikasi berjalan dalam mode standalone (sudah diinstall sebagai PWA)");
  }
});

// Pastikan semua resource kamera dibersihkan saat halaman di-reload/ditutup
window.addEventListener("beforeunload", () => {
  // Matikan semua stream kamera aktif
  Camera.stopAllStreams();
});
