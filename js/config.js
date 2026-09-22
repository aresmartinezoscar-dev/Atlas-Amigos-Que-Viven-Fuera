// ---------------------------------------------------------------
// CONFIGURACIÓN DE ATLAS DE GENTE
// ---------------------------------------------------------------

// Cambia esto a "firebase" cuando hayas configurado tu proyecto de
// Firebase (ver README.md, sección "Pasar a Firebase").
export const STORAGE_MODE = "local"; // "local" | "firebase"

// Solo se usa si STORAGE_MODE === "firebase".
// Sustituye estos valores por los de tu propio proyecto de Firebase
// (Firebase Console > Configuración del proyecto > tus apps > SDK).
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Proveedor de teselas (tiles) del mapa. Por defecto se usa CARTO
// Voyager, que es gratuito para uso normal y no necesita clave.
// Para una app comercial con mucho tráfico, más adelante puede
// convenirte pasar a un proveedor de pago (Mapbox, MapTiler,
// Google Maps Platform...) — solo tendrías que cambiar estas dos
// líneas, el resto de la app no cambia.
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
