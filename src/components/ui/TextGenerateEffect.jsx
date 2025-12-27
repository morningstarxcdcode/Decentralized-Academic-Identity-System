import React from 'react';
import { motion as m } from 'framer-motion';

const TextGenerateEffect = ({ words, className = "" }) => {
  const wordsArray = words.split(" ");

  const renderWords = () => {
    return (
      <m.div className={className}>
        {wordsArray.map((word, idx) => {
          return (
            <m.span
              key={word + idx}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{ display: "inline-block", marginRight: "8px" }}
            >
              {word}
            </m.span>
          );
        })}
      </m.div>
    );
  };

  return (
    <div style={{ display: "inline-block" }}>
      {renderWords()}
    </div>
  );
};

export default TextGenerateEffect;
