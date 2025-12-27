import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import styles from '../styles/NotFound.module.css';

const NotFound = () => {
    return (
        <div className={styles.container}>
            <Motion.div 
                className={styles.content}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className={styles.errorCode}>404</div>
                <h1 className={styles.title}>Lost in the Blockchain</h1>
                <p className={styles.message}>
                    The block you are looking for has not been mined yet, 
                    or it may have been orphaned from the main chain.
                </p>
                
                <div className={styles.actions}>
                    <Link to="/" className={styles.primaryBtn}>
                        <Home size={18} /> Return Home
                    </Link>
                    <button className={styles.secondaryBtn} onClick={() => window.history.back()}>
                        <Compass size={18} /> Go Back
                    </button>
                </div>
            </Motion.div>

            {/* Background Animation Elements */}
            <div className={styles.background}>
                <div className={styles.orb} />
                <div className={styles.grid} />
            </div>
        </div>
    );
};

export default NotFound;
