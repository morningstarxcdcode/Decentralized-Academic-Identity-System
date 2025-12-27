import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import styles from './NotificationCenter.module.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { notifications } = useBlockchain();

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className={styles.success} size={18} />;
            case 'warning': return <AlertTriangle className={styles.warning} size={18} />;
            default: return <Info className={styles.info} size={18} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Motion.div 
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <Motion.div 
                        className={styles.drawer}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className={styles.header}>
                            <h3>Notifications</h3>
                            <button onClick={onClose} className={styles.closeBtn}><X /></button>
                        </div>

                        <div className={styles.content}>
                            {notifications.length === 0 ? (
                                <div className={styles.empty}>
                                    <Bell size={48} />
                                    <p>No new notifications</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className={styles.notificationItem}>
                                        <div className={styles.icon}>{getIcon(notif.type)}</div>
                                        <div className={styles.details}>
                                            <h4>{notif.title}</h4>
                                            <p>{notif.message}</p>
                                            <span className={styles.time}>
                                                <Clock size={12} />
                                                {new Date(notif.time).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationCenter;
