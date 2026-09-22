// Capa de datos: guarda todo en Firebase Firestore (sincronizado entre dispositivos).
// Se importa dinámicamente solo cuando STORAGE_MODE === "firebase", así que el
// SDK de Firebase no se descarga si estás usando el modo local.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, onSnapshot,
  addDoc, updateDoc, deleteDoc, writeBatch, getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export function createFirebaseStore(firebaseConfig, seedDataFn) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const peopleCol = collection(db, "people");

  let listeners = [];
  let cache = [];
  let readyResolve;
  const readyPromise = new Promise((res) => { readyResolve = res; });
  let seeded = false;

  signInAnonymously(auth).catch((err) => {
    console.error("Atlas: fallo el inicio de sesión anónima de Firebase.", err);
    console.error("Revisa que 'Anonymous' esté activado en Firebase Authentication > Sign-in method, y que este dominio esté en la lista de dominios autorizados.");
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    onSnapshot(peopleCol, async (snap) => {
      if (snap.empty && seedDataFn && !seeded) {
        seeded = true;
        const seed = seedDataFn();
        const batch = writeBatch(db);
        seed.forEach((p) => { batch.set(doc(peopleCol), p); });
        await batch.commit();
        return; // onSnapshot volverá a dispararse con los documentos nuevos
      }
      cache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      listeners.forEach((fn) => fn([...cache]));
      readyResolve(true);
    }, (err) => {
      console.error("Atlas: error escuchando Firestore.", err);
    });
  });

  return {
    ready() { return readyPromise; },
    subscribe(fn) {
      listeners.push(fn);
      if (cache.length) fn([...cache]);
      return () => { listeners = listeners.filter((l) => l !== fn); };
    },
    getAll() { return [...cache]; },
    async add(person) {
      const ref = await addDoc(peopleCol, person);
      return { id: ref.id, ...person };
    },
    async update(id, patch) {
      await updateDoc(doc(peopleCol, id), patch);
    },
    async remove(id) {
      await deleteDoc(doc(peopleCol, id));
    },
    async replaceAll(arr) {
      const snap = await getDocs(peopleCol);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      arr.forEach((p) => {
        const { id, ...rest } = p;
        batch.set(doc(peopleCol), rest);
      });
      await batch.commit();
    }
  };
}
