import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion as m } from 'framer-motion';
import { Award, CheckCircle2, Share2, Download, Shield, ArrowLeft, Calendar, Building, Hash, AlertCircle, ExternalLink } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import TiltCard from '../components/ui/TiltCard';
import SpotlightCard from '../components/ui/SpotlightCard';
import styles from '../styles/CredentialDetail.module.css';

const CredentialDetail = () => {
    const { id } = useParams();
    const { verifyCredential, loading: blockchainLoading } = useBlockchain();
    const [credential, setCredential] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCredential = async () => {
            if (!id) {
                setError('No credential ID provided');
                setLoading(false);
                return;
            }

            try {
                // Try to verify/fetch the credential
                if (verifyCredential) {
                    const result = await verifyCredential(id);
                    setVerificationResult(result);
                    
                    if (result.valid && result.record) {
                        setCredential({
                            id: id,
                            title: result.record.courseName || result.data?.credential?.title || 'Academic Credential',
                            studentName: result.record.studentName || result.data?.studentName || 'Student',
                            issuer: result.issuerName || result.record.issuer || 'Authorized Issuer',
                            date: result.record.timestamp 
                                ? new Date(result.record.timestamp).toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0],
                            skills: result.data?.credential?.skills || ['Verified Credential'],
                            hash: result.record.hash || id,
                            ipfsCID: result.record.ipfsCID,
                            ipfsUrl: result.ipfsUrl,
                            onChain: result.onChain,
                            demoMode: result.demoMode,
                            description: result.data?.credential?.description || 'Verified academic credential issued on the blockchain.'
                        });
                    } else {
                        // Credential not found - show demo data
                        setCredential({
                            id: id,
                            title: "Academic Credential",
                            studentName: "Credential Holder",
                            issuer: "Unknown Issuer",
                            date: new Date().toISOString().split('T')[0],
                            skills: [],
                            hash: id,
                            description: result.message || "This credential could not be verified."
                        });
                        setError(result.message || 'Credential not found');
                    }
                } else {
                    // No verify function - show placeholder
                    setCredential({
                        id: id,
                        title: "Academic Credential",
                        studentName: "Credential Holder",
                        issuer: "Issuer",
                        date: new Date().toISOString().split('T')[0],
                        skills: [],
                        hash: id,
                        description: "Connect wallet to verify this credential."
                    });
                }
            } catch (err) {
                console.error('Error loading credential:', err);
                setError(err.message || 'Failed to load credential');
            } finally {
                setLoading(false);
            }
        };

        loadCredential();
    }, [id, verifyCredential]);

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: credential?.title || 'Academic Credential',
                text: `Verify this credential: ${credential?.title}`,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    if (loading || blockchainLoading) {
        return <div className={styles.loading}>Loading Credential...</div>;
    }

    if (!credential) {
        return (
            <div className={`container ${styles.page}`}>
                <Link to="/student" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div className={styles.errorState}>
                    <AlertCircle size={48} />
                    <h2>Credential Not Found</h2>
                    <p>{error || 'The requested credential could not be found.'}</p>
                    <Link to="/verifier" className={styles.verifyLink}>
                        Try Verifier Portal
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`container ${styles.page}`}>
            <Link to="/student" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className={styles.content}>
                {/* Left Side: The Certificate */}
                <m.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className={styles.certContainer}
                >
                    <TiltCard className={styles.certificate}>
                        <div className={styles.certInner}>
                            <div className={styles.certHeader}>
                                <div className={styles.logoPlaceholder}>
                                    <Building size={32} />
                                </div>
                                <div className={styles.certIssues}>
                                    <span className={styles.label}>Issued By</span>
                                    <h3>{credential.issuer}</h3>
                                </div>
                            </div>
                            
                            <div className={styles.certBody}>
                                <span className={styles.certSubtitle}>This certifies that</span>
                                <h1>{credential.studentName}</h1>
                                <span className={styles.certSubtitle}>has successfully completed the requirements for</span>
                                <h2 className={styles.courseTitle}>{credential.title}</h2>
                                <p className={styles.description}>{credential.description}</p>
                            </div>

                            <div className={styles.certFooter}>
                                <div className={styles.issueDate}>
                                    <Calendar size={14} /> Issued: {credential.date}
                                </div>
                                <div className={styles.signature}>
                                    <span className={styles.sigText}>Authorized Signature</span>
                                </div>
                            </div>
                            
                            <div className={styles.seal}>
                                <Award size={40} />
                            </div>
                        </div>
                    </TiltCard>
                    
                    <div className={styles.certActions}>
                        <button className={styles.actionBtn} onClick={handleShare}>
                            <Share2 size={16} /> Share
                        </button>
                        <button className={styles.actionBtn} disabled>
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </m.div>

                {/* Right Side: Metadata & Verification */}
                <div className={styles.metaContainer}>
                    <SpotlightCard className={styles.statusCard}>
                        <div className={styles.verifiedHeader}>
                            <Shield size={24} className={verificationResult?.valid ? styles.verifiedIcon : styles.unverifiedIcon} />
                            <div>
                                <h3>{verificationResult?.valid ? 'Verified' : 'Unverified'}</h3>
                                <span className={styles.network}>
                                    {credential.onChain ? 'Polygon Amoy Testnet' : 
                                     credential.demoMode ? 'Demo Mode' : 'Pending Verification'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.hashBox}>
                            <Hash size={14} />
                            <span>{credential.hash.length > 20 
                                ? `${credential.hash.slice(0, 10)}...${credential.hash.slice(-10)}`
                                : credential.hash}
                            </span>
                        </div>
                        {credential.ipfsUrl && (
                            <a 
                                href={credential.ipfsUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className={styles.ipfsLink}
                            >
                                <ExternalLink size={14} /> View on IPFS
                            </a>
                        )}
                        <Link to="/verifier" className={styles.verifyLink}>
                            Verify Independently <CheckCircle2 size={14} />
                        </Link>
                    </SpotlightCard>

                    {credential.skills && credential.skills.length > 0 && (
                        <SpotlightCard className={styles.skillsCard}>
                            <h3>Skills & Competencies</h3>
                            <div className={styles.tags}>
                                {credential.skills.map((skill, i) => (
                                    <span key={i} className={styles.tag}>{skill}</span>
                                ))}
                            </div>
                        </SpotlightCard>
                    )}

                    {error && (
                        <div className={styles.warningBox}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CredentialDetail;
