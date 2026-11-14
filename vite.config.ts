import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Política de seguridad de contenido: solo se permite código y recursos del
// propio sitio. Se inyecta únicamente en el build de producción (en desarrollo
// Vite necesita scripts en línea para el recargado en vivo).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // React usa un estilo en línea (barra de progreso)
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': `${CSP}; frame-ancestors 'none'`,
  'X-Frame-Options': 'DENY',
};

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      return [{tag: 'meta', attrs: {'http-equiv': 'Content-Security-Policy', content: CSP}, injectTo: 'head-prepend'}];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cspPlugin()],
    build: {sourcemap: false},
    preview: {headers: securityHeaders},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
