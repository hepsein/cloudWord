import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WordCloud.css';

// Rayon de collision horizontal et vertical en %
const COLLISION_RADIUS_X = 13;
const COLLISION_RADIUS_Y = 18; // plus grand pour éviter les touches de jambages
const MAX_ATTEMPTS = 40;
const EXIT_DURATION = 500; // ms, doit correspondre à la durée de l'animation exit

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
  // Mémorise toutes les positions visibles (présentes ou en sortie)
  const visiblePositionsRef = React.useRef({});
  const exitingTimeoutsRef = React.useRef({});

  // Met à jour la liste des positions visibles à chaque changement de mots
  React.useEffect(() => {
    const keys = words.map(getWordKey);
    // Ajoute les nouveaux mots
    keys.forEach((key, i) => {
      if (!visiblePositionsRef.current[key] && WordCloud.prevPositions && WordCloud.prevPositions[key]) {
        visiblePositionsRef.current[key] = WordCloud.prevPositions[key];
      }
    });
    // Supprime les mots qui ne sont plus présents ni en sortie
    Object.keys(visiblePositionsRef.current).forEach(key => {
      if (!keys.includes(key) && !exitingTimeoutsRef.current[key]) {
        delete visiblePositionsRef.current[key];
      }
    });
  }, [words]);

  // Génère et mémorise les positions pour chaque mot (texte+timestamp)
  const positions = React.useMemo(() => {
    const prev = WordCloud.prevPositions || {};
    const keys = words.map(getWordKey);
    // On garde les positions des mots inchangés
    const existing = [];
    const newPositions = {};
    keys.forEach((key, i) => {
      if (prev[key]) {
        newPositions[key] = prev[key];
        existing.push({
          x: parseFloat(prev[key].x),
          y: parseFloat(prev[key].y)
        });
      }
    });
    // Ajouter toutes les positions visibles (présentes ou en sortie)
    Object.values(visiblePositionsRef.current).forEach(pos => {
      existing.push({ x: parseFloat(pos.x), y: parseFloat(pos.y) });
    });
    // Générer les positions manquantes
    const generated = getNonOverlappingPositions(keys.length, 25, existing);
    keys.forEach((key, i) => {
      if (!newPositions[key]) {
        newPositions[key] = generated[i];
      }
    });
    WordCloud.prevPositions = newPositions;
    // Met à jour les positions visibles
    keys.forEach((key, i) => {
      visiblePositionsRef.current[key] = newPositions[key];
    });
    return keys.map(key => newPositions[key]);
  }, [words]);

  // Gestion de la sortie d'un mot
  const handleExit = (word, pos) => {
    const key = getWordKey(word);
    visiblePositionsRef.current[key] = pos;
    // On garde la position visible pendant toute la durée de l'animation
    if (exitingTimeoutsRef.current[key]) {
      clearTimeout(exitingTimeoutsRef.current[key]);
    }
    exitingTimeoutsRef.current[key] = setTimeout(() => {
      delete visiblePositionsRef.current[key];
      delete exitingTimeoutsRef.current[key];
    }, EXIT_DURATION + 10);
  };

  return (
    <div className="word-cloud">
      <AnimatePresence>
        {words.map((word, index) => {
          const pos = positions[index];
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
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
              onExit={() => handleExit(word, pos)}
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