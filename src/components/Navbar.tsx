import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery }: NavbarProps) {
  const tabs = ['Home', 'Study', 'Arcade', 'Movies', 'Leaderboard', 'Settings', 'Version History'];

  return (
    <nav className="navbar">
      <div className="logo rgb-text" onClick={() => setActiveTab('Home')}>
        NEXUS
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search games & movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-link ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}
