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
    for (let i = 0; i < activeWords.length; i++) {
        if (now - activeWords[i].timestamp > WORD_TIMEOUT * 1000) {
            // Remplacer par un mot prédéfini aléatoire différent
            const used = new Set(activeWords.map(w => w.text));
            const candidates = predefinedWords.filter(w => !used.has(w));
            const newWord = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : predefinedWords[Math.floor(Math.random() * predefinedWords.length)];
            activeWords[i] = { text: newWord, timestamp: now };
        }
    }
}

// Endpoint pour recevoir un nouveau mot
app.post('/api/word', (req, res) => {
    const { word } = req.body;
    if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Mot invalide' });
    }
    // Supprimer le mot le plus ancien
    activeWords.shift();
    // Ajouter le nouveau mot
    activeWords.push({
        text: word,
        timestamp: Date.now()
    });
    res.json({ success: true, activeWords });
});

// Endpoint pour obtenir les mots actifs
app.get('/api/words', (req, res) => {
    checkTimeouts();
    res.json(activeWords);
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