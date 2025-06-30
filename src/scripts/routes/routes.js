import RegisterPage from "../pages/auth/register/register-page"; // Import halaman register
import LoginPage from "../pages/auth/login/login-page"; // Import halaman login
import HomePage from "../pages/home/home-page"; // Import halaman utama
import AddPage from "../pages/add/add-page"; // Import halaman tambah cerita
import FavoritesPage from "../pages/favorites/favorites-page"; // Import halaman favorit
import NotFoundPage from "../pages/not-found/not-found-page"; // Import halaman 404
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from "../utils/auth"; // Import fungsi pembatasan akses

// Objek routes: mendefinisikan path dan halaman yang ditampilkan
const routes = {
  "/login": () => checkUnauthenticatedRouteOnly(new LoginPage()), // Hanya untuk user yang belum login
  "/register": () => checkUnauthenticatedRouteOnly(new RegisterPage()), // Hanya untuk user yang belum login
  "/": () => checkAuthenticatedRoute(new HomePage()), // Hanya untuk user yang sudah login
  "/add": () => checkAuthenticatedRoute(new AddPage()), // Hanya untuk user yang sudah login
  "/favorites": () => checkAuthenticatedRoute(new FavoritesPage()), // Hanya untuk user yang sudah login
};

// Fungsi getPage: mengembalikan page sesuai url, jika tidak ditemukan tampilkan NotFoundPage
const getPage = (url) => {
  if (routes[url]) {
    return routes[url](); // Kembalikan page sesuai route
  }
  // Jika route tidak ditemukan, tampilkan halaman 404
  return new NotFoundPage();
};

export { routes, getPage }; // Ekspor routes dan getPage
export default routes; // Ekspor default routes
