import React from 'react';

interface MediaCardProps {
  category: string;
  title: string;
  thumbnailUrl: string;
  onClick: () => void;
  isHighlighted?: boolean;
}

export default function MediaCard({ category, title, thumbnailUrl, onClick, isHighlighted }: MediaCardProps) {
  return (
    <div
      className={`media-card ${isHighlighted ? 'highlight' : ''}`}
      data-category={category}
      data-title={title.toLowerCase()}
      onClick={onClick}
    >
      <div className="thumbnail-placeholder">
        <img src={thumbnailUrl} alt={title} referrerPolicy="no-referrer" />
      </div>
      <span className="category-tag">{category}</span>
      <h3>{title}</h3>
    </div>
  );
}
