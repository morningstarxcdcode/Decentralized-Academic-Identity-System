import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}) => {
  const [widthPercentage, setWidthPercentage] = useState(0);
  const cardRef = useRef(null);
  const [left, setLeft] = useState(0);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
        const { left } = cardRef.current.getBoundingClientRect();
        setLeft(left);
    }
  }, []);

  const handleMouseMove = (e) => {
    const { clientX } = e;
    const relativeX = clientX - left;
    const width = cardRef.current.offsetWidth;
    const percentage = (relativeX / width) * 100;
    setWidthPercentage(percentage);
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
    setWidthPercentage(0);
  };
  const handleMouseEnter = () => {
    setIsMouseOver(true);
  };
  // Clamp widthPercentage between 0 and 100
  const widthConstraint = Math.min(Math.max(widthPercentage, 0), 100);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      className={`bg-[#1d1c20] border border-white/[0.08] w-full rounded-lg p-8 relative overflow-hidden ${className}`}
      style={{
          background: '#1d1c20',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden'
      }}
    >
      {children}
      <div className="h-40 flex items-center overflow-hidden" style={{height: '160px', display: 'flex', alignItems: 'center', overflow: 'hidden'}}>
        <motion.div
          style={{
            width: "100%",
          }}
          animate={
            isMouseOver
              ? {
                  opacity: widthConstraint > 0 ? 1 : 0,
                  clipPath: `inset(0 ${100 - widthConstraint}% 0 0)`,
                }
              : {
                  clipPath: `inset(0 ${100 - widthConstraint}% 0 0)`,
                }
          }
          transition={{ duration: 0 }}
          className="absolute bg-[#1d1c20] z-20 will-change-transform"
        >
          <motion.div 
             className="text-base sm:text-[3rem] py-10 font-bold text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300"
             style={{
                 fontSize: '3rem',
                 fontWeight: 'bold',
                 color: '#fff',
                 whiteSpace: 'nowrap'
             }}
          >
            {revealText}
          </motion.div>
        </motion.div>
        <div 
            className="text-base sm:text-[3rem] py-10 font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300 bg-opacity-20 text-[#a9a9a9]"
            style={{
                 fontSize: '3rem',
                 fontWeight: 'bold',
                 color: '#444',
                 opacity: 0.5,
                 whiteSpace: 'nowrap'
             }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export const TextRevealCardTitle = ({ children, className }) => {
  return (
    <h2 className={`text-white text-lg mb-2 ${className}`} style={{color: '#fff', fontSize: '1.2rem', marginBottom: '8px'}}>
      {children}
    </h2>
  );
};

export const TextRevealCardDescription = ({ children, className }) => {
  return (
    <p className={`text-[#a9a9a9] text-sm ${className}`} style={{color: '#a9a9a9', fontSize: '0.9rem'}}>
      {children}
    </p>
  );
};
