import React from 'react';

interface PlayerProps {
  title: string;
  url: string;
  onClose: () => void;
}

export default function Player({ title, url, onClose }: PlayerProps) {
  return (
    <div id="Player" style={{ display: 'flex' }}>
      <div className="player-header">
        <button className="btn-back" onClick={onClose}>← Back</button>
        <h2 className="rgb-text">{title}</h2>
        <div style={{ width: '80px' }}></div>
      </div>
      <div className="iframe-container">
        <iframe src={url} allowFullScreen></iframe>
      </div>
    </div>
  );
}
