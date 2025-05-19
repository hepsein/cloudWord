import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WordCloud.css';

// Rayon de collision horizontal et vertical en %
const COLLISION_RADIUS_X = 13;
const COLLISION_RADIUS_Y = 18; // plus grand pour éviter les touches de jambages
const MAX_ATTEMPTS = 40;

function distance(a, b) {
  const dx = parseFloat(a.x) - parseFloat(b.x);
  const dy = parseFloat(a.y) - parseFloat(b.y);
  return { dx: Math.abs(dx), dy: Math.abs(dy) };
}

function getNonOverlappingPositions(count, radius = 25, existing = []) {
  const positions = [...existing];
  for (let i = existing.length; i < count; i++) {
    let pos, attempts = 0;
    do {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * radius;
      const yJitter = (Math.random() - 0.5) * 4; // +/-2%
      pos = {
        x: 50 + r * Math.cos(angle),
        y: 50 + r * Math.sin(angle) + yJitter
      };
      attempts++;
    } while (
      positions.some(p => {
        const d = distance(p, pos);
        return d.dx < COLLISION_RADIUS_X && d.dy < COLLISION_RADIUS_Y;
      }) && attempts < MAX_ATTEMPTS
    );
    positions.push(pos);
  }
  return positions.map(p => ({ x: `${p.x}%`, y: `${p.y}%` }));
}

// Utilitaire pour générer une clé unique par mot (texte + timestamp)
function getWordKey(word) {
  return `${word.text}_${word.timestamp || ''}`;
}

const WordCloud = ({ words }) => {
  // On mémorise les positions par clé unique de mot
  const positionsRef = React.useRef({});
  const prevKeysRef = React.useRef([]);

  React.useEffect(() => {
    const keys = words.map(getWordKey);
    const prevKeys = prevKeysRef.current;
    // On garde les positions des mots inchangés
    const newPositions = {};
    let existingPositions = [];
    keys.forEach((key, i) => {
      if (positionsRef.current[key]) {
        newPositions[key] = positionsRef.current[key];
        existingPositions.push({
          x: parseFloat(positionsRef.current[key].x),
          y: parseFloat(positionsRef.current[key].y)
        });
      }
    });
    // Pour les nouveaux mots ou ceux dont le timestamp a changé, on génère une nouvelle position
    const missingCount = keys.length - existingPositions.length;
    const generated = getNonOverlappingPositions(keys.length, 25, existingPositions);
    keys.forEach((key, i) => {
      if (!newPositions[key]) {
        newPositions[key] = generated[i];
      }
    });
    positionsRef.current = newPositions;
    prevKeysRef.current = keys;
  }, [words]);

  const keys = words.map(getWordKey);
  const positions = keys.map(key => positionsRef.current[key] || { x: '50%', y: '50%' });

  return (
    <div className="word-cloud">
      <AnimatePresence>
        {words.map((word, index) => {
          const pos = positions[index];
          return (
            <motion.div
              key={getWordKey(word)}
              className="word"
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                top: pos.y,
                left: pos.x
              }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
            >
              {word.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default WordCloud; 