export const KNOWN_CITIES = {
  "madrid": {lat:40.4168, lon:-3.7038, country:"España"},
  "alicante": {lat:38.3452, lon:-0.4810, country:"España"},
  "valencia": {lat:39.4699, lon:-0.3763, country:"España"},
  "campo de criptana": {lat:39.4083, lon:-3.1200, country:"España"},
  "málaga": {lat:36.7213, lon:-4.4214, country:"España"},
  "malaga": {lat:36.7213, lon:-4.4214, country:"España"},
  "jaén": {lat:37.7796, lon:-3.7849, country:"España"},
  "jaen": {lat:37.7796, lon:-3.7849, country:"España"},
  "londres": {lat:51.5074, lon:-0.1278, country:"Reino Unido"},
  "inglaterra": {lat:51.5074, lon:-0.1278, country:"Reino Unido"},
  "ciudad de méxico": {lat:19.4326, lon:-99.1332, country:"México"},
  "ciudad de mexico": {lat:19.4326, lon:-99.1332, country:"México"},
  "méxico": {lat:19.4326, lon:-99.1332, country:"México"},
  "mexico": {lat:19.4326, lon:-99.1332, country:"México"},
  "buenos aires": {lat:-34.6037, lon:-58.3816, country:"Argentina"}
};

export const COUNTRY_CENTER = {
  "España": {lat:40.2, lon:-3.7},
  "Reino Unido": {lat:52.5, lon:-1.5},
  "México": {lat:23.6, lon:-102.5},
  "Argentina": {lat:-38.4, lon:-63.6},
  "Otro": {lat:20, lon:10}
};

// Resuelve unas coordenadas a partir de una ciudad escrita a mano.
// Si la ciudad es conocida, usa sus coordenadas exactas. Si no,
// cae al centro del país (con un pequeño desplazamiento aleatorio
// para que varias personas "aproximadas" del mismo país no queden
// exactamente en el mismo punto).
export function resolveLocation(cityRaw, country) {
  const key = (cityRaw || "").trim().toLowerCase();
  if (KNOWN_CITIES[key]) {
    const k = KNOWN_CITIES[key];
    return { lat: k.lat, lon: k.lon, country: k.country, approx: false };
  }
  const c = COUNTRY_CENTER[country] || COUNTRY_CENTER["Otro"];
  const jitter = () => (Math.random() - 0.5) * 3.4;
  return { lat: c.lat + jitter(), lon: c.lon + jitter(), country, approx: true };
}
