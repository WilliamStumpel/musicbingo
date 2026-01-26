import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PrepView.css';
import { VenueManager } from '../components/VenueManager';

const TABS = {
  VENUES: 'venues',
  NIGHTS: 'nights',
  GAMES: 'games',
};

function PrepView() {
  const [activeTab, setActiveTab] = useState(TABS.VENUES);

  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.VENUES:
        return <VenueManager />;
      case TABS.NIGHTS:
        return (
          <div className="coming-soon">
            <h3>Venue Nights</h3>
            <p>Coming soon - Schedule game nights at your venues</p>
          </div>
        );
      case TABS.GAMES:
        return (
          <div className="coming-soon">
            <h3>Games</h3>
            <p>Coming soon - Create and manage bingo games</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="prep-view">
      <header className="prep-header">
        <div className="header-left">
          <h1>Game Prep</h1>
          <Link to="/" className="back-link">
            Back to Host
          </Link>
        </div>

        <nav className="tab-navigation">
          <button
            className={`tab-button ${activeTab === TABS.VENUES ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.VENUES)}
          >
            Venues
          </button>
          <button
            className={`tab-button ${activeTab === TABS.NIGHTS ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.NIGHTS)}
          >
            Nights
          </button>
          <button
            className={`tab-button ${activeTab === TABS.GAMES ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.GAMES)}
          >
            Games
          </button>
        </nav>
      </header>

      <main className="prep-main">
        {renderTabContent()}
      </main>

      <footer className="prep-footer">
        <p>Music Bingo - Game Prep</p>
      </footer>
    </div>
  );
}

export default PrepView;
