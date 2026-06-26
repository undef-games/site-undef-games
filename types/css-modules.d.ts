// Ambient declaration so `tsc` accepts the CSS side-effect import in site.ts
// (`import '@undef-games/scanlines-system/styles/site.css'`). In the Vite lab this
// is supplied by Vite's client types; the standalone asset typecheck needs it here.
declare module '*.css'
