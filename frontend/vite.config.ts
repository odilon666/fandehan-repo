import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './', // Définir le répertoire des fichiers .env (racine par défaut)
  server: {
    port: 5173, // Port par défaut de Vite
    open: true, // Ouvre automatiquement le navigateur
  },
});