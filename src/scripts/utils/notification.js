import Swal from "sweetalert2"; // Import library SweetAlert2

// Konfigurasi toast untuk notifikasi singkat di pojok atas
const Toast = Swal.mixin({
  toast: true, // Mode toast (bukan modal)
  position: "top-end", // Posisi toast di kanan atas layar
  showConfirmButton: false, // Tidak tampilkan tombol konfirmasi
  timer: 3000, // Durasi tampil 3 detik
  timerProgressBar: true, // Tampilkan progress bar waktu
  didOpen: (toast) => {
    // Pause/resume timer saat mouse hover pada toast
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    container: "swal-toast-container", // Kelas CSS custom untuk container toast
    popup: "swal-toast-popup", // Kelas CSS custom untuk popup toast
  },
});

// Objek helper untuk berbagai tipe notifikasi
const Notification = {
  // Notifikasi sukses (ikon hijau)
  success(message) {
    Toast.fire({
      icon: "success",
      title: message,
    });
  },

  // Notifikasi error (ikon merah)
  error(message) {
    Toast.fire({
      icon: "error",
      title: message,
    });
  },

  // Notifikasi info (ikon biru)
  info(message) {
    Toast.fire({
      icon: "info",
      title: message,
    });
  },

  // Notifikasi warning (ikon kuning)
  warning(message) {
    Toast.fire({
      icon: "warning",
      title: message,
    });
  },

  // Dialog konfirmasi (modal dengan tombol Ya/Batal)
  confirm(options) {
    return Swal.fire({
      title: options.title || "Konfirmasi",
      text: options.text || "",
      icon: options.icon || "warning",
      showCancelButton: true,
      confirmButtonColor: "#14b8a6",
      cancelButtonColor: "#d33",
      confirmButtonText: options.confirmText || "Ya",
      cancelButtonText: options.cancelText || "Batal",
    });
  },

  // Dialog alert/info (modal dengan satu tombol OK)
  alert(options) {
    return Swal.fire({
      title: options.title || "Info",
      text: options.text || "",
      icon: options.icon || "info",
      confirmButtonColor: "#14b8a6",
    });
  },
};

export default Notification; // Ekspor helper notifikasi
