import { resolveLocation } from './cities.js';

// Datos de ejemplo con los que arranca la app la primera vez
// (tanto en modo local como, si Firestore está vacío, en modo Firebase).
// Puedes borrar o editar cualquiera de estas personas desde la propia app.
export function seedData() {
  const raw = [
    {name:"Sara", city:"Madrid", country:"España", note:"Debate", phone:""},
    {name:"Francisco Casas", city:"Madrid", country:"España", note:"", phone:""},
    {name:"Miguel Ángel", city:"Madrid", country:"España", note:"Debate", phone:""},
    {name:"Sandra", city:"Madrid", country:"España", note:"Debate · Ingeniería matemática", phone:""},
    {name:"Beltrán", city:"Madrid", country:"España", note:"", phone:""},
    {name:"María", city:"Alicante", country:"España", note:"Periodismo (Fac. Comunicación)", phone:""},
    {name:"Marisa", city:"Valencia", country:"España", note:"Sputnik Inri", phone:""},
    {name:"Lara", city:"Campo de Criptana", country:"España", note:"Ciudad Real", phone:""},
    {name:"Dane", city:"Inglaterra", country:"Reino Unido", note:"", phone:""},
    {name:"Guillermo Paneque", city:"Inglaterra", country:"Reino Unido", note:"", phone:""},
    {name:"Antonio Marco", city:"Buenos Aires", country:"Argentina", note:"", phone:""},
    {name:"Rosi", city:"Málaga", country:"España", note:"", phone:""},
    {name:"Pablito", city:"Jaén", country:"España", note:"", phone:""}
  ];
  return raw.map(p => {
    const loc = resolveLocation(p.city, p.country);
    return {
      name: p.name, city: p.city, country: loc.country,
      lat: loc.lat, lon: loc.lon, phone: p.phone, note: p.note, photo: null
    };
  });
}
