import Swal from "sweetalert2"; // Import SweetAlert2

// Pengaturan toast untuk notifikasi singkat di pojok kanan atas
const Toast = Swal.mixin({
  toast: true, // Mode toast, bukan dialog modal
  position: "top-end", // Letak di kanan atas layar
  showConfirmButton: false, // Tidak menampilkan tombol OK
  timer: 3000, // Durasi tampil 3 detik
  timerProgressBar: true, // Progress bar waktu tampil
  didOpen: (toast) => {
    // Timer berhenti saat mouse di atas, lanjut saat mouse keluar
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    container: "swal-toast-container", // Kelas CSS khusus untuk container toast
    popup: "swal-toast-popup", // Kelas CSS khusus untuk popup toast
  },
});

// Objek utilitas untuk berbagai jenis notifikasi
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
      title: options.title || "Are you sure?",
      text: options.text || "",
      icon: options.icon || "warning",
      showCancelButton: true,
      confirmButtonColor: "#14b8a6",
      cancelButtonColor: "#d33",
      confirmButtonText: options.confirmText || "Yes",
      cancelButtonText: options.cancelText || "Cancel",
    });
  },

  // Dialog alert/info (modal dengan satu tombol OK)
  alert(options) {
    return Swal.fire({
      title: options.title || "Notice",
      text: options.text || "",
      icon: options.icon || "info",
      confirmButtonColor: "#14b8a6",
    });
  },
};

export default Notification; // Ekspor utilitas notifikasi
