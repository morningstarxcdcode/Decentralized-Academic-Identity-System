import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Building2, Briefcase, Shield, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './AuthModal.module.css';

const ROLES = [
  { id: 'student', label: 'Student', icon: User, description: 'View and share your credentials' },
  { id: 'university', label: 'University', icon: Building2, description: 'Issue academic credentials' },
  { id: 'employer', label: 'Employer', icon: Briefcase, description: 'Verify credentials' },
  { id: 'government', label: 'Government', icon: Shield, description: 'Authorize institutions' },
  { id: 'admin', label: 'Admin', icon: UserCog, description: 'System administration' }
];

const AuthModal = ({ isOpen, onClose }) => {
  const auth = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your name');
        }
        await auth.signUp(email, password, displayName, selectedRole);
      } else {
        await auth.signIn(email, password);
      }
      // Reset form and close
      setEmail('');
      setPassword('');
      setDisplayName('');
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      // Parse Firebase error messages
      let errorMsg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please sign in.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      }
      setLocalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    setIsSubmitting(true);
    try {
      await auth.signInWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google auth error:', err);
      setLocalError(err.message || 'Google sign-in failed. Please try email/password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setLocalError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={20} />
          </button>

          <div className={styles.header}>
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{mode === 'login' ? 'Sign in to access your credentials' : 'Join the decentralized credential network'}</p>
          </div>

          {localError && (
            <div className={styles.error}>
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {mode === 'signup' && (
              <div className={styles.inputGroup}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>

            {mode === 'signup' && (
              <div className={styles.roleSection}>
                <label>Select your role:</label>
                <div className={styles.roleGrid}>
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        className={`${styles.roleCard} ${selectedRole === role.id ? styles.selected : ''}`}
                        onClick={() => setSelectedRole(role.id)}
                        disabled={isSubmitting}
                      >
                        <Icon size={20} />
                        <span>{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button 
            className={styles.googleBtn} 
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className={styles.switchMode}>
            {mode === 'login' ? (
              <>Don&apos;t have an account? <button type="button" onClick={switchMode}>Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={switchMode}>Sign in</button></>
            )}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
