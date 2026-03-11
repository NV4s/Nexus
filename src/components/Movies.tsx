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

  const filteredMovies = cards.filter(movie => {
    const matchesFilter = activeFilter === 'all' || movie.category === activeFilter;
    const matchesSearch = !searchQuery || movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = ['all', 'Anime', 'Movies', 'Shows'];

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest('.media-card');
    if (card) {
      const title = card.getAttribute('data-title') || '';
      const url = card.getAttribute('data-url') || '';
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
