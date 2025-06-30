import LoadingIndicator from "../../../components/loading";
import LoginPresenter from "./login-presenter";
import * as AuthModel from "../../../utils/auth";
import Notification from "../../../utils/notification";
import * as StoryAPI from "../../../data/api";

// Kelas LoginPage bertugas mengatur tampilan dan proses pada halaman login
export default class LoginPage {
  #presenter = null; // Presenter sebagai penghubung antara view dan model

  // Menampilkan form login ke halaman
  async render() {
    return `
      <section class="login-container">
        <article class="login-form-container">
          <h1 class="login__title">Masuk akun</h1>
          <form id="login-form" class="login-form">
            <div class="form-control">
              <label for="email-input" class="login-form__email-title">Email</label>
              <div class="login-form__title-container">
                <input id="email-input" type="email" name="email" placeholder="Contoh: nama@email.com" required aria-required="true">
              </div>
            </div>
            <div class="form-control">
              <label for="password-input" class="login-form__password-title">Password</label>
              <div class="login-form__title-container">
                <input id="password-input" type="password" name="password" placeholder="Masukkan password Anda" required aria-required="true">
              </div>
            </div>
            <div class="form-buttons login-form__form-buttons">
              <div id="submit-button-container">
                <button class="btn" type="submit">Masuk</button>
              </div>
              <p class="login-form__do-not-have-account">Belum punya akun? <a href="#/register">Daftar</a></p>
            </div>
          </form>
        </article>
      </section>
    `;
  }

  // Dipanggil setelah render, untuk inisialisasi presenter dan event handler form
  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: StoryAPI,
      authModel: AuthModel,
    });

    this.#setupForm();
  }

  // Menambahkan event listener pada form login
  #setupForm() {
    const loginForm = document.getElementById("login-form");
    const submitButton = document.querySelector("#submit-button-container button");

    // Event ketika form login disubmit
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Tampilkan indikator loading pada tombol submit
      LoadingIndicator.showButtonLoading(submitButton);

      const data = {
        email: document.getElementById("email-input").value,
        password: document.getElementById("password-input").value,
      };

      try {
        // Jalankan proses login melalui presenter
        await this.#presenter.loginUser(data);
      } catch (error) {
        // Jika login gagal, tampilkan pesan error
        this.loginFailed(error.message);
      } finally {
        // Sembunyikan indikator loading pada tombol submit
        LoadingIndicator.hideButtonLoading(submitButton);
      }
    });
  }

  // Menampilkan notifikasi jika login berhasil
  loginSuccess(message) {
    Notification.success(message || "Berhasil masuk!");
    location.hash = "/";
  }

  // Menampilkan notifikasi jika login gagal
  loginFailed(message) {
    Notification.error(message || "Gagal masuk. Silakan coba lagi.");
  }
}
