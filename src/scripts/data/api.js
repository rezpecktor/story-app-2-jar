import CONFIG from "../config"; // Import konfigurasi API (BASE_URL, dll)
import { getAccessToken } from "../utils/auth"; // Import fungsi untuk mengambil token akses user
import StoryIdb from "../utils/database"; // Import modul untuk akses IndexedDB (penyimpanan offline)

// Kumpulan endpoint API yang digunakan aplikasi
const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`, // Endpoint untuk mendaftar user baru
  LOGIN: `${CONFIG.BASE_URL}/login`, // Endpoint untuk autentikasi user
  STORIES: `${CONFIG.BASE_URL}/stories`, // Endpoint untuk mengambil/menambah story
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`, // Endpoint untuk mendaftar notifikasi push
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/unsubscribe`, // Endpoint untuk berhenti langganan notifikasi push
};

// Fungsi utilitas untuk memeriksa status online user
const isOnline = () => navigator.onLine;

// Fungsi utilitas untuk membuat response palsu jika offline
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
    message: "You are offline. Please check your connection.",
    ok: false,
  };
};

// Fungsi untuk mendaftarkan user baru
export async function registerUser({ name, email, password }) {
  if (!isOnline()) {
    // Jika tidak terhubung internet, kembalikan error
    return {
      error: true,
      message: "You are offline. Please check your connection to register.",
      ok: false,
    };
  }

  try {
    // Kirim data pendaftaran ke endpoint REGISTER
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
      message: "Registration failed. Please try again later.",
      ok: false,
    };
  }
}

// Fungsi untuk login user
export async function loginUser({ email, password }) {
  if (!isOnline()) {
    // Jika tidak online, kembalikan error
    return {
      error: true,
      message: "You are offline. Please check your connection to login.",
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
      message: "Login failed. Please try again later.",
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
      console.log("Retrieved stories from IndexedDB:", stories.length);

      if (stories && stories.length > 0) {
        // Jika ada data di IndexedDB, kembalikan data tersebut
        return {
          error: false,
          message: "Stories fetched from local database",
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
      console.error("Error accessing offline storage:", error);
    }

    // Jika tidak ada data sama sekali, kembalikan response offline
    return createOfflineResponse(ENDPOINTS.STORIES);
  }

  try {
    // Jika online, ambil data dari API
    console.log("Fetching stories from API...");
    const fetchResponse = await fetch(ENDPOINTS.STORIES, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!fetchResponse.ok) {
      // Jika API error, fallback ke IndexedDB
      console.error("API returned error:", fetchResponse.status, fetchResponse.statusText);

      const stories = await StoryIdb.getStories();
      if (stories && stories.length > 0) {
        return {
          error: false,
          message: "Stories fetched from local database (API error fallback)",
          listStory: stories,
          ok: true,
          fromCache: true,
        };
      }

      return createOfflineResponse(ENDPOINTS.STORIES);
    }

    const json = await fetchResponse.json();
    console.log("Stories fetched successfully");

    // Simpan ke IndexedDB untuk akses offline
    if (json.listStory && json.listStory.length) {
      await StoryIdb.putStories(json.listStory);
      console.log("Saved stories to IndexedDB");
    }

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    // Jika error, fallback ke IndexedDB
    console.error("Error fetching stories:", error);

    const stories = await StoryIdb.getStories();
    if (stories && stories.length > 0) {
      return {
        error: false,
        message: "Stories fetched from local database (error fallback)",
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
    // Jika sedang offline, simpan story ke IndexedDB sebagai pending
    try {
      const pendingStory = {
        id: `pending-${Date.now()}`,
        description,
        photo, // File object
        lat,
        lon,
        isPending: true,
        createdAt: new Date().toISOString(),
        name: "You (pending)", // Nama sementara
      };

      await StoryIdb.putStory(pendingStory);

      return {
        error: false,
        message: "Story saved locally and will be uploaded when you're online",
        ok: true,
        isPending: true,
      };
    } catch (error) {
      console.error("Error saving pending story:", error);
      return {
        error: true,
        message: "Failed to save story locally. Please try again when online.",
        ok: false,
      };
    }
  }

  // Validasi file foto
  if (!photo || !(photo instanceof File)) {
    throw new Error("Invalid photo: Expected a valid File object.");
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
      message: "Failed to create story. Please try again later.",
      ok: false,
    };
  }
}

// Fungsi untuk mensinkronkan story yang tertunda (pending) saat online
export async function syncPendingStories() {
  if (!isOnline()) {
    return {
      error: true,
      message: "Cannot sync stories while offline",
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
        message: "No pending stories to sync",
        ok: true,
      };
    }

    console.log(`Found ${pendingStories.length} pending stories to sync`);

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
            // Jika berhasil, hapus dari IndexedDB
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
      message: `Synced ${successCount} of ${pendingStories.length} pending stories`,
      ok: true,
      results,
    };
  } catch (error) {
    console.error("Error syncing pending stories:", error);
    return {
      error: true,
      message: "Failed to sync pending stories: " + error.message,
      ok: false,
    };
  }
}

// Fungsi untuk subscribe push notification ke server
export async function subscribePushNotification(subscription) {
  if (!isOnline()) {
    return {
      error: true,
      message: "Subscription will be processed when you're back online.",
      ok: false,
    };
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("User must be logged in to subscribe to notifications");
  }

  try {
    // --- Bagian ini menyiapkan data subscription sebelum dikirim ke server ---
    const subscriptionJSON = subscription.toJSON();
    const dataToSend = {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys.p256dh,
        auth: subscriptionJSON.keys.auth,
      },
    };
    // ------------------------------------------------------------------------

    console.log("Sending subscription to server:", dataToSend);
    console.log("Endpoint URL:", ENDPOINTS.SUBSCRIBE);

    const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend), // Mengirim data subscription yang sudah diformat
    });

    const json = await fetchResponse.json();
    console.log("Subscription response:", json);

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    console.error("Subscription error:", error);
    return {
      error: true,
      message: "Failed to subscribe. Please try again later.",
      ok: false,
    };
  }
}

// Fungsi untuk unsubscribe push notification dari server
export async function unsubscribePushNotification() {
  if (!isOnline()) {
    return {
      error: true,
      message: "Unsubscription will be processed when you're back online.",
      ok: false,
    };
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("User must be logged in to unsubscribe from notifications");
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
      message: "Failed to unsubscribe. Please try again later.",
      ok: false,
    };
  }
}
