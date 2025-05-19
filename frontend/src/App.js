import React, { useState, useEffect, useRef } from 'react';
import VideoBackground from './components/VideoBackground';
import WordCloud from './components/WordCloud';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/ajout" element={<WordInputPage />} />
        <Route path="/" element={<MainCloudPage />} />
      </Routes>
    </Router>
  );
}

function MainCloudPage() {
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
    <div className="app">
      <VideoBackground />
      <WordCloud words={words} />
    </div>
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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 20,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
        border: '1px solid #e0e7ef',
        padding: '44px 32px 36px 32px',
        minWidth: 340,
        maxWidth: 380,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>
        <div style={{fontSize:'1.7rem',color:'#222',marginBottom:8,fontWeight:600,letterSpacing:'.01em',textAlign:'center'}}>Quel mot vous inspire ummanité&nbsp;?</div>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,width:'100%'}} autoComplete="off">
          <input
            type="text"
            value={word}
            onChange={e=>setWord(e.target.value)}
            placeholder="Votre mot..."
            style={{
              fontSize:'1.15rem',
              padding:'0.8em 1.2em',
              borderRadius:12,
              border:'1.5px solid #e0e7ef',
              outline:'none',
              minWidth:220,
              background:'#f8fafc',
              boxShadow:'0 2px 8px #0001',
              marginBottom:4,
              transition:'border 0.2s',
              fontWeight:500,
              color:'#222',
            }}
            disabled={loading}
            maxLength={32}
            autoFocus
            onFocus={e => e.target.style.border = '1.5px solid #a3bffa'}
            onBlur={e => e.target.style.border = '1.5px solid #e0e7ef'}
          />
          <button type="submit" style={{
            fontSize:'1.08rem',
            padding:'0.7em 2.2em',
            borderRadius:12,
            border:'none',
            background:'linear-gradient(90deg,#a3bffa,#fbc2eb)',
            color:'#222',
            fontWeight:'bold',
            cursor:'pointer',
            boxShadow:'0 2px 8px #0001',
            letterSpacing:'0.03em',
            marginTop:4,
            transition:'background 0.2s',
          }} disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
          {error && <div style={{color:'#ff4d4f',marginTop:8,fontWeight:'bold',fontSize:'1rem'}}>{error}</div>}
          {success && <div style={{color:'#2ecc40',marginTop:8,fontWeight:'bold',fontSize:'1.08rem',background:'#e6ffed',padding:'0.5em 1em',borderRadius:8,boxShadow:'0 2px 8px #0001'}}>Merci pour votre mot !</div>}
        </form>
      </div>
    </div>
  );
}

export default App;
