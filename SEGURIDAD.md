# Seguridad – notas de despliegue

- La build de producción incluye una Política de Seguridad de Contenido (CSP) en `index.html`. No cargues scripts ni recursos de terceros sin actualizarla en `vite.config.ts`.
- La CSP en `<meta>` no puede incluir `frame-ancestors`. Configura estas cabeceras en tu hosting (Netlify, Cloudflare, Nginx, Firebase, etc.). Los valores listos están en `securityHeaders` de `vite.config.ts`:
  `Content-Security-Policy` (con `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, y `Strict-Transport-Security` (HTTPS obligatorio).
- No hay secretos en el proyecto. Si en el futuro agregas un backend o una API, las claves van en el servidor, nunca en código `VITE_*` (todo lo que empieza así queda público en el navegador).
- Haz `git add package-lock.json` y ejecuta `npm audit` / `npm run audit:deps` periódicamente.
