import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './KineticCube.module.css';

/**
 * KineticCube Component
 * 
 * A 3D animated cube that unfolds like a kinetic ring box.
 * Inspired by the Kinetacube mechanism where all 6 faces unfold 
 * outward simultaneously in a mesmerizing motion.
 * 
 * @param {React.ReactNode} children - Content to display when cube opens
 * @param {boolean} autoOpen - Whether to auto-open on mount
 * @param {number} delay - Delay before auto-opening (ms)
 * @param {boolean} interactive - Allow click to toggle
 */
const KineticCube = ({ 
    children, 
    autoOpen = true, 
    delay = 1500,
    interactive = true,
    size = 200 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const cubeRef = useRef(null);

    const handleOpen = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsOpen(true);
        
        // Show content after faces start opening
        setTimeout(() => {
            setShowContent(true);
        }, 800);
        
        setTimeout(() => {
            setIsAnimating(false);
        }, 2000);
    }, [isAnimating]);

    const handleClose = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setShowContent(false);
        
        setTimeout(() => {
            setIsOpen(false);
        }, 300);
        
        setTimeout(() => {
            setIsAnimating(false);
        }, 2000);
    }, [isAnimating]);

    useEffect(() => {
        if (autoOpen) {
            const timer = setTimeout(() => {
                handleOpen();
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [autoOpen, delay, handleOpen]);

    const handleClick = () => {
        if (!interactive) return;
        if (isOpen) {
            handleClose();
        } else {
            handleOpen();
        }
    };

    return (
        <div className={styles.kineticCubeWrapper}>
            <div 
                className={`${styles.scene} ${isOpen ? styles.sceneOpen : ''}`}
                style={{ 
                    '--cube-size': `${size}px`,
                    perspective: `${size * 4}px`
                }}
            >
                <div 
                    ref={cubeRef}
                    className={`${styles.cube} ${isOpen ? styles.cubeOpen : ''}`}
                    onClick={handleClick}
                >
                    {/* Front Face */}
                    <div className={`${styles.face} ${styles.front} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Back Face */}
                    <div className={`${styles.face} ${styles.back} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Face */}
                    <div className={`${styles.face} ${styles.right} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Left Face */}
                    <div className={`${styles.face} ${styles.left} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Top Face */}
                    <div className={`${styles.face} ${styles.top} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Face */}
                    <div className={`${styles.face} ${styles.bottom} ${isOpen ? styles.faceOpen : ''}`}>
                        <div className={styles.faceInner}>
                            <div className={styles.panelContent}>
                                <div className={`${styles.cornerBracket} ${styles.topLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.topRight}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.bottomRight}`}></div>
                                <div className={styles.screwHole}></div>
                            </div>
                        </div>
                    </div>

                    {/* Inner Core / Content Container */}
                    <div className={`${styles.innerCore} ${showContent ? styles.coreVisible : ''}`}>
                        <div className={styles.coreGlow}></div>
                    </div>
                </div>
            </div>

            {/* Content that appears when cube opens */}
            <div className={`${styles.contentWrapper} ${showContent ? styles.contentVisible : ''}`}>
                {children}
            </div>

            {/* Click hint */}
            {interactive && !isOpen && (
                <div className={styles.clickHint}>
                    <span>Click to reveal</span>
                </div>
            )}
        </div>
    );
};

export default KineticCube;
