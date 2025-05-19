require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const WORD_COUNT = parseInt(process.env.WORD_COUNT) || 4;
const WORD_TIMEOUT = parseInt(process.env.WORD_TIMEOUT) || 12;
const VIDEO_PATH = process.env.VIDEO_PATH || '/videos/background.mp4';

// Middleware
app.use(cors());
app.use(express.json());

// Stockage en mémoire des mots actifs
let activeWords = [];
let predefinedWords = [];

// Ajout pour le long polling
let lastChangeTimestamp = Date.now();
let wordsListeners = [];

function notifyWordsChanged() {
    lastChangeTimestamp = Date.now();
    wordsListeners.forEach(listener => listener());
    wordsListeners = [];
}

// Chargement des mots prédéfinis
async function loadPredefinedWords() {
    try {
        const content = await fs.readFile(path.join(__dirname, 'predefined.txt'), 'utf-8');
        predefinedWords = content.split('\n').filter(word => word.trim());
    } catch (error) {
        console.error('Erreur lors du chargement des mots prédéfinis:', error);
        predefinedWords = ['innovation', 'créativité', 'partage', 'avenir'];
    }
}

// Initialisation avec des mots prédéfinis
function initializeWords() {
    const now = Date.now();
    activeWords = predefinedWords.slice(0, WORD_COUNT).map(word => ({
        text: word,
        timestamp: now
    }));
}

// Remplacement automatique des mots après timeout
function checkTimeouts() {
    const now = Date.now();
    let changed = false;
    for (let i = 0; i < activeWords.length; i++) {
        if (now - activeWords[i].timestamp > WORD_TIMEOUT * 1000) {
            // Remplacer par un mot prédéfini aléatoire différent
            const used = new Set(activeWords.map(w => w.text));
            const candidates = predefinedWords.filter(w => !used.has(w));
            const newWord = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : predefinedWords[Math.floor(Math.random() * predefinedWords.length)];
            activeWords[i] = { text: newWord, timestamp: now };
            changed = true;
        }
    }
    if (changed) notifyWordsChanged();
}

// Timer asynchrone pour vérifier les expirations toutes les secondes
setInterval(checkTimeouts, 1000);

// Endpoint pour recevoir un nouveau mot
app.post('/api/word', (req, res) => {
    const { word } = req.body;
    if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Mot invalide' });
    }
    // Trouver l'index du mot le plus ancien
    let oldestIndex = 0;
    let oldestTimestamp = activeWords[0]?.timestamp || 0;
    for (let i = 1; i < activeWords.length; i++) {
        if (activeWords[i].timestamp < oldestTimestamp) {
            oldestTimestamp = activeWords[i].timestamp;
            oldestIndex = i;
        }
    }
    // Remplacer le mot le plus ancien par le nouveau mot
    activeWords[oldestIndex] = {
        text: word,
        timestamp: Date.now()
    };
    notifyWordsChanged();
    res.json({ success: true, activeWords });
});

// Endpoint pour obtenir les mots actifs (long polling)
app.get('/api/words', async (req, res) => {
    const since = parseInt(req.query.since || '0', 10);
    const currentWords = activeWords.map(w => ({ ...w }));
    const currentLastChange = Math.max(...currentWords.map(w => w.timestamp), lastChangeTimestamp);
    if (since < currentLastChange) {
        return res.json({ words: currentWords, lastChange: currentLastChange });
    }
    // Sinon, attendre un changement ou timeout
    let finished = false;
    const timeout = setTimeout(() => {
        if (!finished) {
            finished = true;
            res.json({ words: activeWords.map(w => ({ ...w })), lastChange: Math.max(...activeWords.map(w => w.timestamp), lastChangeTimestamp) });
        }
    }, WORD_TIMEOUT * 1000);
    wordsListeners.push(() => {
        if (!finished) {
            finished = true;
            clearTimeout(timeout);
            res.json({ words: activeWords.map(w => ({ ...w })), lastChange: Math.max(...activeWords.map(w => w.timestamp), lastChangeTimestamp) });
        }
    });
});

// Endpoint pour obtenir la config (chemin vidéo)
app.get('/api/config', (req, res) => {
    res.json({ videoPath: VIDEO_PATH });
});

// Démarrage du serveur
async function prepareApp() {
    if (predefinedWords.length === 0) {
        await loadPredefinedWords();
        initializeWords();
    }
}

module.exports = async (req, res) => {
    await prepareApp();
    app(req, res);
}; 