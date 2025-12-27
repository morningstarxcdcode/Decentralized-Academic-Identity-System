import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Shield, User, Calendar, Building, Download, ExternalLink } from 'lucide-react';
import styles from './VerificationModal.module.css';

const VerificationModal = ({ isOpen, result, onClose }) => {
    if (!result || !result.record) return null;

    // Get data from either result.data (IPFS) or result.record (cache)
    const data = result.data || result.record;
    const studentName = data?.studentName || result.record?.studentName || 'Unknown';
    const courseName = data?.credential?.title || data?.courseName || result.record?.courseName || 'Unknown';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.modalWrapper}>
                    <Motion.div 
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <Motion.div 
                        className={styles.card}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <button className={styles.closeBtn} onClick={onClose}><X /></button>
                        
                        <div className={styles.successHeader}>
                            <div className={styles.iconCircle}>
                                <CheckCircle size={48} className={styles.checkIcon} />
                            </div>
                            <h2>Verification Successful</h2>
                            <p className={styles.statusBadge}>
                                {result.onChain ? 'Verified on Blockchain' : 'Verified (Demo Mode)'}
                            </p>
                        </div>

                        <div className={styles.scannedData}>
                            <div className={styles.dataGroup}>
                                <label><User size={14} /> Graduate Name</label>
                                <p>{studentName}</p>
                            </div>
                            <div className={styles.dataGroup}>
                                <label><Building size={14} /> Issuing University</label>
                                <p>{result.issuerName || 'Unknown Issuer'}</p>
                            </div>
                            <div className={styles.dataGroup}>
                                <label><Shield size={14} /> Degree Type</label>
                                <p>{courseName}</p>
                            </div>
                            <div className={styles.dataGroup}>
                                <label><Calendar size={14} /> Issue Date</label>
                                <p>{result.record?.timestamp ? new Date(result.record.timestamp).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>

                        <div className={styles.blockchainInfo}>
                            <div className={styles.infoRow}>
                                <span>Certificate Hash:</span>
                                <code>{result.record?.hash?.slice(0, 16) || 'N/A'}...</code>
                            </div>
                            <div className={styles.infoRow}>
                                <span>IPFS CID:</span>
                                <code>{result.record?.ipfsCID?.slice(0, 16) || 'N/A'}...</code>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            {result.ipfsUrl && (
                                <a 
                                    href={result.ipfsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.secondaryBtn}
                                >
                                    <Download size={18} />
                                    View on IPFS
                                </a>
                            )}
                            <button className={styles.primaryBtn} onClick={onClose}>
                                <ExternalLink size={18} />
                                Done
                            </button>
                        </div>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default VerificationModal;
