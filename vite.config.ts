import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/m/': {
        target: 'https://cdn.jsdelivr.net',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/m\/([^/]+)\//, '/gh/NV4s/swfdump@$1/'),
      },
      '/mr/': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/mr\/([^/]+)\//, '/NV4s/swfdump/$1/'),
      },
      '/ml/': {
        target: 'https://media.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/ml\/([^/]+)\//, '/media/NV4s/swfdump/$1/'),
      },
      '/e/': {
        target: 'https://cdn.jsdelivr.net',
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/e\/([^/]+)\//, '/npm/@emulatorjs/emulatorjs@$1/data/'),
      },
      '/p/0756f330': {
        target: 'https://landgreen.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/0756f330/, '/n-gon'),
      },
      '/p/a1cb8890': {
        target: 'https://nroutasuo.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/a1cb8890/, '/level13'),
      },
      '/logos': { target: 'https://www.google.com', changeOrigin: true },
      '/p/07ad84de': {
        target: 'https://joe-the-chicken.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/07ad84de/, '/polytrack'),
      },
      '/p/20315ea7': {
        target: 'https://colinthepanda.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/20315ea7/, '/BasketballRandom'),
      },
      '/p/7405d5d1': {
        target: 'https://ubg98.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/7405d5d1/, '/BasketballStars'),
      },
      '/p/44399512': {
        target: 'https://trafficjam3d.github.io',
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/p\/44399512/, '/indian-uphill-bus-simulator-3d'),
      },
      '/p/655f2c87': {
        target: 'https://html5.gamedistribution.com',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/p/655f2c87/index.html') ? req.url : undefined),
        rewrite: (path: string) =>
          path.replace(/^\/p\/655f2c87/, '/rvvASMiM/fae39128b95549389ad487f668c0a74c'),
      },
      '/p/4efb52ef': {
        target: 'https://sobloxsy.github.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/4efb52ef/, '/rooftop-snipers'),
      },
      '/p/3c3d334d': {
        target: 'https://jcw87.github.io',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/p/3c3d334d/index.html') ? req.url : undefined),
        rewrite: (path: string) => path.replace(/^\/p\/3c3d334d/, '/c2-sans-fight'),
      },
      '/p/d5cc6a54': {
        target: 'https://html-classic.itch.zone',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/p/d5cc6a54/index.html') ? req.url : undefined),
        rewrite: (path: string) => path.replace(/^\/p\/d5cc6a54/, '/html/18282996'),
      },
      '/p/c3f284e8': {
        target: 'https://funny-school.github.io',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/p/c3f284e8/index.html') ? req.url : undefined),
        rewrite: (path: string) => path.replace(/^\/p\/c3f284e8/, '/f1/footballbros'),
      },
      '/p/a2e781a3': {
        target: 'https://d11jzht7mj96rr.cloudfront.net',
        changeOrigin: true,
        bypass: (req) => (req.url?.startsWith('/p/a2e781a3/index.html') ? req.url : undefined),
        rewrite: (path: string) => path.replace(/^\/p\/a2e781a3/, '/games/2023/unity2/gta-simulator'),
      },
      '/p/0fa40d32': {
        target: 'https://adarkroom.doublespeakgames.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/p\/0fa40d32/, '') || '/',
      },
      '/p/36d84be5/run-3.swf': {
        target: 'https://player03.com',
        changeOrigin: true,
        rewrite: () => '/run/3/Run3.swf',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
});
