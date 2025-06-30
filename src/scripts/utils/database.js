import { openDB } from "idb"; // Import library idb untuk IndexedDB

// Konstanta nama database, versi, dan nama object store
const DATABASE_NAME = "story-app-db";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "stories"; // Object store untuk data cerita
const FAVORITES_STORE_NAME = "favorites"; // Object store untuk data favorit

// Membuka database dan membuat object store jika belum ada
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Buat object store untuk stories jika belum ada
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
    }

    // Buat object store untuk favorites jika belum ada
    if (!database.objectStoreNames.contains(FAVORITES_STORE_NAME)) {
      database.createObjectStore(FAVORITES_STORE_NAME, { keyPath: "id" });
    }
  },
});

const StoryIdb = {
  // Mengambil semua data cerita dari object store stories
  async getStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  // Mengambil satu data cerita berdasarkan id
  async getStory(id) {
    if (!id) {
      return null;
    }
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  // Menyimpan banyak data cerita sekaligus, hapus semua data lama terlebih dahulu
  async putStories(stories) {
    await this.deleteAllStories(); // Hapus semua data cerita lama

    // Tambahkan semua data cerita baru
    const tx = (await dbPromise).transaction(OBJECT_STORE_NAME, "readwrite");
    stories.forEach((story) => {
      tx.store.add(story);
    });
    await tx.done;
  },

  // Menyimpan satu data cerita ke object store stories
  async putStory(story) {
    if (!story.id) {
      throw new Error("Story must have an ID");
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  // Menghapus satu data cerita berdasarkan id
  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  // Menghapus semua data cerita di object store stories
  async deleteAllStories() {
    return (await dbPromise).clear(OBJECT_STORE_NAME);
  },

  // Mengambil semua data cerita favorit
  async getFavoriteStories() {
    return (await dbPromise).getAll(FAVORITES_STORE_NAME);
  },

  // Mengambil satu data cerita favorit berdasarkan id
  async getFavoriteStory(id) {
    if (!id) {
      return null;
    }
    return (await dbPromise).get(FAVORITES_STORE_NAME, id);
  },

  // Mengecek apakah sebuah cerita sudah menjadi favorit
  async isFavorite(id) {
    if (!id) {
      return false;
    }
    const story = await this.getFavoriteStory(id);
    return !!story;
  },

  // Menyimpan cerita ke daftar favorit, menambah waktu favorit jika belum ada
  async putFavoriteStory(story) {
    if (!story.id) {
      throw new Error("Story must have an ID");
    }

    // Tambahkan waktu favorit jika belum ada
    story.favoritedAt = story.favoritedAt || new Date().toISOString();

    return (await dbPromise).put(FAVORITES_STORE_NAME, story);
  },

  // Menghapus cerita dari daftar favorit
  async deleteFavoriteStory(id) {
    return (await dbPromise).delete(FAVORITES_STORE_NAME, id);
  },

  // Toggle status favorit: jika sudah favorit, hapus; jika belum, tambahkan
  async toggleFavoriteStory(story) {
    const isFavorite = await this.isFavorite(story.id);

    if (isFavorite) {
      // Jika sudah favorit, hapus dari favorit
      await this.deleteFavoriteStory(story.id);
      return { isFavorite: false, message: "Dihapus dari favorit" };
    } else {
      // Jika belum favorit, tambahkan ke favorit
      await this.putFavoriteStory(story);
      return { isFavorite: true, message: "Ditambahkan ke favorit" };
    }
  },
};

export default StoryIdb; // Ekspor objek StoryIdb untuk digunakan di file lain
