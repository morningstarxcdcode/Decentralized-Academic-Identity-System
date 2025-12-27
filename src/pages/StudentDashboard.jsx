import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Share2, X, ExternalLink, Search, UserCheck, CheckCircle2, Shield, LogOut, Wallet, AlertTriangle, GraduationCap } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useAuth } from '../contexts/AuthContext';
import TiltCard from '../components/ui/TiltCard';
import SheerIDVerification from '../components/SheerIDVerification';
import styles from '../styles/StudentDashboard.module.css';

const StudentDashboard = () => {
    const { account, role, connectWallet, disconnectWallet, getMyCredentials, demoRole, isDemoMode, getWalletBalance, isWalletInstalled } = useBlockchain();
    const auth = useAuth();
    const [selectedCred, setSelectedCred] = useState(null);
    const [balance, setBalance] = useState('0');
    const [connectingReal, setConnectingReal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const isStudent = role === 'student';
    const displayName = auth?.profile?.displayName || 'Student';
    const displayAccount = account || 'Not connected';
    const isVerified = auth?.isStudentVerified || false;
    const currentVerification = auth?.verification || null;

    useEffect(() => {
        const fetchBalance = async () => {
            if (account && !demoRole) {
                const bal = await getWalletBalance();
                setBalance(bal);
            }
        };
        fetchBalance();
    }, [account, demoRole, getWalletBalance]);

    const handleDemoLogin = async () => {
        try {
            await connectWallet('student');
        } catch (err) {
            console.error('Demo login failed:', err);
        }
    };

    const handleRealWalletConnect = async () => {
        setConnectingReal(true);
        try {
            await connectWallet(); // No role = real wallet
        } catch (err) {
            console.error('Wallet connection failed:', err);
        } finally {
            setConnectingReal(false);
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        if (auth?.signOut) {
            auth.signOut();
        }
    };

    const handleVerificationComplete = async (verificationData) => {
        if (auth?.saveStudentVerification) {
            try {
                await auth.saveStudentVerification(verificationData);
            } catch (err) {
                console.error('Failed to save verification:', err);
            }
        }
    };

    if (!isStudent) {
        return (
            <div className={styles.accessPage}>
                <div className={styles.accessCard}>
                    <div className={styles.accessIcon}>
                        <UserCheck size={48} />
                    </div>
                    <h2>Access Your Digital Wallet</h2>
                    <p>Connect your MetaMask wallet to view and manage your academic credentials on Polygon.</p>
                    
                    {isWalletInstalled() && (
                        <button 
                            onClick={handleRealWalletConnect}
                            className={styles.connectBtn}
                            disabled={connectingReal}
                            style={{ background: '#8b5cf6' }}
                        >
                            <Wallet size={18} style={{ marginRight: 8 }} />
                            {connectingReal ? 'Connecting...' : 'Connect MetaMask'}
                        </button>
                    )}
                    
                    <div style={{ margin: '16px 0', color: '#666' }}>or</div>
                    
                    <button 
                        onClick={handleDemoLogin}
                        className={styles.connectBtn}
                        style={{ background: '#374151' }}
                    >
                        Try Demo Mode
                    </button>
                    <p className={styles.altText}>
                        Demo mode lets you explore without a wallet. Real credentials require MetaMask.
                    </p>
                </div>
            </div>
        );
    }

    const credentials = getMyCredentials();

    return (
        <div className={styles.dashboard}>
            <div className="container">
                {/* Verification Banner - Show if not verified */}
                {!isVerified && (
                    <div className={styles.verificationBanner}>
                        <div className={styles.bannerContent}>
                            <AlertTriangle size={20} />
                            <div>
                                <strong>Student Verification Required</strong>
                                <p>Verify your student status to receive credentials from institutions.</p>
                            </div>
                        </div>
                        <button 
                            className={styles.verifyNowBtn}
                            onClick={() => setShowVerificationModal(true)}
                        >
                            <GraduationCap size={16} />
                            Verify Now
                        </button>
                    </div>
                )}

                {/* Wallet Header */}
                <div className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar}>
                            <UserCheck size={32} />
                        </div>
                        <div className={styles.profileInfo}>
                            <h1>
                                {displayName}
                                {isVerified && (
                                    <span className={styles.verifiedBadgeSmall} title="Verified Student">
                                        <CheckCircle2 size={18} />
                                    </span>
                                )}
                            </h1>
                            <p className={styles.did}>
                                {typeof displayAccount === 'string' ? displayAccount : 'N/A'}
                            </p>
                            {demoRole && <span className={styles.demoBadge}>Demo Mode</span>}
                            {isVerified && currentVerification?.organization?.name && (
                                <span className={styles.institutionBadge}>
                                    <GraduationCap size={12} />
                                    {currentVerification.organization.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.topActions}>
                        <div className={styles.balanceBox}>
                            <span className={styles.label}>Balance</span>
                            <span className={styles.value}>{parseFloat(balance).toFixed(4)} MATIC</span>
                        </div>
                        {isDemoMode() && <span className={styles.demoBadge}>Demo Mode</span>}
                        {isVerified ? (
                            <button 
                                className={styles.verifiedBtn}
                                onClick={() => setShowVerificationModal(true)}
                            >
                                <CheckCircle2 size={16} /> Verified Student
                            </button>
                        ) : (
                            <button 
                                className={styles.verifyBtn}
                                onClick={() => setShowVerificationModal(true)}
                            >
                                <Shield size={16} /> Verify Status
                            </button>
                        )}
                        <Link to={`/profile/${account || 'me'}`} className={styles.shareProfileBtn}>
                            <Share2 size={16} /> Public Profile
                        </Link>
                        <button className={styles.disconnectBtn} onClick={handleDisconnect}>
                            <LogOut size={16} /> Disconnect
                        </button>
                    </div>
                </div>

                {/* Dashboard Nav */}
                <nav className={styles.dashboardNav}>
                    <button className={styles.activeTab}>Dashboard</button>
                    <button className={styles.navTab} onClick={() => document.getElementById('credentials-section')?.scrollIntoView({ behavior: 'smooth' })}>Credentials</button>
                    <Link to={`/profile/${account || 'me'}`} className={styles.navTab}>Profile</Link>
                    <Link to="/profile/edit" className={styles.navTab}>Settings</Link>
                </nav>

                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{credentials.length}</span>
                        <span className={styles.statLabel}>Total Credentials</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{credentials.filter(c => c.isValid).length}</span>
                        <span className={styles.statLabel}>Verified</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>0</span>
                        <span className={styles.statLabel}>Shared</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className={styles.toolbar} id="credentials-section">
                    <h2 className={styles.sectionTitle}>My Credentials</h2>
                    <div className={styles.toolbarActions}>
                        <div className={styles.searchBox}>
                            <Search size={18} />
                            <input type="text" placeholder="Search credentials..." />
                        </div>
                        <select className={styles.select}>
                            <option>All Types</option>
                            <option>Degree</option>
                            <option>Certificate</option>
                        </select>
                    </div>
                </div>

                {/* Credentials Grid */}
                <div className={styles.grid}>
                    {credentials.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Award size={64} />
                            <h3>No Credentials Yet</h3>
                            <p>Your academic credentials will appear here once issued by authorized institutions.</p>
                        </div>
                    ) : credentials.map((cred, index) => (
                        <TiltCard 
                            key={cred.hash}
                            className={styles.card}
                        >
                            <Motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedCred(cred)}
                                className={styles.cardInner}
                            >
                                <div className={styles.cardHeader}>
                                    <Award className={styles.cardIcon} size={24} />
                                    <span className={cred.isValid ? styles.statusValid : styles.statusRevoked}>
                                        {cred.isValid ? 'Verified' : 'Revoked'}
                                    </span>
                                </div>
                                <h4>{cred.courseName || 'Academic Credential'}</h4>
                                <p className={styles.issuer}>Issuer: {cred.issuer?.slice(0, 12)}...</p>
                                <div className={styles.cardFooter}>
                                    <span>{new Date(cred.timestamp).toLocaleDateString()}</span>
                                    <Link to={`/credential/${cred.hash}`} className={styles.viewBtn}>
                                        View Details
                                    </Link>
                                </div>
                            </Motion.div>
                        </TiltCard>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedCred && (
                    <Modal cred={selectedCred} onClose={() => setSelectedCred(null)} />
                )}
            </AnimatePresence>

            {/* SheerID Verification Modal */}
            <SheerIDVerification
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onVerified={handleVerificationComplete}
                currentVerification={currentVerification}
                userType="student"
            />
        </div>
    );
};

const Modal = ({ cred, onClose }) => {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <Motion.div 
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
                
                <div className={styles.modalHeader}>
                    <h2>{cred.courseName || 'Academic Credential'}</h2>
                    <span className={styles.verifiedBadge}>
                        <Award size={16} /> Blockchain Verified
                    </span>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.infoRow}>
                        <label>Issued To</label>
                        <p>{cred.studentDID}</p>
                    </div>
                    <div className={styles.infoRow}>
                        <label>Issuer Address</label>
                        <p>{cred.issuer}</p>
                    </div>
                    <div className={styles.infoRow}>
                        <label>Credential Hash</label>
                        <p className={styles.mono}>{cred.hash}</p>
                    </div>
                    <div className={styles.infoRow}>
                        <label>IPFS CID</label>
                        <a 
                            href={`https://gateway.pinata.cloud/ipfs/${cred.ipfsCID}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className={styles.ipfsLink}
                        >
                            {cred.ipfsCID} <ExternalLink size={14} />
                        </a>
                    </div>
                    
                    <div className={styles.qrSection}>
                        <p>Scan to Verify</p>
                        <div className={styles.qrWrapper}>
                            <QRCodeSVG value={cred.hash} size={120} />
                        </div>
                        <div className={styles.statusGroup}>
                            <span className={styles.tag}><CheckCircle2 size={14} /> Authentic</span>
                            <span className={styles.tag}><Shield size={14} /> Signed</span>
                        </div>
                    </div>
                </div>

                <button className={styles.shareBtn}>
                    <Share2 size={18} /> Share Credential
                </button>
            </Motion.div>
        </div>
    );
};

export default StudentDashboard;
