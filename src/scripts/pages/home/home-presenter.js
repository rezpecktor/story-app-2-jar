// Kelas HomePresenter bertugas sebagai penghubung antara view (HomePage), model API, dan model favorit (IndexedDB)
export default class HomePresenter {
  #view; // View (halaman home) yang akan dihubungkan
  #model; // Model (API/data) untuk cerita
  #favoriteModel; // Model (IndexedDB/data) untuk cerita favorit

  // Konstruktor menerima objek view, model API, dan model favorit
  constructor({ view, model, favoriteModel }) {
    this.#view = view;
    this.#model = model;
    this.#favoriteModel = favoriteModel;
  }

  // Menampilkan daftar cerita ke view
  async showHome() {
    try {
      // Mengambil daftar cerita dari model (API)
      const response = await this.#model.getStories();

      // Jika API mengembalikan error, lempar error
      if (response.error) {
        throw new Error(response.message || "Tidak dapat memuat cerita");
      }

      // Simpan cerita ke IndexedDB untuk akses offline
      if (response.listStory && response.listStory.length) {
        await this.#favoriteModel.putStories(response.listStory);
      }

      // Tampilkan daftar cerita ke view
      this.#view.showStories(response.message || "Cerita berhasil dimuat", response.listStory, response.fromCache);
    } catch (error) {
      // Jika gagal, tampilkan pesan error di view
      this.#view.showErrorStoryList(error.message || "Tidak dapat memuat cerita");
    }
  }
}
