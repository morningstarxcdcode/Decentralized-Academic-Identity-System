import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { User, Mail, Globe, MapPin, Save, ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import SpotlightCard from '../components/ui/SpotlightCard';
import styles from '../styles/EditProfile.module.css';

const EditProfile = () => {
    const navigate = useNavigate();
    const { user, profile, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
    const { demoRole, walletAddress } = useBlockchain();
    
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        website: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load profile data
    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                bio: profile.bio || '',
                location: profile.location || '',
                website: profile.website || '',
                email: profile.email || user?.email || ''
            });
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.displayName || '',
                email: user.email || ''
            }));
        }
    }, [profile, user]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated && !demoRole) {
            navigate('/');
        }
    }, [authLoading, isAuthenticated, demoRole, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return;
        }

        setIsSaving(true);
        
        try {
            if (demoRole) {
                // Demo mode - just show success
                await new Promise(r => setTimeout(r, 500));
                setSuccess('Profile updated (Demo Mode)');
            } else if (updateProfile) {
                await updateProfile({
                    displayName: formData.displayName,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website
                });
                setSuccess('Profile updated successfully!');
            }
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={`container ${styles.page}`}>
            <Link to="/student" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h1>Edit Profile</h1>
                    <p>Update your public decentralized identity information.</p>
                    {demoRole && (
                        <span className={styles.demoBadge}>Demo Mode</span>
                    )}
                </div>

                <SpotlightCard className={styles.formCard}>
                    <form onSubmit={handleSave}>
                        {/* Avatar Section */}
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarPlaceholder}>
                                <User size={48} />
                            </div>
                            <button type="button" className={styles.changePhotoBtn}>
                                <Camera size={16} /> Change Photo
                            </button>
                        </div>

                        {error && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {success && (
                            <div className={styles.successMsg}>
                                {success}
                            </div>
                        )}

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label><User size={14} /> Display Name</label>
                                <input 
                                    type="text" 
                                    name="displayName" 
                                    value={formData.displayName} 
                                    onChange={handleChange}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label><MapPin size={14} /> Location</label>
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleChange}
                                    placeholder="City, Country"
                                />
                            </div>

                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                                <label>Bio</label>
                                <textarea 
                                    name="bio" 
                                    rows="4" 
                                    value={formData.bio} 
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label><Globe size={14} /> Website</label>
                                <input 
                                    type="url" 
                                    name="website" 
                                    value={formData.website} 
                                    onChange={handleChange}
                                    placeholder="https://yoursite.com"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label><Mail size={14} /> Email (Read-only)</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    disabled
                                    className={styles.disabledInput}
                                />
                            </div>
                        </div>

                        {walletAddress && (
                            <div className={styles.walletInfo}>
                                <span>Connected Wallet:</span>
                                <code>{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</code>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button 
                                type="button" 
                                className={styles.cancelBtn}
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </SpotlightCard>
            </div>
        </div>
    );
};

export default EditProfile;
