import CONFIG from "../config";
import { getActiveRoute } from "../routes/url-parser";

// Ambil access token dari localStorage
export function getAccessToken() {
  try {
    const accessToken = localStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);

    // Jika token berupa string "null" atau "undefined", anggap token tidak ada
    if (accessToken === "null" || accessToken === "undefined") {
      return null;
    }

    return accessToken;
  } catch (error) {
    return null;
  }
}

// Simpan access token ke localStorage
export function putAccessToken(token) {
  try {
    localStorage.setItem(CONFIG.ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    return false;
  }
}

// Hapus access token dari localStorage
export function removeAccessToken() {
  try {
    localStorage.removeItem(CONFIG.ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

// Daftar route yang hanya bisa diakses user yang belum login
const unauthenticatedRoutesOnly = ["/login", "/register"];

// Batasi akses route hanya untuk user yang belum login
export function checkUnauthenticatedRouteOnly(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  // Jika user sudah login dan akses halaman login/register, redirect ke beranda
  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = "/";
    return null;
  }

  return page;
}

// Batasi akses route hanya untuk user yang sudah login
export function checkAuthenticatedRoute(page) {
  const isLogin = !!getAccessToken();

  // Jika belum login, redirect ke halaman login
  if (!isLogin) {
    location.hash = "/login";
    return null;
  }

  return page;
}

// Logout user (hapus token)
export function getLogout() {
  removeAccessToken();
}
