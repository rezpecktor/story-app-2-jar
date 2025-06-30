import { map, tileLayer, Icon, icon, marker, popup, control } from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

// Kelas Map untuk membungkus fungsionalitas Leaflet
export default class Map {
  #zoom = 5; // Nilai zoom default
  #map = null; // Objek peta Leaflet
  #baseLayers = {}; // Layer dasar (OpenStreetMap, Satellite, dll)
  #layerControl = null; // Kontrol untuk memilih layer

  // Mengecek ketersediaan Geolocation API di browser
  static isGeolocationAvailable() {
    return "geolocation" in navigator;
  }

  // Mendapatkan posisi saat ini menggunakan Geolocation API
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject("Geolocation API tidak tersedia di browser ini.");
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  // Membuat instance Map secara async, bisa otomatis ke lokasi user
  static async build(selector, options = {}) {
    if ("center" in options && options.center) {
      return new Map(selector, options);
    }

    const jakartaCoordinate = [-6.2, 106.816666]; // Koordinat default: Jakarta

    if ("locate" in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];

        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }

    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }

  // Konstruktor: inisialisasi peta dan base layer
  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;

    // Definisi berbagai base layer (OpenStreetMap, Satellite, dll)
    this.#baseLayers = {
      OpenStreetMap: tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }),
      Satellite: tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18,
      }),
      Terrain: tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
      }),
      "Dark Mode": tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }),
      Watercolor: tileLayer("https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg", {
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abcd",
        minZoom: 1,
        maxZoom: 16,
      }),
    };

    const scrollEnabled = options.scrollWheelZoom ?? false;

    // Inisialisasi objek peta Leaflet
    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: scrollEnabled,
      layers: [this.#baseLayers.OpenStreetMap],
      ...options,
    });

    // Tambahkan kontrol untuk memilih base layer
    this.#layerControl = control.layers(this.#baseLayers).addTo(this.#map);

    // Perbaiki ukuran peta setelah render
    setTimeout(() => {
      this.#map.invalidateSize();
    }, 100);

    // Pindahkan kontrol zoom ke kanan bawah
    this.#map.zoomControl.setPosition("bottomright");
  }

  // Membuat icon marker custom (menggunakan gambar bawaan leaflet)
  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  // Menambahkan marker ke peta, bisa dengan popup
  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== "object") {
      throw new Error("markerOptions harus berupa objek");
    }

    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });

    if (popupOptions) {
      if (typeof popupOptions !== "object") {
        throw new Error("popupOptions harus berupa objek");
      }
      if (!("content" in popupOptions)) {
        throw new Error("popupOptions harus memiliki properti `content`.");
      }

      newMarker.bindPopup(popupOptions.content);
    }

    newMarker.addTo(this.#map);

    return newMarker;
  }

  // Mengambil objek peta Leaflet (misal untuk akses langsung)
  getMap() {
    return this.#map;
  }

  // Mengganti base layer peta sesuai nama yang diberikan
  switchBaseLayer(layerName) {
    if (this.#baseLayers[layerName]) {
      Object.keys(this.#baseLayers).forEach((name) => {
        if (this.#map.hasLayer(this.#baseLayers[name])) {
          this.#map.removeLayer(this.#baseLayers[name]);
        }
      });
      this.#map.addLayer(this.#baseLayers[layerName]);
    }
  }
}
