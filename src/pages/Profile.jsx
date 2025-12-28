import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Award, Shield, User, MapPin, Link as LinkIcon, Building, Calendar, CheckCircle, Settings, GraduationCap, ExternalLink } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Profile.module.css';

const Profile = () => {
    const { address } = useParams();
    const { getMyCredentials, getIssuedCredentials, getAllIssuers, walletAddress, demoRole } = useBlockchain();
    const { user, profile, isAuthenticated, isStudentVerified, verification } = useAuth();
    const [loading, setLoading] = useState(true);

    // Determine if viewing own profile
    const isOwnProfile = !address || address === 'me' || address === walletAddress || address === profile?.uid;

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [address]);

    // Get credentials for this address
    const myCredentials = getMyCredentials ? getMyCredentials() : [];
    const issuedCredentials = getIssuedCredentials ? getIssuedCredentials() : [];
    const allCredentials = isOwnProfile 
        ? [...myCredentials, ...issuedCredentials]
        : [...myCredentials, ...issuedCredentials].filter(c => c.studentDID === address);
    const issuers = getAllIssuers ? getAllIssuers() : {};

    // Profile data
    const displayName = profile?.displayName || user?.displayName || 'Anonymous User';
    const displayAddress = address || walletAddress || profile?.uid || 'Not connected';
    const bio = profile?.bio || 'Blockchain credential holder';
    const location = profile?.location || 'Unknown';
    const website = profile?.website || '';

    if (loading) return <div className={styles.loading}>Loading Identity...</div>;

    return (
        <div className={`container ${styles.profilePage}`}>
            {/* Ambient Background */}
            <div className={styles.ambientGlow} />

            <Motion.div 
                className={styles.profileCard}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.profileHeader}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarLarge}>
                            <User size={64} />
                            {(isAuthenticated || demoRole) && (
                                <div className={styles.verifiedBadge} title="Verified Account">
                                    <CheckCircle size={16} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.identitySection}>
                        <div className={styles.nameRow}>
                            <h1>{displayName}</h1>
                            {isStudentVerified && isOwnProfile && (
                                <span className={styles.studentBadge} title="Verified Student">
                                    <GraduationCap size={16} /> Student
                                </span>
                            )}
                        </div>
                        
                        <div className={styles.addressRow}>
                            <span className={styles.address}>
                                {typeof displayAddress === 'string' && displayAddress.length > 20 
                                    ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-8)}`
                                    : displayAddress}
                            </span>
                        </div>

                        <p className={styles.bio}>{bio}</p>

                        <div className={styles.metaInfo}>
                            {location && (
                                <div className={styles.metaItem}>
                                    <MapPin size={14} /> {location}
                                </div>
                            )}
                            {website && (
                                <a href={website} target="_blank" rel="noreferrer" className={styles.metaLink}>
                                    <LinkIcon size={14} /> Portfolio <ExternalLink size={10} style={{marginLeft: 4}}/>
                                </a>
                            )}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className={styles.actionSection}>
                            <Link to="/profile/edit" className={styles.editBtn}>
                                <Settings size={16} /> Edit Profile
                            </Link>
                        </div>
                    )}
                </div>

                {isStudentVerified && verification?.organization?.name && isOwnProfile && (
                    <div className={styles.institutionBanner}>
                        <Building size={16} />
                        <span>Verified at <strong>{verification.organization.name}</strong></span>
                        {verification.demoMode && <span className={styles.demoTag}>Demo Mode</span>}
                    </div>
                )}
            </Motion.div>

            <div className={styles.credentialsSection}>
                <div className={styles.sectionHeader}>
                    <h2>Verified Credentials</h2>
                    <span className={styles.countBadge}>{allCredentials.length}</span>
                </div>
                
                {allCredentials.length === 0 ? (
                    <Motion.div 
                        className={styles.emptyState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.emptyIcon}>
                            <Award size={48} />
                        </div>
                        <h3>No Credentials Yet</h3>
                        <p>Credentials issued to this account by university admins will appear here securely.</p>
                    </Motion.div>
                ) : (
                    <div className={styles.grid}>
                        {allCredentials.map((cred, index) => (
                            <Motion.div 
                                key={cred.hash || index}
                                className={styles.credCard}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                            >
                                <div className={styles.credHeader}>
                                    <div className={styles.credIcon}>
                                        <Award size={24} />
                                    </div>
                                    <span className={styles.credStatus}>
                                        <Shield size={12} /> Verified
                                    </span>
                                </div>
                                
                                <h3 className={styles.credTitle}>{cred.courseName || 'Academic Credential'}</h3>
                                
                                <div className={styles.credIssuer}>
                                    <Building size={14} />
                                    <span>{issuers[cred.issuer]?.name || 'Authorized Issuer'}</span>
                                </div>

                                <div className={styles.credFooter}>
                                    <span className={styles.credDate}>
                                        <Calendar size={12} /> {new Date(cred.timestamp).getFullYear()}
                                    </span>
                                    {cred.demoMode && <span className={styles.demoCred}>Demo</span>}
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.verifierCta}>
                <div className={styles.ctaContent}>
                    <h3>Employer Verification</h3>
                    <p>Verify the authenticity of these credentials instantly on the blockchain.</p>
                </div>
                <Link to="/verifier" className={styles.verifyLink}>Go to Verifier Portal</Link>
            </div>
        </div>
    );
};

export default Profile;
