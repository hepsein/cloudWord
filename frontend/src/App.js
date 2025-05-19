import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchWords = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/words`);
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des mots:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchWords();
    const interval = setInterval(fetchWords, 5000);
    return () => clearInterval(interval);
  }, [fetchWords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) {
      setError('Veuillez entrer un mot');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: newWord.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du mot');
      }

      const data = await response.json();
      setWords(data.activeWords);
      setNewWord('');
      setError('');
    } catch (error) {
      setError('Erreur lors de l\'envoi du mot');
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="App">
      <div className="video-background">
        <video autoPlay muted loop>
          <source src="/background.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="content">
        <h1>Nuage de Mots</h1>
        
        <div className="word-cloud">
          {words.map((word, index) => (
            <div
              key={word.timestamp}
              className="word"
              style={{
                '--delay': `${index * 0.2}s`,
                '--x': `${Math.random() * 80 - 40}%`,
                '--y': `${Math.random() * 80 - 40}%`
              }}
            >
              {word.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="word-form">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Entrez un nouveau mot..."
            className="word-input"
          />
          <button type="submit" className="submit-button">
            Ajouter
          </button>
        </form>
        
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default App;
