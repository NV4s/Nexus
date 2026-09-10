import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GameGrid from './components/GameGrid';
import Study from './components/Study';
import Chat from './components/Chat';
import GamePage from './components/GamePage';
import Settings from './components/Settings';
import Changelog from './components/Changelog';
import Achievements from './components/Achievements';
import Saves from './components/Saves';
import GameEmbed from './components/GameEmbed';
import { segments, useRoute } from './lib/router';
import { comboFrom, panic, readCombo } from './lib/panic';
import { startTracking } from './lib/track';
import { loadSiteConfig, onSiteConfig, siteConfig } from './lib/siteConfig';



const VoidIntro = lazy(() => import('./webgl/VoidIntro'));



const Admin = lazy(() => import('./components/Admin'));


const Assistant = lazy(() => import('./components/Assistant'));


const Consoles = lazy(() => import('./components/Consoles'));
const Emulator = lazy(() => import('./components/Emulator'));

export default function App() {
  const route = useRoute();

  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem('introSeen') && (window.location.hash.slice(1) || '/') === '/',
  );

  const dismissIntro = useCallback(() => {
    sessionStorage.setItem('introSeen', '1');
    setShowIntro(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (localStorage.getItem('recordingPanicCombo') === 'true') return;
      if (comboFrom(event) === readCombo()) {
        event.preventDefault();
        panic();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(startTracking, []);



  const [banner, setBanner] = useState(() => siteConfig().banner);
  useEffect(() => {
    const stop = onSiteConfig((config) => setBanner(config.banner));
    void loadSiteConfig();
    return stop;
  }, []);

  const [head, param] = segments(route);



  const pageKey = (name?: string) =>
    name === 'saves' ? 'achievements' : name === 'changelog' ? 'settings' : name ?? 'home';



  if (head === 'embed' && param) return <GameEmbed slug={param} />;

  return (
    <>
      <Analytics />
      {showIntro && (
        <Suspense fallback={<div className="intro" />}>
          <VoidIntro onComplete={dismissIntro} />
        </Suspense>
      )}

      {banner && <div className="site-banner">{banner}</div>}

      <Navbar route={route} />


      <main className="content">

        <div className="page" key={showIntro ? 'intro' : `${pageKey(head)}/${param ?? ''}`}>
        {showIntro ? null : head === 'game' && param ? (
          <GamePage slug={param} />
        ) : head === 'arcade' ? (
          <GameGrid section="arcade" title="Arcade" lede="Flash and browser games, playable here." />
        ) : head === 'study' ? (
          <Study />
        ) : head === 'chat' ? (
          <Chat />
        ) : head === 'settings' || head === 'changelog' ? (
          <>
            <Settings />
            <Changelog />
          </>
        ) : head === 'achievements' || head === 'saves' ? (
          <>
            <Achievements />
            <Saves />
          </>
        ) : head === 'emulators' ? (
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Consoles />
          </Suspense>
        ) : head === 'emulator' && param ? (
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Emulator id={param} />
          </Suspense>
        ) : head === 'assistant' ? (
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Assistant />
          </Suspense>
        ) : head === 'admin' ? (
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Admin />
          </Suspense>
        ) : (
          <Home />
        )}
        </div>
      </main>
    </>
  );
}
