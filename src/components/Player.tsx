import React, { useEffect, useRef } from 'react';

interface PlayerProps {
  title: string;
  url: string;
  description?: string;
  onClose: () => void;
}

declare global {
  interface Window {
    RufflePlayer: any;
  }
}

export default function Player({ title, url, description, onClose }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFlash = url.toLowerCase().includes('.swf') || url.includes('PLACEHOLDER_FOR_') || url.includes('_SWF_URL');
  const ruffleInitialized = useRef(false);

  const handleFullscreen = () => {
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert('Please allow popups to open the game in fullscreen.');
      return;
    }

    const swfUrl = url.includes('PLACEHOLDER') ? '' : url;
    
    let content = '';
    if (isFlash) {
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Fullscreen</title>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
            #container { width: 100%; height: 100%; }
          </style>
          <script src="https://unpkg.com/@ruffle-rs/ruffle"></script>
        </head>
        <body>
          <div id="container"></div>
          <script>
            window.RufflePlayer = window.RufflePlayer || {};
            window.addEventListener("load", (event) => {
                const ruffle = window.RufflePlayer.newest();
                const player = ruffle.createPlayer();
                const container = document.getElementById("container");
                container.appendChild(player);
                player.style.width = "100%";
                player.style.height = "100%";
                player.load({
                    url: "${swfUrl}",
                    autoplay: "on",
                    allowScriptAccess: true
                });
            });
          </script>
        </body>
        </html>
      `;
    } else {
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Fullscreen</title>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${url}" allowfullscreen></iframe>
        </body>
        </html>
      `;
    }

    win.document.write(content);
    win.document.close();
  };

  useEffect(() => {
    if (isFlash && containerRef.current) {
      // Clear container on every effect run
      containerRef.current.innerHTML = '';
      ruffleInitialized.current = false;
      
      const initRuffle = () => {
        // Guard against multiple initializations in the same container
        if (ruffleInitialized.current || !containerRef.current) return;
        
        if (window.RufflePlayer) {
          const ruffle = window.RufflePlayer.newest();
          const player = ruffle.createPlayer();
          
          player.style.width = '100%';
          player.style.height = '100%';
          
          containerRef.current.innerHTML = ''; // Final clear just in case
          containerRef.current.appendChild(player);
          ruffleInitialized.current = true;
          
          const swfUrl = url.includes('PLACEHOLDER') ? '' : url;
          if (swfUrl) {
            player.load({
              url: swfUrl,
              allowScriptAccess: true,
              autoplay: 'on',
              unmuteOverlay: 'hidden'
            });
          } else {
            const msg = document.createElement('div');
            msg.className = 'placeholder-msg';
            msg.innerHTML = `
              <div style="text-align: center; color: var(--rgb-base); padding: 2rem; border: 2px dashed var(--rgb-base); border-radius: 12px; background: rgba(0,0,0,0.5);">
                <h3 style="margin-bottom: 1rem;">FLASH PLAYER READY</h3>
                <p style="margin-bottom: 1rem; color: var(--text-main);">To play this game, replace the placeholder URL in the card file with a direct link to a .swf file.</p>
                <div style="background: #000; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; word-break: break-all;">
                  data-url="https://your-cdn.com/game.swf"
                </div>
              </div>
            `;
            containerRef.current.appendChild(msg);
          }
        }
      };

      if (window.RufflePlayer) {
        initRuffle();
      } else {
        // Check if script is already loading to avoid duplicates
        let script = document.querySelector('script[src*="ruffle"]') as HTMLScriptElement;
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://unpkg.com/@ruffle-rs/ruffle';
          script.async = true;
          document.body.appendChild(script);
        }
        
        const currentScript = script;
        const handleLoad = () => initRuffle();
        currentScript.addEventListener('load', handleLoad);
        
        return () => {
          currentScript.removeEventListener('load', handleLoad);
        };
      }
    }
  }, [isFlash, url]);

  return (
    <div id="Player" style={{ display: 'flex' }}>
      <div className="player-header">
        <button className="btn-back" onClick={onClose}>← Back</button>
        <h2 className="rgb-text">{title}</h2>
        <button className="btn-back" onClick={handleFullscreen} style={{ borderColor: 'var(--rgb-base)' }}>Fullscreen ⛶</button>
      </div>
      <div className="iframe-container">
        {isFlash ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}></div>
        ) : (
          <iframe src={url} allowFullScreen></iframe>
        )}
      </div>
      {description && (
        <div className="player-description" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-dim)', width: '100%' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>About the Game</h3>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>{description}</p>
        </div>
      )}
    </div>
  );
}
