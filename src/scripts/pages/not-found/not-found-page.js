import Notification from "../../utils/notification";

// Kelas NotFoundPage bertanggung jawab untuk menampilkan halaman 404 (tidak ditemukan)
export default class NotFoundPage {
  // Render tampilan halaman 404
  async render() {
    return `
      <section class="not-found-container">
        <div class="not-found-content">
          <img src="images/404.svg" alt="Page not found" class="not-found-image">
          <h1 class="not-found-title">404 - Page Not Found</h1>
          <p class="not-found-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div class="not-found-actions">
            <a href="#/" class="btn not-found-home-button">
              <i class="fas fa-home"></i> Go to Home
            </a>
          </div>
        </div>
      </section>
    `;
  }

  // Dipanggil setelah render, bisa digunakan untuk menampilkan notifikasi
  async afterRender() {
    // Tampilkan notifikasi info bahwa halaman tidak ditemukan
    Notification.info("Halaman tidak ditemukan. Kamu dialihkan ke halaman 404.");
  }
}
