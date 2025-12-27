import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Award, Shield, User, MapPin, Link as LinkIcon, Building, Calendar, CheckCircle, Settings, GraduationCap } from 'lucide-react';
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
            <Motion.div 
                className={styles.header}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.avatarLarge}>
                    <User size={64} />
                    {(isAuthenticated || demoRole) && (
                        <div className={styles.verifiedBadge}><CheckCircle size={16} /></div>
                    )}
                </div>
                <h1>
                    {displayName}
                    {isStudentVerified && isOwnProfile && (
                        <span className={styles.studentVerifiedBadge} title="Verified Student">
                            <GraduationCap size={18} />
                            Verified Student
                        </span>
                    )}
                </h1>
                <p className={styles.address}>
                    {typeof displayAddress === 'string' && displayAddress.length > 20 
                        ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-8)}`
                        : displayAddress}
                </p>
                <p className={styles.bio}>{bio}</p>
                
                {isStudentVerified && verification?.organization?.name && isOwnProfile && (
                    <div className={styles.institutionInfo}>
                        <Building size={14} />
                        <span>{verification.organization.name}</span>
                        {verification.demoMode && <span className={styles.demoTag}>Demo</span>}
                    </div>
                )}
                
                <div className={styles.meta}>
                    <span><MapPin size={14} /> {location}</span>
                    {website && (
                        <a href={website} target="_blank" rel="noreferrer">
                            <LinkIcon size={14} /> Portfolio
                        </a>
                    )}
                </div>

                {isOwnProfile && (
                    <Link to="/profile/edit" className={styles.editBtn}>
                        <Settings size={16} /> Edit Profile
                    </Link>
                )}
            </Motion.div>

            <div className={styles.credentialsSection}>
                <h2>Verified Credentials <span className={styles.count}>{allCredentials.length}</span></h2>
                
                {allCredentials.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Award size={48} />
                        <p>No credentials yet</p>
                        {isOwnProfile && (
                            <span>Credentials issued to you will appear here</span>
                        )}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {allCredentials.map((cred, index) => (
                            <Motion.div 
                                key={cred.hash || index}
                                className={styles.credCard}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className={styles.credIcon}>
                                    <Award size={32} />
                                </div>
                                <div className={styles.credDetails}>
                                    <h3>{cred.courseName || 'Academic Credential'}</h3>
                                    <p className={styles.issuerName}>
                                        <Building size={14} /> {issuers[cred.issuer]?.name || 'Authorized Issuer'}
                                    </p>
                                    <div className={styles.footer}>
                                        <span><Calendar size={14} /> {new Date(cred.timestamp).getFullYear()}</span>
                                        <span className={styles.status}>
                                            <Shield size={12} /> 
                                            {cred.demoMode ? 'Demo' : 'On-Chain'}
                                        </span>
                                    </div>
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.cta}>
                <p>Are you an employer? Verify these details instantly.</p>
                <Link to="/verifier" className={styles.verifyLink}>Go to Verifier Portal</Link>
            </div>
        </div>
    );
};

export default Profile;
