import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, GraduationCap, X, ExternalLink } from 'lucide-react';
import { initSheerIDVerification, isVerificationValid } from '../services/sheeridService';
import styles from './SheerIDVerification.module.css';

const SheerIDVerification = ({ 
  isOpen, 
  onClose, 
  onVerified, 
  currentVerification = null,
  userType = 'student' // 'student' or 'faculty'
}) => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAlreadyVerified = isVerificationValid(currentVerification);

  const handleStartVerification = async () => {
    setVerifying(true);
    setError('');

    try {
      const result = await initSheerIDVerification({
        segment: userType,
        onSuccess: (response) => {
          console.log('Verification successful:', response);
        },
        onError: (err) => {
          console.error('Verification error:', err);
        }
      });

      setSuccess(true);
      
      // Call the callback with verification data
      if (onVerified) {
        onVerified(result);
      }

      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      if (err.message !== 'Verification cancelled') {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
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
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>

          {isAlreadyVerified ? (
            // Already verified state
            <div className={styles.verifiedState}>
              <div className={styles.verifiedIcon}>
                <CheckCircle size={48} />
              </div>
              <h2>Already Verified!</h2>
              <p>Your {userType} status has been verified.</p>
              
              <div className={styles.verificationDetails}>
                <div className={styles.detailRow}>
                  <span>Institution:</span>
                  <strong>{currentVerification.organization?.name || 'Verified Institution'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Verified:</span>
                  <strong>{new Date(currentVerification.verifiedAt).toLocaleDateString()}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Expires:</span>
                  <strong>{new Date(currentVerification.expiresAt).toLocaleDateString()}</strong>
                </div>
              </div>

              {currentVerification.demoMode && (
                <div className={styles.demoNotice}>
                  <AlertCircle size={14} />
                  Demo verification - not valid for production
                </div>
              )}

              <button className={styles.doneBtn} onClick={onClose}>
                Done
              </button>
            </div>
          ) : success ? (
            // Success state
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle size={64} />
              </div>
              <h2>Verification Complete!</h2>
              <p>Your {userType} status has been verified successfully.</p>
            </div>
          ) : (
            // Verification prompt
            <>
              <div className={styles.header}>
                <div className={styles.iconWrapper}>
                  <GraduationCap size={32} />
                </div>
                <h2>Verify Your {userType === 'student' ? 'Student' : 'Faculty'} Status</h2>
                <p>
                  To ensure the integrity of academic credentials, we require verification 
                  of your {userType} status through SheerID.
                </p>
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className={styles.benefits}>
                <h3>Why verify?</h3>
                <ul>
                  <li>
                    <Shield size={16} />
                    <span>Prevents fraudulent credential claims</span>
                  </li>
                  <li>
                    <CheckCircle size={16} />
                    <span>Adds trust badge to your profile</span>
                  </li>
                  <li>
                    <GraduationCap size={16} />
                    <span>Access to receive verified credentials</span>
                  </li>
                </ul>
              </div>

              <div className={styles.howItWorks}>
                <h3>How it works</h3>
                <ol>
                  <li>Enter your school email (.edu) or upload student ID</li>
                  <li>SheerID verifies against 9,000+ institutions</li>
                  <li>Get instant verification (usually under 1 minute)</li>
                </ol>
              </div>

              <button 
                className={styles.verifyBtn}
                onClick={handleStartVerification}
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <span className={styles.spinner}></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Verify with SheerID
                  </>
                )}
              </button>

              <p className={styles.privacy}>
                <a href="https://www.sheerid.com/privacy-policy/" target="_blank" rel="noreferrer">
                  Privacy Policy <ExternalLink size={12} />
                </a>
                • Your data is securely handled by SheerID
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SheerIDVerification;
