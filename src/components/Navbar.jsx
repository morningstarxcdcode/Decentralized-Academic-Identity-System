import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Wallet, Shield, Menu, X, User, Bell, LogOut, Settings, ChevronDown, CheckCircle } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import AuthModal from './AuthModal';
import { HoverEffect } from './ui/HoverEffect';
import styles from './Navbar.module.css';

const Navbar = () => {
    const blockchain = useBlockchain();
    const auth = useAuth();
    
    const [isOpen, setIsOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Safe access to blockchain values
    const walletAddress = blockchain?.walletAddress;
    const notifications = blockchain?.notifications || [];
    const isWalletInstalled = blockchain?.isWalletInstalled;
    const demoRole = blockchain?.demoRole;
    
    // Safe access to auth values
    const user = auth?.user;
    const profile = auth?.profile;
    const isAuthenticated = auth?.isAuthenticated || false;
    const authLoading = auth?.loading || false;
    const isStudentVerified = auth?.isStudentVerified || false;

    // User is "logged in" if either Firebase authenticated OR in demo mode
    const isLoggedIn = isAuthenticated || !!demoRole;
    const role = demoRole || profile?.role || 'guest';

    const links = [
        { path: '/', label: 'Home' },
        { path: '/verifier', label: 'Verify Credential' },
    ];

    if (role === 'student' || role === 'guest') links.push({ path: '/student', label: 'Student' });
    if (role === 'university' || role === 'guest') links.push({ path: '/university', label: 'University' });
    if (role === 'government' || role === 'guest') links.push({ path: '/government', label: 'Government' });

    const handleConnectWallet = async () => {
        try {
            if (blockchain?.connectWallet) {
                await blockchain.connectWallet();
            }
        } catch (err) {
            console.error('Wallet connection failed:', err);
        }
    };

    const handleSignOut = async () => {
        try {
            if (auth?.signOut) {
                await auth.signOut();
            }
            if (blockchain?.disconnectWallet) {
                blockchain.disconnectWallet();
            }
            setIsProfileMenuOpen(false);
        } catch (err) {
            console.error('Sign out failed:', err);
        }
    };

    const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';
    const displayAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null;

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                <Link to="/" className={styles.logo}>
                    <Shield className={styles.logoIcon} />
                    <span>AcadChain</span>
                </Link>

                <div className={styles.desktopMenu}>
                    <HoverEffect 
                        items={links.map(link => ({
                            title: link.label,
                            link: link.path
                        }))}
                        className={styles.hoverMenu}
                    />
                </div>

                <div className={styles.actions}>
                    {isLoggedIn ? (
                        <div className={styles.userSection}>
                            {/* Demo Mode Badge */}
                            {demoRole && (
                                <div className={styles.demoBadge}>
                                    Demo: {demoRole}
                                </div>
                            )}
                            
                            {/* Wallet Connection */}
                            {!walletAddress && !demoRole && isWalletInstalled && isWalletInstalled() && (
                                <button className={styles.walletBtn} onClick={handleConnectWallet}>
                                    <Wallet size={16} />
                                    <span className={styles.walletText}>Connect Wallet</span>
                                </button>
                            )}
                            
                            {walletAddress && (
                                <div className={styles.walletBadge}>
                                    <Wallet size={14} />
                                    <span>{displayAddress}</span>
                                </div>
                            )}

                            {/* Profile Dropdown - only show for Firebase auth */}
                            {isAuthenticated ? (
                                <div className={styles.profileWrapper}>
                                    <button 
                                        className={styles.profileBtn}
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    >
                                        <div className={styles.avatar}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={styles.profileName}>{displayName}</span>
                                        <ChevronDown size={16} className={isProfileMenuOpen ? styles.rotated : ''} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileMenuOpen && (
                                            <Motion.div
                                                className={styles.profileMenu}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <div className={styles.profileHeader}>
                                                    <span className={styles.profileEmail}>{user?.email}</span>
                                                    <div className={styles.profileRoleRow}>
                                                        <span className={styles.profileRole}>{role}</span>
                                                        {isStudentVerified && (
                                                            <span className={styles.verifiedBadge} title="Verified Student">
                                                                <CheckCircle size={12} />
                                                                Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link 
                                                    to="/profile/edit" 
                                                    className={styles.menuItem}
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <Settings size={16} />
                                                    Settings
                                                </Link>
                                                <button className={styles.menuItem} onClick={handleSignOut}>
                                                    <LogOut size={16} />
                                                    Sign Out
                                                </button>
                                            </Motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                /* Demo mode - just show logout button */
                                <button className={styles.logoutBtn} onClick={handleSignOut}>
                                    <LogOut size={16} />
                                    <span className={styles.walletText}>Exit Demo</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button 
                            className={styles.connectBtn} 
                            onClick={() => setIsAuthModalOpen(true)}
                            disabled={authLoading}
                        >
                            <User size={16} />
                            Sign In
                        </button>
                    )}

                    <div className={styles.notifWrapper} onClick={() => setIsNotifOpen(true)}>
                        <Bell size={20} className={styles.notifIcon} />
                        {notifications.length > 0 && <span className={styles.notifBadge}>{notifications.length}</span>}
                    </div>
                    
                    <button className={styles.mobileToggle} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <Motion.div 
                        className={styles.mobileMenu}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {links.map(link => (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                className={styles.mobileLink}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {isLoggedIn && (
                            <button className={styles.mobileLink} onClick={handleSignOut}>
                                {demoRole ? 'Exit Demo' : 'Sign Out'}
                            </button>
                        )}
                    </Motion.div>
                )}
            </AnimatePresence>

            <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </nav>
    );
};

export default Navbar;
