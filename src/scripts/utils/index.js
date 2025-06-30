// Fungsi untuk menampilkan tanggal dalam format lokal yang sudah diformat
export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options, // Tambahan opsi jika diperlukan
  });
}

// Fungsi sleep: mengembalikan Promise yang resolve setelah waktu tertentu (ms)
export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Fungsi helper untuk transisi view (misal animasi antar halaman)
// Jika browser tidak mendukung view transition, update DOM langsung tanpa animasi
export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    // Jika transisi dilewati atau tidak didukung, update DOM langsung
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => undefined);

    return {
      ready: Promise.reject(Error("View transitions unsupported")), // Tidak ada transisi
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }

  // Jika didukung, gunakan API view transition
  return document.startViewTransition(updateDOM);
}
