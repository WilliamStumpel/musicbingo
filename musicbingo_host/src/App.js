import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import HostView from './pages/HostView';
import PlayerView from './pages/PlayerView';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HostView />} />
        <Route path="/player" element={<PlayerView />} />
      </Routes>
    </div>
  );
}

export default App;
