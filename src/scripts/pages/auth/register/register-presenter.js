// Kelas RegisterPresenter bertugas sebagai penghubung antara view (RegisterPage) dan model (API/data)
export default class RegisterPresenter {
  #view; // View (halaman registrasi) yang akan dihubungkan
  #model; // Model (API/data) untuk registrasi

  // Konstruktor menerima objek view dan model
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  // Fungsi untuk memproses registrasi user baru
  async registerUser({ name, email, password }) {
    try {
      // Memanggil API registrasi melalui model
      const response = await this.#model.registerUser({
        name,
        email,
        password,
      });

      // Jika pendaftaran gagal, panggil view untuk menampilkan notifikasi gagal
      if (!response.ok) {
        this.#view.registerFailed(response.message);
        return;
      }

      // Jika pendaftaran berhasil, panggil view untuk menampilkan notifikasi sukses
      this.#view.registerSuccess(response.message, response.data);
    } catch (error) {
      // Jika terjadi error, tampilkan notifikasi gagal pada view
      this.#view.registerFailed(error.message);
    }
  }
}
