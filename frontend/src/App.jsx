import React, { useState, useEffect } from 'react';
import VideoBackground from './components/VideoBackground';
import WordCloud from './components/WordCloud';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [words, setWords] = useState([]);

  useEffect(() => {
    // Chargement initial des mots
    fetchWords();

    // Polling toutes les 5 secondes
    const interval = setInterval(fetchWords, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/words`);
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des mots:', error);
    }
  };

  return (
    <div className="app">
      <VideoBackground />
      <WordCloud words={words} />
    </div>
  );
}

export default App; 