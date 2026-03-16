import React, { useState, useEffect } from 'react';

interface MoviesProps {
  searchQuery: string;
  onPlayMedia: (title: string, url: string) => void;
}

const MOVIE_FILES = [
  '/cards/movies/cyberpunk.html',
  '/cards/movies/matrix.html',
  '/cards/movies/mr-robot.html'
];

interface CardData {
  html: string;
  title: string;
  category: string;
  url: string;
}

export default function Movies({ searchQuery, onPlayMedia }: MoviesProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [cards, setCards] = useState<CardData[]>([]);

  useEffect(() => {
    Promise.all(MOVIE_FILES.map(url => fetch(url).then(res => res.text())))
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

  const filteredMovies = cards.filter(movie => {
    const matchesFilter = activeFilter === 'all' || movie.category === activeFilter;
    const matchesSearch = !searchQuery || movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = ['all', 'Anime', 'Movies', 'Shows'];

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const card = target.closest('.media-card');
    if (card) {
      const title = card.getAttribute('data-title') || '';
      const url = card.getAttribute('data-url') || '';
      
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

      onPlayMedia(title, url);
    }
  };

  return (
    <div id="Movies">
      <div className="section-header">
        <h2 className="section-title">Theater</h2>
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

      <div className="grid-container" id="moviesGrid" onClick={handleGridClick}>
        {filteredMovies.map((movie, index) => {
          let finalHtml = movie.html;
          if (searchQuery.length > 0 && movie.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            finalHtml = finalHtml.replace('class="media-card"', 'class="media-card highlight"');
          }
          
          return (
            <div 
              key={movie.title} 
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
