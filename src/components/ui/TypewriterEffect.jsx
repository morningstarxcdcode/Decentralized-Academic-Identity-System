import React from "react";
import { motion } from "framer-motion";

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}) => {
  // words is an array of objects: { text: "Hello", className: "text-blue-500" }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, display: 'none' },
    visible: { 
        opacity: 1, 
        display: 'inline-block',
        transition: { duration: 0.05 } 
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`text-base sm:text-xl md:text-3xl lg:text-5xl font-bold text-center ${className}`}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}
    >
        {words.map((word, idx) => (
            <div key={`word-${idx}`} className="inline-block">
                {word.text.split("").map((char, index) => (
                    <motion.span
                        key={`char-${index}`}
                        variants={childVariants}
                        className={word.className}
                        style={{ display: 'inline-block' }}
                    >
                        {char}
                    </motion.span>
                ))}
            </div>
        ))}
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
            }}
            className={`inline-block rounded-sm w-[4px] h-8 bg-blue-500 ${cursorClassName}`}
            style={{
                width: '4px',
                height: '1.2em',
                background: '#3b82f6',
                marginLeft: '2px',
                verticalAlign: 'bottom'
            }}
        />
    </motion.div>
  );
};

// Simple text generator for single string prop usage
export const TypewriterEffectSmooth = ({ words, className, cursorClassName }) => {
    // Similar implementation but with width animation
    // Simplified for now to reuse the reliable staggering
    return <TypewriterEffect words={words} className={className} cursorClassName={cursorClassName} />;
};
