import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const defaultQAQuestions = [
  { q: "The language used to structure web pages.", a: "HTML" },
  { q: "The language used to style web pages.", a: "CSS" },
  { q: "A programming language named after a snake.", a: "PYTHON" },
  { q: "The brain of the computer.", a: "CPU" },
  { q: "Temporary memory used by the computer.", a: "RAM" },
  { q: "Graphics processing unit abbreviation.", a: "GPU" },
  { q: "Storage device with no moving parts.", a: "SSD" },
  { q: "Main circuit board of a computer.", a: "MOTHERBOARD" },
  { q: "Global network connecting computers.", a: "INTERNET" },
  { q: "A website address is called a...", a: "URL" }
];

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, [key, value]);

  return [value, setValue];
}

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('mg_theme', 'dark');
  const [colorPalette, setColorPalette] = useLocalStorage('mg_colorPalette', 'default');
  
  // Q&A Game Settings
  const [qaHints, setQaHints] = useLocalStorage('mg_qaHints', 3);
  const [autoAdjustHints, setAutoAdjustHints] = useLocalStorage('mg_autoAdjustHints', false);
  const [showHintButton, setShowHintButton] = useLocalStorage('mg_showHintButton', true);
  const [qaQuestions, setQaQuestions] = useLocalStorage('mg_qaQuestions_v2', defaultQAQuestions);
  const [qaTimer, setQaTimer] = useLocalStorage('mg_qaTimer_v2', 15);
  const [randomizeQuestions, setRandomizeQuestions] = useLocalStorage('mg_randomizeQuestions', false);
  const [qaQuestionLimit, setQaQuestionLimit] = useLocalStorage('mg_qaQuestionLimit', 0);

  // Code Lab Settings
  const [gridSize, setGridSize] = useLocalStorage('mg_gridSize', 8); // Default 8x8
  const [useSeed, setUseSeed] = useLocalStorage('mg_useSeed', false);
  const [mapSeed, setMapSeed] = useLocalStorage('mg_mapSeed', '');
  const [showNewMapButton, setShowNewMapButton] = useLocalStorage('mg_showNewMapButton', false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-palette', colorPalette);
  }, [colorPalette]);

  const resetToDefaults = () => {
    setTheme('dark');
    setColorPalette('default');
    setQaHints(3);
    setAutoAdjustHints(false);
    setShowHintButton(true);
    setQaQuestions(defaultQAQuestions);
    setQaTimer(15);
    setRandomizeQuestions(false);
    setQaQuestionLimit(0);
    setGridSize(8);
    setUseSeed(false);
    setMapSeed('');
    setShowNewMapButton(false);
  };

  const resetQuestions = () => {
    setQaQuestions(defaultQAQuestions);
  };

  const value = {
    theme, setTheme,
    colorPalette, setColorPalette,
    qaHints, setQaHints,
    autoAdjustHints, setAutoAdjustHints,
    showHintButton, setShowHintButton,
    qaQuestions, setQaQuestions,
    qaTimer, setQaTimer,
    randomizeQuestions, setRandomizeQuestions,
    qaQuestionLimit, setQaQuestionLimit,
    gridSize, setGridSize,
    useSeed, setUseSeed,
    mapSeed, setMapSeed,
    showNewMapButton, setShowNewMapButton,
    resetToDefaults, resetQuestions
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
