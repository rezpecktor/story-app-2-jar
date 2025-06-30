import { showFormattedDate } from "./utils/index";

// Template loader animasi (untuk loading biasa)
export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

// Template loader absolute (untuk loading posisi absolute di tengah)
export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

// Template navigasi utama (hanya judul aplikasi)
export function generateMainNavigationListTemplate() {
  return `
    <li>Tempat berbagi cerita</li>
  `;
}

// Template navigasi jika user belum login
export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Register</a></li>
  `;
}

// Template navigasi jika user sudah login
export function generateAuthenticatedNavigationListTemplate(activePathname) {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li>
      <a href="#/" class="${activePathname === "/" ? "active" : ""}">
        <i class="fas fa-home" aria-hidden="true"></i>
        <span>Beranda</span>
      </a>
    </li>
    <li>
      <a href="#/add" class="${activePathname === "/add" ? "active" : ""}">
        <i class="fas fa-plus" aria-hidden="true"></i>
        <span>Tambah Cerita</span>
      </a>
    </li>
    <li>
      <a href="#/favorites" class="${activePathname === "/favorites" ? "active" : ""}">
        <i class="fas fa-heart" aria-hidden="true"></i>
        <span>Favorit</span>
      </a>
    </li>
    <li>
      <button class="btn-logout" id="btn-logout">
        <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
        <span>Keluar</span>
      </button>
    </li>
  `;
}

// Template jika daftar cerita kosong
export function generateStoriesEmptyListTemplate() {
  return `
    <div id="stories-list-empty" class="stories-list__empty">
      <h2>Tidak ada cerita ditemukan</h2>
      <p>Belum ada cerita yang dipublikasikan saat ini.</p>
    </div>
  `;
}

// Template jika terjadi error saat mengambil daftar cerita
export function generateStoriesListErrorTemplate(message) {
  return `
    <div id="stories-list-error" class="stories-list__error">
      <h2>Terjadi kesalahan saat mengambil data</h2>
      <p>${message ? message : "Silakan coba lagi atau periksa koneksi Anda."}</p>
    </div>
  `;
}

// Template satu item cerita pada daftar cerita
export function generateStoryItemTemplate({ id, userName, description, photo, createdAt, location, isFavorite = false }) {
  return `
    <div tabindex="0" class="story-item" data-storyid="${id}">
      <img class="story-item__image" src="${photo}" alt="Cerita dari ${userName}" loading="lazy">
      <div class="story-item__body">
        <div class="story-item__main">
          <div class="story-item__more-info">
            <div class="story-item__createdat">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i> ${showFormattedDate(createdAt, "id-ID")}
            </div>
            <div class="story-item__location">
              <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${location && location.lat && location.lon ? `${location.lat}, ${location.lon}` : "Lokasi tidak tersedia"}
            </div>
          </div>
        </div>
        <div class="story-item__description">
          ${description}
        </div>
        <div class="story-item__more-info">
          <div class="story-item__author">
            <i class="fas fa-user" aria-hidden="true"></i> ${userName}
          </div>
          <button class="favorite-button${isFavorite ? " favorited" : ""}" data-id="${id}" title="${isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}">
            <i class="fa${isFavorite ? "s" : "r"} fa-heart" aria-hidden="true"></i>
            <span class="sr-only">${isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Template satu item cerita favorit pada daftar favorit
export function generateFavoriteStoryItemTemplate({ id, userName, description, photo, createdAt, location }) {
  return `
    <div tabindex="0" class="story-item favorite-item" data-storyid="${id}">
      <img class="story-item__image" src="${photo}" alt="Cerita dari ${userName}" loading="lazy">
      <div class="story-item__body">
        <div class="story-item__main">
          <div class="story-item__more-info">
            <div class="story-item__createdat">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i> ${showFormattedDate(createdAt, "id-ID")}
            </div>
            <div class="story-item__location">
              <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${location && location.lat && location.lon ? `${location.lat}, ${location.lon}` : "Lokasi tidak tersedia"}
            </div>
          </div>
        </div>
        <div class="story-item__description">
          ${description}
        </div>
        <div class="story-item__more-info">
          <div class="story-item__author">
            <i class="fas fa-user" aria-hidden="true"></i> ${userName}
          </div>
          <button class="favorite-button favorited" data-id="${id}" title="Hapus dari favorit">
            <i class="fas fa-heart" aria-hidden="true"></i>
            <span class="sr-only">Hapus dari favorit</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Template skeleton loading untuk item cerita (tampilan loading)
export function generateStoryShellTemplate() {
  return `
    <div class="story-item shell">
      <div class="story-item__image shell-loading"></div>
      <div class="story-item__body">
        <div class="story-item__main">
          <div class="story-item__more-info">
            <div class="shell-loading"></div>
            <div class="shell-loading"></div>
          </div>
        </div>
        <div class="story-item__description shell-loading"></div>
        <div class="story-item__more-info">
          <div class="shell-loading"></div>
        </div>
        <div class="story-item__read-more shell-loading"></div>
      </div>
    </div>
  `;
}

// Template untuk pending story (cerita yang belum tersinkronisasi)
export function generatePendingStoryItemTemplate(story) {
  // Untuk pending stories, jika photo berupa File, gunakan object URL
  let photoUrl = story.photo;
  if (story.photo instanceof File) {
    photoUrl = URL.createObjectURL(story.photo);
  }

  return `
    <div tabindex="0" class="story-item pending-story" data-reportid="${story.id}">
      <div class="pending-badge">Menunggu</div>
      <img class="story-item__image" src="${photoUrl}" alt="Cerita pending" loading="lazy">
      <div class="story-item__body">
        <div class="story-item__main">
          <div class="story-item__more-info">
            <div class="story-item__createdat">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i> ${showFormattedDate(story.createdAt, "id-ID")}
            </div>
            <div class="story-item__location">
              <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${story.lat && story.lon ? `${story.lat}, ${story.lon}` : "Lokasi tidak tersedia"}
            </div>
          </div>
        </div>
        <div class="story-item__description">
          ${story.description}
        </div>
        <div class="story-item__more-info">
          <div class="story-item__author">
            <i class="fas fa-user" aria-hidden="true"></i> ${story.name || "Anda (pending)"}
          </div>
        </div>
        <div class="pending-status">
          <i class="fas fa-clock"></i> Akan diunggah saat online
        </div>
      </div>
    </div>
  `;
}
