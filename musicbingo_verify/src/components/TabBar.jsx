import React from 'react';
import './TabBar.css';

export function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
        onClick={() => onTabChange('scan')}
      >
        <span className="tab-icon">Scan</span>
        <span className="tab-label">Scan</span>
      </button>
      <button
        className={`tab-button ${activeTab === 'checklist' ? 'active' : ''}`}
        onClick={() => onTabChange('checklist')}
      >
        <span className="tab-icon">Songs</span>
        <span className="tab-label">Songs</span>
      </button>
    </div>
  );
}
