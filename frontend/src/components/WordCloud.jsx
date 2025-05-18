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

function getNonOverlappingPositions(count, radius = 25) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    let pos, attempts = 0;
    do {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * radius;
      // Ajout d'un petit décalage vertical aléatoire pour éviter les touches de points/jambages
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

const WordCloud = ({ words }) => {
  // Génère des positions non chevauchantes à chaque rendu
  const positions = React.useMemo(
    () => getNonOverlappingPositions(words.length, 25),
    [words]
  );

  return (
    <div className="word-cloud">
      <AnimatePresence>
        {words.map((word, index) => {
          const pos = positions[index];
          return (
            <motion.div
              key={word.text}
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