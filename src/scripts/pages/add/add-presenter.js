// Kelas AddPresenter berfungsi sebagai jembatan antara tampilan (AddPage) dan model (API/data)
export default class AddPresenter {
  #view; // Tampilan (form/halaman) yang akan dihubungkan
  #model; // Model (API/data) yang digunakan

  // Konstruktor menerima objek view dan model sebagai parameter
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  // Memanggil metode inisialisasi peta pada view
  async showAdd() {
    await this.#view.initMap();
  }

  // Metode untuk mengirim data cerita baru ke model/API
  async postStory({ description, photo, lat, lon }) {
    try {
      // Validasi bahwa foto harus berupa objek File
      if (!photo || !(photo instanceof File)) {
        throw new Error("Foto tidak valid: Harus berupa objek File.");
      }

      // Mengirim data ke model (API) untuk membuat cerita baru
      const response = await this.#model.createNewStory({
        description,
        photo,
        lat: lat !== null ? lat : undefined,
        lon: lon !== null ? lon : undefined,
      });

      // Jika terjadi error pada response, lempar error
      if (response.error) {
        throw new Error(response.message || "Gagal membuat cerita");
      }

      // Jika cerita disimpan secara lokal (offline/tertunda)
      if (response.isPending) {
        this.#view.addPendingSuccess("Cerita berhasil disimpan secara lokal dan akan diunggah saat online");
      } else {
        // Jika berhasil diunggah ke server
        this.#view.addSuccess("Cerita berhasil dibuat!");
      }
    } catch (error) {
      // Jika gagal, tampilkan notifikasi gagal pada view
      this.#view.addFailed(error.message || "Gagal membuat cerita");
    }
  }
}
