import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Mirrors the rewrites in vercel.json so proxied games work in dev too.
  server: {
    proxy: {
      '/n-gon': { target: 'https://landgreen.github.io', changeOrigin: true },
      '/level13': { target: 'https://nroutasuo.github.io', changeOrigin: true },
      '/adarkroom': {
        target: 'https://adarkroom.doublespeakgames.com',
        changeOrigin: true,
        // Its own host serves the game at the root, unlike the github.io copies.
        rewrite: (path: string) => path.replace(/^\/adarkroom/, '') || '/',
      },
      '/swf/run-3.swf': {
        target: 'https://player03.com',
        changeOrigin: true,
        rewrite: () => '/run/3/Run3.swf',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // three + r3f is most of the bundle and changes far less often than app code
        manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
});
