// Kelas LoadingIndicator digunakan untuk menampilkan dan menyembunyikan indikator loading pada elemen HTML tertentu
export default class LoadingIndicator {
  // Menampilkan loading indicator pada elemen dengan id tertentu
  static show(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // Jika container tidak ditemukan, hentikan fungsi

    container.innerHTML = ""; // Bersihkan isi container
    container.classList.add("loading-container"); // Tambahkan class untuk styling loading

    const loader = document.createElement("div"); // Buat elemen div baru untuk loader
    loader.className = "loader"; // Tambahkan class loader (biasanya untuk animasi CSS)
    container.appendChild(loader); // Masukkan loader ke dalam container

    container.style.display = "flex"; // Tampilkan container dengan display flex
  }

  // Menyembunyikan loading indicator dari elemen dengan id tertentu
  static hide(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // Jika container tidak ditemukan, hentikan fungsi

    container.innerHTML = ""; // Bersihkan isi container
    container.classList.remove("loading-container"); // Hapus class loading
    container.style.display = "none"; // Sembunyikan container
  }

  // Menampilkan loading pada tombol, mengganti teks tombol dengan animasi loading
  static showButtonLoading(button, originalText) {
    if (!button._originalText) {
      button._originalText = originalText || button.textContent; // Simpan teks asli tombol
    }

    button.disabled = true; // Nonaktifkan tombol
    button.innerHTML = '<i class="loader-button fas fa-spinner"></i> Memproses...'; // Ganti isi tombol dengan loading
    return button;
  }

  // Mengembalikan tombol ke kondisi semula setelah loading selesai
  static hideButtonLoading(button) {
    if (button._originalText) {
      button.innerHTML = button._originalText; // Kembalikan teks asli tombol
    }
    button.disabled = false; // Aktifkan kembali tombol
    return button;
  }
}
