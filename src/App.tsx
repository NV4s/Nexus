import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Study from './components/Study';
import Arcade from './components/Arcade';
import Movies from './components/Movies';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import VersionHistory from './components/VersionHistory';
import Intro from './components/Intro';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  
  const [playerState, setPlayerState] = useState<{ isOpen: boolean; title: string; url: string; description: string; sourceTab: string }>({
    isOpen: false,
    title: '',
    url: '',
    description: '',
    sourceTab: 'Home'
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePlayMedia = (title: string, url: string, description: string = '') => {
    setPlayerState({
      isOpen: true,
      title,
      url,
      description,
      sourceTab: activeTab
    });
  };

  const handleClosePlayer = () => {
    setActiveTab(playerState.sourceTab);
    setPlayerState({ ...playerState, isOpen: false, url: '', description: '' });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (playerState.isOpen) {
      setPlayerState({ ...playerState, isOpen: false, url: '' });
    }
  };

  const handleIntroStart = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/cards/[FULL] Jujutsu Shenanigans GOJO domain expansion Music.mp3" />
      {showIntro && <Intro onStart={handleIntroStart} onComplete={() => setShowIntro(false)} />}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        searchQuery={searchQuery} 
        setSearchQuery={handleSearch} 
      />

      <main className="content">
        {playerState.isOpen ? (
          <div id="Player" style={{ display: 'flex' }}>
            <div className="player-header">
              <h2 id="player-title">{playerState.title}</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn-back" 
                  onClick={() => {
                    const absoluteUrl = new URL(playerState.url, window.location.origin).href;
                    const win = window.open('about:blank');
                    if (win) {
                      win.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>${playerState.title}</title>
                          <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
                            iframe { width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <iframe src="${absoluteUrl}"></iframe>
                        </body>
                        </html>
                      `);
                      win.document.close();
                    }
                  }}
                >
                  Fullscreen
                </button>
                <button id="close-player" className="btn-back" onClick={handleClosePlayer}>
                  Back to {playerState.sourceTab}
                </button>
              </div>
            </div>
            <div className="iframe-container" id="iframe-container">
              <iframe 
                id="media-iframe" 
                src={playerState.url || null} 
                title={playerState.title}
                allowFullScreen
              ></iframe>
            </div>
            {playerState.description && (
              <div 
                className="player-description"
                style={{ 
                  marginTop: '2rem', 
                  color: 'var(--text-dim)', 
                  textAlign: 'left', 
                  maxWidth: '900px', 
                  margin: '2rem auto', 
                  padding: '2rem', 
                  background: 'rgba(0,0,0,0.3)', 
                  borderRadius: '12px',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ __html: playerState.description }}
              />
            )}
          </div>
        ) : (
          <>
            <div className={`tab-content ${activeTab === 'Home' ? 'active' : ''}`}>
              {activeTab === 'Home' && <Home setActiveTab={handleTabChange} />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Study' ? 'active' : ''}`}>
              {activeTab === 'Study' && <Study onPlayMedia={handlePlayMedia} />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Arcade' ? 'active' : ''}`}>
              {activeTab === 'Arcade' && <Arcade searchQuery={searchQuery} onPlayMedia={handlePlayMedia} />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Movies' ? 'active' : ''}`}>
              {activeTab === 'Movies' && <Movies searchQuery={searchQuery} onPlayMedia={handlePlayMedia} />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Leaderboard' ? 'active' : ''}`}>
              {activeTab === 'Leaderboard' && <Leaderboard />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Settings' ? 'active' : ''}`}>
              {activeTab === 'Settings' && <Settings toggleTheme={() => setIsLightMode(!isLightMode)} />}
            </div>
            
            <div className={`tab-content ${activeTab === 'Version History' ? 'active' : ''}`}>
              {activeTab === 'Version History' && <VersionHistory />}
            </div>
          </>
        )}
      </main>
    </>
  );
}

