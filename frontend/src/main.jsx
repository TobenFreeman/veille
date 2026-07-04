import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Today from './pages/Today.jsx';
import Archive from './pages/Archive.jsx';
import BriefingByDate from './pages/BriefingByDate.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Today />} />
          <Route path="archives" element={<Archive />} />
          <Route path="jour/:date" element={<BriefingByDate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
