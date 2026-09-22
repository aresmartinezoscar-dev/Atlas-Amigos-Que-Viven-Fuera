// Capa de datos: guarda todo en localStorage (solo en este dispositivo/navegador).
const STORAGE_KEY = 'atlas-de-gente-people-v1';

function genId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

export function createLocalStore(seedDataFn) {
  let people = [];
  let listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Atlas: no se pudo leer localStorage', e);
      return null;
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    } catch (e) {
      console.error('Atlas: no se pudo guardar en localStorage', e);
    }
  }
  function notify() {
    const snapshot = [...people];
    listeners.forEach(fn => fn(snapshot));
  }

  const existing = load();
  if (existing && existing.length) {
    people = existing;
  } else {
    const seed = seedDataFn ? seedDataFn() : [];
    people = seed.map(p => ({ ...p, id: genId() }));
    persist();
  }

  return {
    async ready() { return true; },
    subscribe(fn) {
      listeners.push(fn);
      fn([...people]);
      return () => { listeners = listeners.filter(l => l !== fn); };
    },
    getAll() { return [...people]; },
    async add(person) {
      const withId = { ...person, id: genId() };
      people.push(withId);
      persist(); notify();
      return withId;
    },
    async update(id, patch) {
      people = people.map(p => (p.id === id ? { ...p, ...patch } : p));
      persist(); notify();
    },
    async remove(id) {
      people = people.filter(p => p.id !== id);
      persist(); notify();
    },
    async replaceAll(arr) {
      people = arr.map(p => ({ ...p, id: p.id || genId() }));
      persist(); notify();
    }
  };
}
