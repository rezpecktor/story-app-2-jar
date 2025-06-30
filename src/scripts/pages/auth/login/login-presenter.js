// Kelas LoginPresenter berperan sebagai perantara antara view (LoginPage), model API, dan model autentikasi
export default class LoginPresenter {
  #view; // View (halaman login) yang akan dihubungkan
  #model; // Model (API/data) untuk proses login
  #authModel; // Model untuk pengelolaan token autentikasi

  // Konstruktor menerima objek view, model API, dan model autentikasi
  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  // Fungsi untuk menangani proses login user
  async loginUser({ email, password }) {
    try {
      // Memanggil API login melalui model
      const response = await this.#model.loginUser({ email, password });

      // Jika login tidak berhasil, panggil view untuk menampilkan pesan gagal
      if (!response.ok) {
        this.#view.loginFailed(response.message);
        return;
      }

      // Jika login sukses, simpan token ke authModel dan tampilkan pesan sukses
      this.#authModel.putAccessToken(response.loginResult.token);
      this.#view.loginSuccess(response.message, response.loginResult);
    } catch (error) {
      // Jika terjadi error, tampilkan pesan gagal pada view
      this.#view.loginFailed(error.message);
    }
  }
}
