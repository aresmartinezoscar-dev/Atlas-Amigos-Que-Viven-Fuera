import { STORAGE_MODE, firebaseConfig } from './config.js';
import { seedData } from './seed.js';

// Punto único de entrada a los datos. El resto de la app (app.js) solo
// habla con el objeto que devuelve initStore() — no le importa si por
// debajo hay localStorage o Firebase.
export async function initStore() {
  if (STORAGE_MODE === 'firebase') {
    const { createFirebaseStore } = await import('./store-firebase.js');
    return createFirebaseStore(firebaseConfig, seedData);
  }
  const { createLocalStore } = await import('./store-local.js');
  return createLocalStore(seedData);
}
