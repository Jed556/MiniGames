import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import QAGame from './pages/QAGame';
import CodeLabGame from './pages/CodeLabGame';
import Settings from './pages/Settings';
import { useSettings } from './context/SettingsContext';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/qa" element={<QAGame />} />
        <Route path="/codelab" element={<CodeLabGame />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
