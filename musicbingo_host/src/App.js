import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import HostView from './pages/HostView';
import PlayerView from './pages/PlayerView';
import PrepView from './pages/PrepView';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HostView />} />
        <Route path="/player" element={<PlayerView />} />
        <Route path="/prep" element={<PrepView />} />
      </Routes>
    </div>
  );
}

export default App;
