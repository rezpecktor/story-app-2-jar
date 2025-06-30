import CONFIG from "../config"; // Import konfigurasi API (BASE_URL, dll)
import { getAccessToken } from "../utils/auth"; // Import fungsi untuk mengambil token akses user
import StoryIdb from "../utils/database"; // Import modul untuk akses IndexedDB (penyimpanan offline)

// Daftar endpoint API yang digunakan aplikasi
const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`, // Endpoint untuk registrasi user
  LOGIN: `${CONFIG.BASE_URL}/login`, // Endpoint untuk login user
  STORIES: `${CONFIG.BASE_URL}/stories`, // Endpoint untuk mengambil/menambah story
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`, // Endpoint untuk subscribe notifikasi push
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/unsubscribe`, // Endpoint untuk unsubscribe notifikasi push
};

// Fungsi helper untuk cek apakah user sedang online
const isOnline = () => navigator.onLine;

// Fungsi helper untuk membuat response palsu saat offline
const createOfflineResponse = (endpoint) => {
  // Jika endpoint stories, kembalikan data kosong
  if (endpoint.includes("/stories")) {
    return {
      error: false,
      message: "Stories fetched from cache",
      listStory: [],
      ok: true,
    };
  }
  // Untuk endpoint lain, kembalikan error offline
  return {
    error: true,
    message: "Anda sedang offline. Silakan periksa koneksi internet Anda.",
    ok: false,
  };
};

// Fungsi untuk registrasi user baru
export async function registerUser({ name, email, password }) {
  if (!isOnline()) {
    // Jika offline, kembalikan error
    return {
      error: true,
      message: "Anda sedang offline. Silakan periksa koneksi untuk registrasi.",
      ok: false,
    };
  }

  try {
    // Kirim data registrasi ke endpoint REGISTER
    const data = JSON.stringify({ name, email, password });
    const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    const json = await fetchResponse.json();
    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    // Jika gagal, kembalikan error
    return {
      error: true,
      message: "Registrasi gagal. Silakan coba lagi nanti.",
      ok: false,
    };
  }
}

// Fungsi untuk login user
export async function loginUser({ email, password }) {
  if (!isOnline()) {
    // Jika offline, kembalikan error
    return {
      error: true,
      message: "Anda sedang offline. Silakan periksa koneksi untuk login.",
      ok: false,
    };
  }

  try {
    // Kirim data login ke endpoint LOGIN
    const data = JSON.stringify({ email, password });
    const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    const json = await fetchResponse.json();

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    // Jika gagal, kembalikan error
    return {
      error: true,
      message: "Login gagal. Silakan coba lagi nanti.",
      ok: false,
    };
  }
}

// Fungsi untuk mengambil daftar stories
export async function getStories() {
  const token = getAccessToken();

  if (!isOnline()) {
    // Jika offline, coba ambil dari IndexedDB
    try {
      const stories = await StoryIdb.getStories();
      console.log("Mengambil stories dari IndexedDB:", stories.length);

      if (stories && stories.length > 0) {
        // Jika ada data di IndexedDB, kembalikan data tersebut
        return {
          error: false,
          message: "Stories diambil dari database lokal",
          listStory: stories,
          ok: true,
          fromCache: true,
        };
      }

      // Jika tidak ada, coba dari cache API
      const cache = await caches.open("api-responses");
      const cachedResponse = await cache.match(ENDPOINTS.STORIES);

      if (cachedResponse) {
        const json = await cachedResponse.json();
        // Simpan juga ke IndexedDB untuk akses offline berikutnya
        if (json.listStory && json.listStory.length) {
          await StoryIdb.putStories(json.listStory);
        }
        return {
          ...json,
          ok: true,
          fromCache: true,
        };
      }
    } catch (error) {
      console.error("Gagal mengakses penyimpanan offline:", error);
    }

    // Jika tidak ada data sama sekali, kembalikan response offline
    return createOfflineResponse(ENDPOINTS.STORIES);
  }

  try {
    // Jika online, ambil data dari API
    console.log("Mengambil stories dari API...");
    const fetchResponse = await fetch(ENDPOINTS.STORIES, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!fetchResponse.ok) {
      // Jika API error, fallback ke IndexedDB
      console.error("API error:", fetchResponse.status, fetchResponse.statusText);

      const stories = await StoryIdb.getStories();
      if (stories && stories.length > 0) {
        return {
          error: false,
          message: "Stories diambil dari database lokal (fallback API error)",
          listStory: stories,
          ok: true,
          fromCache: true,
        };
      }

      return createOfflineResponse(ENDPOINTS.STORIES);
    }

    const json = await fetchResponse.json();
    console.log("Stories berhasil diambil");

    // Simpan ke IndexedDB untuk akses offline
    if (json.listStory && json.listStory.length) {
      await StoryIdb.putStories(json.listStory);
      console.log("Stories disimpan ke IndexedDB");
    }

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    // Jika error, fallback ke IndexedDB
    console.error("Gagal mengambil stories:", error);

    const stories = await StoryIdb.getStories();
    if (stories && stories.length > 0) {
      return {
        error: false,
        message: "Stories diambil dari database lokal (fallback error)",
        listStory: stories,
        ok: true,
        fromCache: true,
      };
    }

    return createOfflineResponse(ENDPOINTS.STORIES);
  }
}

// Fungsi untuk membuat story baru (upload foto & deskripsi)
export async function createNewStory({ description, photo, lat, lon }) {
  if (!isOnline()) {
    // Jika offline, simpan story ke IndexedDB sebagai pending
    try {
      const pendingStory = {
        id: `pending-${Date.now()}`,
        description,
        photo, // File object
        lat,
        lon,
        isPending: true,
        createdAt: new Date().toISOString(),
        name: "Anda (pending)", // Placeholder nama
      };

      await StoryIdb.putStory(pendingStory);

      return {
        error: false,
        message: "Cerita disimpan secara lokal dan akan diunggah saat online.",
        ok: true,
        isPending: true,
      };
    } catch (error) {
      console.error("Gagal menyimpan pending story:", error);
      return {
        error: true,
        message: "Gagal menyimpan cerita secara lokal. Silakan coba lagi saat online.",
        ok: false,
      };
    }
  }

  // Validasi file foto
  if (!photo || !(photo instanceof File)) {
    throw new Error("Foto tidak valid: Harus berupa File object.");
  }

  if (photo.size > 1024 * 1024) {
    throw new Error("Foto tidak boleh melebihi 1MB");
  }

  // Siapkan FormData untuk upload story
  const formData = new FormData();
  formData.set("description", description);
  formData.set("photo", photo);

  if (lat !== undefined) formData.set("lat", lat);
  if (lon !== undefined) formData.set("lon", lon);

  try {
    const token = getAccessToken();
    const fetchResponse = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await fetchResponse.json();

    // Jika sukses, refresh stories di IndexedDB
    if (fetchResponse.ok) {
      getStories();
    }

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    return {
      error: true,
      message: "Gagal membuat cerita. Silakan coba lagi nanti.",
      ok: false,
    };
  }
}

// Fungsi untuk mensinkronkan story yang tertunda (pending) saat online
export async function syncPendingStories() {
  if (!isOnline()) {
    return {
      error: true,
      message: "Tidak dapat sinkronisasi cerita saat offline.",
      ok: false,
    };
  }

  try {
    // Ambil semua story dari IndexedDB
    const stories = await StoryIdb.getStories();

    // Filter story yang statusnya pending
    const pendingStories = stories.filter((story) => story.isPending);

    if (pendingStories.length === 0) {
      return {
        error: false,
        message: "Tidak ada cerita pending untuk disinkronkan.",
        ok: true,
      };
    }

    console.log(`Ditemukan ${pendingStories.length} cerita pending untuk disinkronkan`);

    // Upload satu per satu story pending
    const results = await Promise.all(
      pendingStories.map(async (story) => {
        try {
          const result = await createNewStory({
            description: story.description,
            photo: story.photo,
            lat: story.lat,
            lon: story.lon,
          });

          if (result.ok) {
            // Jika sukses, hapus dari IndexedDB
            await StoryIdb.deleteStory(story.id);
            return { success: true, id: story.id };
          } else {
            return { success: false, id: story.id, error: result.message };
          }
        } catch (error) {
          return { success: false, id: story.id, error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;

    return {
      error: false,
      message: `Berhasil sinkronisasi ${successCount} dari ${pendingStories.length} cerita pending`,
      ok: true,
      results,
    };
  } catch (error) {
    console.error("Gagal sinkronisasi cerita pending:", error);
    return {
      error: true,
      message: "Gagal sinkronisasi cerita pending: " + error.message,
      ok: false,
    };
  }
}

// story-app-2/src/scripts/data/api.js

export async function subscribePushNotification(subscription) {
  if (!isOnline()) {
    return {
      error: true,
      message: "Subscription akan diproses saat Anda kembali online.",
      ok: false,
    };
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("User harus login untuk subscribe notifikasi");
  }

  try {
    console.log("Mengirim subscription ke server:", subscription);
    console.log("Endpoint URL:", ENDPOINTS.SUBSCRIBE);

    const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // PERBAIKAN: Mengirim objek subscription secara langsung, bukan di dalam objek lain.
      body: JSON.stringify(subscription),
    });

    const json = await fetchResponse.json();
    console.log("Subscription response:", json);

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    console.error("Gagal subscribe:", error);
    return {
      error: true,
      message: "Gagal subscribe. Silakan coba lagi nanti.",
      ok: false,
    };
  }
}

// Fungsi untuk unsubscribe push notification dari server
export async function unsubscribePushNotification() {
  if (!isOnline()) {
    return {
      error: true,
      message: "Unsubscription akan diproses saat Anda kembali online.",
      ok: false,
    };
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("User harus login untuk unsubscribe notifikasi");
  }

  try {
    const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await fetchResponse.json();

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    return {
      error: true,
      message: "Gagal unsubscribe. Silakan coba lagi nanti.",
      ok: false,
    };
  }
}
