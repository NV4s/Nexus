import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/n-gon': { target: 'https://landgreen.github.io', changeOrigin: true },
      '/level13': { target: 'https://nroutasuo.github.io', changeOrigin: true },
      '/logos': { target: 'https://www.google.com', changeOrigin: true },
      '/polytrack': { target: 'https://joe-the-chicken.github.io', changeOrigin: true },
      '/basket-random': {
        target: 'https://colinthepanda.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/basket-random/, '/BasketballRandom'),
      },
      '/basketball-stars': {
        target: 'https://ubg98.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/basketball-stars/, '/BasketballStars'),
      },
      '/bus-simulator': {
        target: 'https://trafficjam3d.github.io',
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/bus-simulator/, '/indian-uphill-bus-simulator-3d'),
      },
      '/shawarma-kiosk': {
        target: 'https://html5.gamedistribution.com',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/shawarma-kiosk/index.html') ? req.url : undefined),
        rewrite: (path: string) =>
          path.replace(/^\/shawarma-kiosk/, '/rvvASMiM/fae39128b95549389ad487f668c0a74c'),
      },
      '/adarkroom': {
        target: 'https://adarkroom.doublespeakgames.com',
        changeOrigin: true,
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
        manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
});
