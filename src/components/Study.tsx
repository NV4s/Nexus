import React, { useState, useEffect } from 'react';

interface StudyProps {
  onPlayMedia: (title: string, url: string) => void;
}

const STUDY_FILES = [
  '/cards/study/flashcards.html',
  '/cards/study/calculator.html',
  '/cards/study/notes.html'
];

interface CardData {
  html: string;
  title: string;
  category: string;
  url: string;
}

export default function Study({ onPlayMedia }: StudyProps) {
  const [cards, setCards] = useState<CardData[]>([]);

  useEffect(() => {
    Promise.all(STUDY_FILES.map(url => fetch(url).then(res => res.text())))
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

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest('.media-card');
    if (card) {
      const title = card.getAttribute('data-title') || '';
      const url = card.getAttribute('data-url') || '';
      onPlayMedia(title, url);
    }
  };

  return (
    <div id="Study">
      <div className="section-header">
        <h2 className="section-title">Study Resources</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>Access your flashcards, calculators, and notes here.</p>
      </div>
      
      <div className="grid-container" onClick={handleGridClick}>
        {cards.map((card, index) => (
          <div 
            key={card.title} 
            className="animated-wrapper" 
            style={{ animationDelay: `${index * 0.15}s` }}
            dangerouslySetInnerHTML={{ __html: card.html }}
          />
        ))}
      </div>
    </div>
  );
}
