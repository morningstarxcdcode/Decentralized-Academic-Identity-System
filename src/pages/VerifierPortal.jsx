import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Search, Loader, CheckCircle, AlertCircle, Camera, Download, FileText, User, Building, Calendar, ShieldCheck, QrCode, FileUp } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import VerificationModal from '../components/VerificationModal';
import styles from '../styles/VerifierPortal.module.css';

const VerifierPortal = () => {
    const { verifyCredential, addNotification } = useBlockchain();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);

        // Lookup credential
        const res = await verifyCredential(query);
        setLoading(false);
        setResult(res);
        if (res.valid) {
            setIsModalOpen(true);
            const studentName = res.data?.studentName || res.record?.studentName || 'Unknown';
            addNotification('Verification Success', `Credential for ${studentName} verified.`, 'success');
        } else {
            addNotification('Verification Failed', res.message || 'The provided credential could not be verified.', 'warning');
        }
    };

    return (
        <div className={`container ${styles.verifier}`}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.employerLogo}>
                        <Building size={24} />
                    </div>
                    <span>Employer Dashboard</span>
                </div>
                <div className={styles.network}>
                    Network: <span className={styles.networkHighlight}>Polygon</span> Mainnet
                </div>
                <div className={styles.logout}>Logout |</div>
            </header>

            <div className={styles.formWrapper}>
                <div className={styles.profileInfo}>
                    <div className={styles.orgSymbol}>AC</div>
                    <p className={styles.orgName}>Acme Corp Recruiting</p>
                </div>

                <div className={styles.sectionTitle}>Verify Credentials</div>

                <form className={styles.verificationForm} onSubmit={handleVerify}>
                    <div className={styles.inputGroup}>
                        <input 
                            type="text" 
                            placeholder="Enter Student DID or Credential ID"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className={styles.verifyBtn} onClick={handleVerify}>Verify</button>
                    </div>

                    <div className={styles.divider}>OR</div>

                    <div className={styles.fileSelect}>
                        <span className={styles.fileLabel}>Upload VC JSON / PDF</span>
                        <div className={styles.uploadBox}>
                            <FileUp size={24} />
                            <span>Drag and drop or click to upload</span>
                        </div>
                    </div>

                    <div className={styles.divider}>OR</div>

                    <div className={styles.qrScan}>
                        <QrCode size={20} />
                        <span>Scan Student QR Code</span>
                    </div>
                </form>

                {/* Progress Animation */}
                <AnimatePresence>
                    {loading && (
                        <Motion.div 
                            className={styles.progress}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Loader className="spin" size={20} />
                            <span>Progress Spinner while checking on-chain data</span>
                        </Motion.div>
                    )}
                </AnimatePresence>

                {/* Verification Result (Error only, success shows modal) */}
                <AnimatePresence>
                    {result && !result.valid && (
                        <Motion.div 
                            className={`${styles.result} ${styles.invalid}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className={styles.resultHeader}>
                                <AlertCircle size={24} /> 
                                <span>Verification Failed</span>
                            </div>

                            <div className={styles.errorContainer}>
                                <p className={styles.reason}>{result.message}</p>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>

                <div className={styles.footerHints}>
                    <p>Bulk verification API access: <span className={styles.hintAction}>Contact Support</span></p>
                </div>
            </div>

            <VerificationModal 
                isOpen={isModalOpen} 
                result={result} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default VerifierPortal;
