// Kelas FavoritesPresenter bertugas sebagai penghubung antara view (FavoritesPage) dan model (IndexedDB/data favorit)
export default class FavoritesPresenter {
  #view; // View (halaman daftar favorit) yang akan dihubungkan
  #favoriteModel; // Model (IndexedDB/data) untuk cerita favorit

  // Konstruktor menerima objek view dan model favorit
  constructor({ view, favoriteModel }) {
    this.#view = view;
    this.#favoriteModel = favoriteModel;
  }

  // Menampilkan daftar cerita favorit ke view
  async showFavorites() {
    try {
      // Mengambil seluruh cerita favorit dari model
      const favorites = await this.#favoriteModel.getFavoriteStories();
      // Tampilkan daftar favorit pada view
      this.#view.showFavoriteStories(favorites);
    } catch (error) {
      // Jika terjadi kegagalan, tampilkan pesan error pada view
      console.error("Gagal mengambil daftar favorit:", error);
      this.#view.showError("Tidak dapat memuat daftar cerita favorit: " + error.message);
    }
  }

  // Menghapus cerita dari daftar favorit (toggle off)
  async toggleFavorite(storyId) {
    try {
      // Periksa apakah cerita sudah ada di daftar favorit
      const story = await this.#favoriteModel.getFavoriteStory(storyId);
      if (story) {
        // Jika ditemukan, hapus dari favorit
        await this.#favoriteModel.deleteFavoriteStory(storyId);
        return { isFavorite: false, message: "Cerita dihapus dari favorit" };
      }
      // Jika tidak ditemukan, kembalikan pesan
      return { isFavorite: false, message: "Cerita tidak ditemukan" };
    } catch (error) {
      // Jika gagal, kembalikan error
      console.error("Gagal mengubah status favorit:", error);
      return { error: true, message: error.message };
    }
  }
}
