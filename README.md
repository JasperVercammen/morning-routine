# Morning — ochtendroutine

A kids' morning-routine app (Dutch UI). Built with [Vite](https://vitejs.dev/) +
React. The original CDN/in-browser-Babel prototype has been turned into a real
build that emits **plain static files** — no server-side code, no runtime CDN.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 with hot reload
```

## Build static files

```bash
npm run build      # outputs a self-contained dist/ folder
npm run preview    # serve dist/ locally to sanity-check the build
```

Everything the app needs at runtime is bundled into `dist/` (hashed JS + CSS).
Upload the **contents of `dist/`** to any static host — it has no server
requirements. The build uses a relative `base`, so it also works from a
subfolder.

> Runtime note: the live weather uses the browser geolocation API + the public
> Open-Meteo API. If location is denied or offline, it falls back to **Antwerp**
> (and a built-in mock if the API is unreachable). Google Fonts load from the CDN
> with a system-font fallback.

## Project layout

| Path | What |
| --- | --- |
| `index.html` | Vite entry (mounts `#root`, loads `src/main.jsx`) |
| `src/main.jsx` | Import order: React globals → CSS → feature modules → `app.jsx` |
| `src/react-globals.js` | Publishes `window.React` / `window.ReactDOM` (the source modules expect these) |
| `src/*.jsx` | App screens/components (kept in their original window-global style) |
| `src/*.css` | Styles |
