import React, { useState, useEffect, useRef } from 'react';
import VideoBackground from './components/VideoBackground';
import WordCloud from './components/WordCloud';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [words, setWords] = useState([]);
  const lastChangeRef = useRef(0);
  const pollingRef = useRef(false);

  useEffect(() => {
    pollingRef.current = true;
    longPollWords();
    return () => { pollingRef.current = false; };
    // eslint-disable-next-line
  }, []);

  const longPollWords = async () => {
    while (pollingRef.current) {
      try {
        const since = lastChangeRef.current || 0;
        const res = await fetch(`${API_URL}/api/words?since=${since}`);
        const data = await res.json();
        if (data && data.words) {
          setWords(prevWords => {
            if (!areWordsEqual(prevWords, data.words)) {
              return data.words;
            }
            return prevWords;
          });
          lastChangeRef.current = data.lastChange || Date.now();
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  return (
    <Router>
      <div className="app">
        <VideoBackground />
        <Routes>
          <Route path="/" element={<WordCloud words={words} />} />
          <Route path="/ajouter" element={<WordInputPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function areWordsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].text !== b[i].text || a[i].timestamp !== b[i].timestamp) return false;
  }
  return true;
}

function WordInputPage() {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!word.trim()) {
      setError('Veuillez entrer un mot.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() })
      });
      if (!res.ok) throw new Error('Erreur lors de l\'ajout du mot');
      setSuccess(true);
      setWord('');
    } catch (err) {
      setError('Erreur lors de l\'ajout du mot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',zIndex:10,position:'relative'}}>
      <div style={{fontSize:'2rem',color:'white',marginBottom:32,textShadow:'0 2px 8px #000'}}>Quel mot vous inspire ummanité ?</div>
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <input
          type="text"
          value={word}
          onChange={e=>setWord(e.target.value)}
          placeholder="Votre mot..."
          style={{fontSize:'1.5rem',padding:'0.5em 1em',borderRadius:8,border:'none',outline:'none',minWidth:220}}
          disabled={loading}
        />
        <button type="submit" style={{fontSize:'1.2rem',padding:'0.5em 1.5em',borderRadius:8,border:'none',background:'#fff',color:'#222',fontWeight:'bold',cursor:'pointer'}} disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
        {success && <div style={{color:'green',marginTop:8}}>Merci pour votre mot !</div>}
      </form>
    </div>
  );
}

export default App;
