import React from 'react';

const VERSIONS = [
  {
    version: 'v1.1.1',
    date: '2026-03-22',
    changes: [
      'Added "Gun Mayhem 2" to Arcade'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-03-16',
    changes: [
      'Added "Alien Hominid" to Arcade'
    ]
  },
  {
    version: 'v1.0.9',
    date: '2026-03-16',
    changes: [
      'Added a Fullscreen button on the player page for each application',
      'Added descriptions to the player page for each application'
    ]
  },
  {
    version: 'v1.0.8',
    date: '2026-03-09',
    changes: [
      'Moved the Instagram icon to the bottom of the page',
      'Implemented the sound from the provided mp4 to match the domain expansion effect'
    ]
  },
  {
    version: 'v1.0.7',
    date: '2026-03-09',
    changes: [
      'Added a 10-second "Infinite Void Domain Expansion" intro animation',
      'Added Instagram social icon with embed link to the Home page',
      'Made box transitions and appearance speed even slower for a smoother feel'
    ]
  },
  {
    version: 'v1.0.6',
    date: '2026-03-09',
    changes: [
      'Fixed Version History boxes layout',
      'Made transitions slower and smoother',
      'Modified the nexus background strings to change colors based on RGB'
    ]
  },
  {
    version: 'v1.0.5',
    date: '2026-03-09',
    changes: [
      'Removed the big blue background in Study',
      'Made boxes in all categories evened out (same height and width, 3 per row)',
      'Removed YouTube embeds from all boxes in Movies tab'
    ]
  },
  {
    version: 'v1.0.4',
    date: '2026-03-09',
    changes: [
      'Revised Study section to use external HTML cards like Arcade (Code-only / Not related to front end)',
      'Removed Pokémon Emerald from Arcade',
      'Added "Launch Study" and "Launch Movies" buttons to Home screen',
      'Added randomized greetings on the Home screen (Beta)'
    ]
  },
  {
    version: 'v1.0.3',
    date: '2026-03-09',
    changes: [
      'Added Version History tab',
      'Replaced all thumbnails with code placeholders',
      'Made Study boxes clickable / functional'
    ]
  },
  {
    version: 'v1.0.2',
    date: '2026-03-09',
    changes: [
      'Refactored Arcade and Movies to use external HTML cards',
      'Added interactive Nexus background with click-and-drag',
      'Fixed animation bugs for media boxes'
    ]
  },
  {
    version: 'v1.0.1',
    date: '2026-03-08',
    changes: [
      'Added Home, Study, Arcade, Movies, Leaderboard, Settings',
      'Added Tab Disguise and Panic Button',
      'Added Apple-style spring animations'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-03-08',
    changes: [
      'Start of NEXUS Project',
    ]
  }
];

export default function VersionHistory() {
  return (
    <div id="VersionHistory">
      <div className="section-header">
        <h2 className="section-title">Version History</h2>
      </div>
      <div className="history-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {VERSIONS.map((v, index) => (
          <div 
            key={v.version} 
            className="animated-wrapper media-card history-card" 
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--rgb-base)' }}>{v.version}</h3>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{v.date}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
              {v.changes.map((change, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
