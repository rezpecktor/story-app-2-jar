import Notification from "../../../utils/notification";
import RegisterPresenter from "./register-presenter";
import * as StoryAPI from "../../../data/api";
import LoadingIndicator from "../../../components/loading";

// Kelas RegisterPage bertanggung jawab untuk tampilan dan logika halaman registrasi akun
export default class RegisterPage {
  #presenter = null; // Presenter untuk menghubungkan view dan model

  // Render tampilan form registrasi
  async render() {
    return `
      <section class="register-container">
        <article class="register-form-container">
          <h1 class="register__title">Daftar akun</h1>

          <form id="register-form" class="register-form">
            <div class="form-control">
              <label for="name-input" class="register-form__name-title">Nama</label>
              <div class="register-form__title-container">
                <input id="name-input" type="text" name="name" placeholder="Masukkan nama Anda" required aria-required="true">
              </div>
            </div>
            <div class="form-control">
              <label for="email-input" class="register-form__email-title">Email</label>
              <div class="register-form__title-container">
                <input id="email-input" type="email" name="email" placeholder="Contoh: nama@email.com" required aria-required="true">
              </div>
            </div>
            <div class="form-control">
              <label for="password-input" class="register-form__password-title">Password</label>
              <div class="register-form__title-container">
                <input id="password-input" type="password" name="password" placeholder="Masukkan password" required aria-required="true" minlength="6">
              </div>
            </div>
            <div class="form-buttons register-form__form-buttons">
              <div id="submit-button-container">
                <button class="btn" type="submit">Daftar akun</button>
              </div>
              <p class="register-form__already-have-account">Sudah punya akun? <a href="#/login">Masuk</a></p>
            </div>
          </form>
        </article>
      </section>
    `;
  }

  // Dipanggil setelah render, untuk setup presenter dan event handler form
  async afterRender() {
    this.#presenter = new RegisterPresenter({
      view: this,
      model: StoryAPI,
    });

    this.#setupForm();
  }

  // Setup event listener pada form registrasi
  #setupForm() {
    const registerForm = document.getElementById("register-form");
    const submitButton = document.querySelector("#submit-button-container button");

    // Event submit form registrasi
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Tampilkan loading pada tombol submit
      LoadingIndicator.showButtonLoading(submitButton);

      const data = {
        name: document.getElementById("name-input").value,
        email: document.getElementById("email-input").value,
        password: document.getElementById("password-input").value,
      };

      try {
        // Proses registrasi lewat presenter
        await this.#presenter.registerUser(data);
      } catch (error) {
        // Jika gagal, tampilkan notifikasi gagal
        this.registerFailed(error.message);
      } finally {
        // Sembunyikan loading pada tombol submit
        LoadingIndicator.hideButtonLoading(submitButton);
      }
    });
  }

  // Menampilkan notifikasi jika registrasi berhasil
  registerSuccess(message) {
    Notification.success(message || "Akun berhasil dibuat!");
    location.hash = "/login";
  }

  // Menampilkan notifikasi jika registrasi gagal
  registerFailed(message) {
    Notification.error(message || "Pendaftaran gagal. Silakan coba lagi.");
  }
}
