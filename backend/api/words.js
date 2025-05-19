const express = require('express');
const app = express();
app.use(express.json());

// Stockage en mémoire des mots actifs
let activeWords = [];
let predefinedWords = ['innovation', 'créativité', 'partage', 'avenir', 'équipe', 'progrès', 'vision', 'collaboration', 'succès', 'inspiration', 'dynamisme', 'excellence', 'passion', 'synergie'];

// Initialisation avec des mots prédéfinis
function initializeWords() {
    const now = Date.now();
    activeWords = predefinedWords.slice(0, 4).map(word => ({
        text: word,
        timestamp: now
    }));
}

// Initialiser les mots au démarrage
initializeWords();

// Endpoint pour obtenir les mots actifs
app.get('/api/words', (req, res) => {
    res.json(activeWords);
});

// Endpoint pour recevoir un nouveau mot
app.post('/api/word', (req, res) => {
    const { word } = req.body;
    if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Mot invalide' });
    }
    activeWords.shift();
    activeWords.push({
        text: word,
        timestamp: Date.now()
    });
    res.json({ success: true, activeWords });
});

module.exports = app; 