import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WordCloud.css';

// Rayon de collision horizontal et vertical en %
const COLLISION_RADIUS_X = 18;
const COLLISION_RADIUS_Y = 24;
const MAX_ATTEMPTS = 40;
const EXIT_DURATION = 500; // ms, doit correspondre à la durée de l'animation exit

function distance(a, b) {
  const dx = parseFloat(a.x) - parseFloat(b.x);
  const dy = parseFloat(a.y) - parseFloat(b.y);
  return { dx: Math.abs(dx), dy: Math.abs(dy) };
}

function getNonOverlappingPosition(existing) {
  let pos, attempts = 0;
  do {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * 25;
    const yJitter = (Math.random() - 0.5) * 4;
    pos = {
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle) + yJitter
    };
    attempts++;
  } while (
    existing.some(p => {
      const d = distance(p, pos);
      return d.dx < COLLISION_RADIUS_X && d.dy < COLLISION_RADIUS_Y;
    }) && attempts < MAX_ATTEMPTS
  );
  return { x: `${pos.x}%`, y: `${pos.y}%` };
}

// Utilitaire pour générer une clé unique par mot (texte + timestamp)
function getWordKey(word) {
  return `${word.text}_${word.timestamp || ''}`;
}

const WordCloud = ({ words }) => {
  // Tableau de positions indexées
  const positionsRef = useRef([]); // [{x, y}]
  const keysRef = useRef([]); // [key]

  // Animation flottante aléatoire
  const [floatKey, setFloatKey] = useState(0);
  const [floatAnim, setFloatAnim] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeout;
    function randomFloat() {
      // Mouvement aléatoire dans un carré de 40px autour du centre
      const x = Math.random() * 40 - 20;
      const y = Math.random() * 40 - 20;
      setFloatAnim({ x, y });
      setFloatKey(k => k + 1);
      timeout = setTimeout(randomFloat, 4000 + Math.random() * 2000);
    }
    randomFloat();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const newPositions = [...positionsRef.current];
    const newKeys = [...keysRef.current];
    for (let i = 0; i < words.length; i++) {
      const key = getWordKey(words[i]);
      if (newKeys[i] !== key) {
        // Mot changé à cet index, générer une nouvelle position non chevauchante
        // On prend les positions des autres mots déjà placés
        const otherPositions = newPositions.filter((_, idx) => idx !== i && idx < words.length);
        newPositions[i] = getNonOverlappingPosition(otherPositions);
        newKeys[i] = key;
      }
    }
    // Si la liste a raccourci, on coupe
    newPositions.length = words.length;
    newKeys.length = words.length;
    positionsRef.current = newPositions;
    keysRef.current = newKeys;
  }, [words]);

  return (
    <motion.div
      className="word-cloud"
      style={{
        transform: `translate(-50%, -50%) translate(${floatAnim.x}px, ${floatAnim.y}px)`
      }}
      key={floatKey}
      transition={{ duration: 4, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {words.map((word, index) => {
          const pos = positionsRef.current[index] || { x: '50%', y: '50%' };
          const key = getWordKey(word);
          return (
            <motion.div
              key={key}
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
              transition={{ duration: EXIT_DURATION / 1000, ease: 'easeOut' }}
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)', fontSize: '1.7rem' }}
            >
              {word.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default WordCloud; 