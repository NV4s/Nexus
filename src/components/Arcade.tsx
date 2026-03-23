import React, { useState, useEffect } from 'react';

interface ArcadeProps {
  searchQuery: string;
  onPlayMedia: (title: string, url: string, description?: string) => void;
}

const ARCADE_FILES = [
  '/cards/arcade/cyber-drift.html',
  '/cards/arcade/gba-emulator.html',
  '/cards/arcade/run-3.html',
  '/cards/arcade/adrenaline_challenge.html',
  '/cards/arcade/alien_hominid.html',
  '/cards/arcade/gun_mayhem_2.html'
];

interface CardData {
  html: string;
  title: string;
  category: string;
  url: string;
}

export default function Arcade({ searchQuery, onPlayMedia }: ArcadeProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [cards, setCards] = useState<CardData[]>([]);

  useEffect(() => {
    Promise.all(ARCADE_FILES.map(url => fetch(url).then(res => res.text())))
      .then(htmlStrings => {
        const parser = new DOMParser();
        const parsedCards = htmlStrings.map(html => {
          const doc = parser.parseFromString(html, 'text/html');
          const card = doc.querySelector('.media-card');
          
          const tooltip = card?.querySelector('.card-tooltip');
          const url = card?.getAttribute('data-url');
          if (tooltip && url) {
            const btn = document.createElement('button');
            btn.className = 'fullscreen-btn';
            btn.textContent = 'Fullscreen';
            tooltip.appendChild(btn);
          }

          return {
            html: card?.outerHTML || html,
            title: card?.getAttribute('data-title') || '',
            category: card?.getAttribute('data-category') || '',
            url: card?.getAttribute('data-url') || ''
          };
        });
        setCards(parsedCards);
      });
  }, []);

  const filteredGames = cards.filter(game => {
    const matchesFilter = activeFilter === 'all' || game.category === activeFilter;
    const matchesSearch = !searchQuery || game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = ['all', 'Emulator Games', 'Emulator Systems', 'Flash', 'HTML5'];

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const card = target.closest('.media-card');
    if (card) {
      const title = card.getAttribute('data-title') || '';
      const url = card.getAttribute('data-url') || '';
      
      let description = '<p>Placeholder description for this application.</p>';
      const richDesc = card.querySelector('.description-content');
      if (richDesc) {
        description = richDesc.innerHTML;
      } else {
        const descElement = Array.from(card.querySelectorAll('.card-tooltip p')).find(p => p.textContent?.startsWith('Description:'));
        if (descElement) {
          description = `<p>${descElement.textContent?.replace('Description:', '').trim()}</p>`;
        }
      }
      
      if (target.closest('.fullscreen-btn')) {
        e.stopPropagation();
        const absoluteUrl = new URL(url, window.location.origin).href;
        const win = window.open('about:blank');
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${title}</title>
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
        return;
      }

      onPlayMedia(title, url, description);
    }
  };

  return (
    <div id="Arcade">
      <div className="section-header">
        <h2 className="section-title">Arcade</h2>
        <div className="category-filters">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-container" id="arcadeGrid" onClick={handleGridClick}>
        {filteredGames.map((game, index) => {
          let finalHtml = game.html;
          if (searchQuery.length > 0 && game.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            finalHtml = finalHtml.replace('class="media-card"', 'class="media-card highlight"');
          }
          
          return (
            <div 
              key={game.title} 
              className="animated-wrapper"
              style={{ animationDelay: `${index * 0.15}s` }}
              dangerouslySetInnerHTML={{ __html: finalHtml }}
            />
          );
        })}
      </div>
    </div>
  );
}
