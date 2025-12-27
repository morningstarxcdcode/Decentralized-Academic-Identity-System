import React from 'react';
import { motion as Motion } from 'framer-motion';

const PageWrapper = ({ children }) => {
    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            {children}
        </Motion.div>
    );
};

export default PageWrapper;
