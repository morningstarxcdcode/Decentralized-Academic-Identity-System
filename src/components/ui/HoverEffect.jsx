import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const HoverEffect = ({ items, className }) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={`flex flex-row gap-4 ${className}`} style={{display: 'flex', gap: '8px'}}>
      {items.map((item, idx) => (
        <Link
          to={item.link}
          key={item.link}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{position: 'relative', padding: '8px 16px', textDecoration: 'none'}}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    zIndex: 0
                }}
              />
            )}
          </AnimatePresence>
          <span style={{position: 'relative', zIndex: 1, color: '#fff', fontSize: '0.95rem'}}>
            {item.title}
          </span>
        </Link>
      ))}
    </div>
  );
};
