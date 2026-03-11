import React, { useState, useEffect } from 'react';

interface ArcadeProps {
  searchQuery: string;
  onPlayMedia: (title: string, url: string) => void;
}

const ARCADE_FILES = [
  '/cards/arcade/cyber-drift.html',
  '/cards/arcade/gba-emulator.html',
  '/cards/arcade/run-3.html'
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
          return {
            html,
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
    const card = (e.target as HTMLElement).closest('.media-card');
    if (card) {
      const title = card.getAttribute('data-title') || '';
      const url = card.getAttribute('data-url') || '';
      onPlayMedia(title, url);
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
