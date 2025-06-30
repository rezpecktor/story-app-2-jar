// Fungsi untuk memecah path menjadi segmen resource dan id
function extractPathnameSegments(path) {
  const splitUrl = path.split("/");

  return {
    resource: splitUrl[1] || null, // Segmen pertama setelah slash, contoh: /add -> resource: "add"
    id: splitUrl[2] || null, // Segmen kedua setelah slash, contoh: /story/123 -> id: "123"
  };
}

// Fungsi untuk membangun route dari segmen path
function constructRouteFromSegments(pathSegments) {
  let pathname = "";

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`); // Tambahkan resource ke path
  }

  if (pathSegments.id) {
    pathname = pathname.concat("/:id"); // Tambahkan id ke path jika ada
  }

  return pathname || "/"; // Jika kosong, kembalikan "/"
}

// Mengambil pathname aktif dari hash URL, default "/"
export function getActivePathname() {
  return location.hash.replace("#", "") || "/";
}

// Mengambil route aktif berdasarkan hash URL, dengan proteksi infinite loop
export function getActiveRoute() {
  const pathname = getActivePathname();

  // Proteksi agar tidak terjadi infinite loop pada perubahan hash
  if (window._lastPathname === pathname) {
    window._pathChangeCount = (window._pathChangeCount || 0) + 1;
    if (window._pathChangeCount > 5) {
      console.error("Terdeteksi terlalu banyak perubahan path, kemungkinan infinite loop");
      return "/";
    }
  } else {
    window._pathChangeCount = 0;
    window._lastPathname = pathname;
  }

  // Ubah pathname menjadi route yang sesuai
  const urlSegments = extractPathnameSegments(pathname);
  const route = constructRouteFromSegments(urlSegments);

  return route;
}

// Mengambil segmen resource dan id dari hash URL aktif
export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

// Mendapatkan route dari pathname tertentu
export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

// Mendapatkan segmen resource dan id dari pathname tertentu
export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}
