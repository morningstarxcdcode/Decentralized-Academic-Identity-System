import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}
      style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
      }}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4 ${className}`}
      onClick={onClick}
      style={{
          background: 'rgba(20,20,20,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
      }}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div style={{marginBottom: '10px', color: 'var(--color-primary)'}}>
            {icon}
        </div>
        <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2" style={{color: '#fff', fontSize: '1.1rem', fontWeight: 600}}>
          {title}
        </div>
        <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300" style={{color: '#aaa', fontSize: '0.9rem'}}>
          {description}
        </div>
      </div>
    </motion.div>
  );
};
