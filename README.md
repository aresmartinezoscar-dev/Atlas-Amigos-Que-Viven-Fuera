# Atlas de Gente

App de mapa para guardar dónde vive la gente que te importa: nombre,
ciudad, teléfono y nota, con un mapa real (Leaflet) y agrupación
automática de marcadores cuando hay varias personas en la misma ciudad.

No necesita ningún paso de compilación (no hay npm, webpack, etc.):
son archivos estáticos que puedes abrir o publicar directamente.

## Estructura del proyecto

```
atlas-de-gente/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js          ← aquí eliges local o Firebase, y el mapa
│   ├── cities.js           ← ciudades conocidas y sus coordenadas
│   ├── seed.js              ← datos de ejemplo con los que arranca la app
│   ├── store.js             ← elige qué capa de datos usar
│   ├── store-local.js       ← guarda en localStorage
│   ├── store-firebase.js    ← guarda en Firestore
│   └── app.js                ← toda la lógica de la interfaz
├── firestore.rules          ← reglas de seguridad, solo si usas Firebase
└── README.md
```

## 1. Probarla en local

Como `app.js` usa módulos de JavaScript (`import`/`export`), el navegador
necesita servir los archivos por `http://`, no puedes abrir `index.html`
haciendo doble clic (con `file://` los `import` fallan en algunos
navegadores). La forma más simple:

```bash
cd atlas-de-gente
npx serve .
# o: python3 -m http.server 8080
```

Y abre la URL que te indique (p. ej. `http://localhost:8080`).

Por defecto la app arranca en **modo local**: no hace falta configurar
nada, los datos se guardan en el navegador del dispositivo.

## 2. Subirla a GitHub y publicarla con GitHub Pages

```bash
cd atlas-de-gente
git init
git add .
git commit -m "Atlas de Gente"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Source → Deploy from a branch →
main / (root)**. En un par de minutos tendrás una URL pública tipo
`https://TU_USUARIO.github.io/TU_REPO/`.

También funciona igual de bien en Netlify, Vercel (como sitio estático)
o cualquier hosting que sirva archivos estáticos.

## 3. Pasar a Firebase (para tener los datos en la nube, sincronizados)

El modo local es perfecto para probar, pero vive solo en un
navegador/dispositivo. Si vas a comercializar la app y quieres que los
datos persistan de verdad y se puedan compartir entre dispositivos,
pasa a Firebase:

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
   y crea un proyecto nuevo (es gratis para empezar).
2. Dentro del proyecto: **Build → Firestore Database → Crear base de
   datos** (modo producción, elige la región más cercana a tus usuarios).
3. **Build → Authentication → Sign-in method → habilita "Anonymous"**.
   La app usa un inicio de sesión anónimo automático solo para que las
   reglas de seguridad de Firestore puedan exigir `request.auth != null`
   sin necesitar pantalla de login.
4. **Configuración del proyecto (el icono de engranaje) → General →
   Tus apps → Añadir app → Web (</>)**. Te dará un objeto de
   configuración parecido a este:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

5. Copia esos valores en `js/config.js`, dentro de `firebaseConfig`.
6. En `js/config.js`, cambia:

   ```js
   export const STORAGE_MODE = "firebase";
   ```

7. Sube las reglas de seguridad: en Firestore Database → pestaña
   **Reglas**, pega el contenido de `firestore.rules` (incluido en este
   proyecto) y publica.
8. Si publicas con GitHub Pages, Netlify, etc., añade ese dominio en
   **Authentication → Settings → Authorized domains** para que el login
   anónimo funcione ahí también.
9. Vuelve a desplegar (haz commit y push de nuevo). La primera vez que
   la app se abra sin datos, sembrará automáticamente los contactos de
   ejemplo en Firestore; a partir de ahí, todo lo que añadas/edites/
   borres se guarda en la nube y se sincroniza en tiempo real entre
   quien abra la app.

**Importante para producción real**: las reglas incluidas dan acceso de
lectura/escritura a cualquiera que inicie sesión anónima (es decir,
cualquiera que abra tu app). Es razonable para un uso personal o un MVP
cerrado, pero si vas a lanzarla comercialmente con usuarios que no
deban ver los datos de otros, necesitarás autenticación real (email,
Google, etc.) y reglas que separen los datos por usuario — dímelo
cuando llegues a ese punto y te ayudo a montarlo.

## 4. El mapa (tiles)

Por defecto la app usa las teselas gratuitas de CARTO (Voyager), sin
necesidad de clave de API — ideal para arrancar. Su política de uso
gratuito está pensada para tráfico moderado; si la app despega y tiene
mucho tráfico, en algún momento convendrá pasar a un proveedor de pago
(Mapbox, MapTiler, Google Maps Platform...). Para cambiarlo, solo hay
que editar dos líneas en `js/config.js` (`MAP_TILE_URL` y
`MAP_TILE_ATTRIBUTION`) — el resto de la app no cambia.

## 5. Importar contactos del teléfono

El botón "Importar desde contactos" usa la Contact Picker API del
navegador. Solo está disponible en Chrome/Edge para Android (por ahora
no existe en iOS Safari ni en escritorio), y solo puede leer el nombre,
teléfono y la foto que tengas guardada en la app de Contactos del
móvil — no existe ninguna API web que dé acceso específicamente a la
foto de perfil de WhatsApp.

## 6. Copia de seguridad

Desde Ajustes puedes exportar todos los contactos a un archivo `.json`,
y volver a importarlo (útil como respaldo, o para pasar datos del modo
local al modo Firebase manualmente).
