import { createContext, useContext, useState, useEffect } from 'react';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  onAuthChange,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  generateCustodialDID,
  saveVerification,
  getVerificationStatus,
  isVerificationExpired,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  linkOCID as firebaseLinkOCID,
  unlinkOCID as firebaseUnlinkOCID
} from '../services/firebaseService';
import { validateForRole, suggestRole } from '../services/emailDomainValidator';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return empty object if context is null (during initial render)
  if (!context) {
    return {
      user: null,
      profile: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      hasWallet: false,
      isStudentVerified: false,
      verification: null,
      role: 'student',
      signUp: async () => {},
      signIn: async () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
      updateProfile: async () => {},
      linkWallet: async () => {},
      getDID: () => null,
      saveStudentVerification: async () => {},
      checkVerificationStatus: async () => ({ isVerified: false, verification: null }),
      sendPasswordResetEmail: async () => {},
      confirmPasswordReset: async () => {},
      validateEmailForRole: () => ({ isValid: true }),
      suggestRoleForEmail: () => 'student',
      switchRole: async () => {},
      linkOCID: async () => {},
      unlinkOCID: async () => {}
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [verification, setVerification] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!mounted) return;
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Try to get existing profile
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // If no profile exists, create one
          if (!userProfile) {
            await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'student'
            });
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          if (mounted) {
            setProfile(userProfile);
            
            // Load verification status
            const verificationStatus = userProfile?.sheerIdVerification;
            if (verificationStatus && !isVerificationExpired(verificationStatus)) {
              setIsStudentVerified(userProfile.isStudentVerified || false);
              setVerification(verificationStatus);
            } else {
              setIsStudentVerified(false);
              setVerification(null);
            }
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          if (mounted) {
            setError(err.message);
            // Still set a basic profile from Firebase user
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'student'
            });
            setIsStudentVerified(false);
            setVerification(null);
          }
        }
      } else {
        if (mounted) {
          setProfile(null);
          setIsStudentVerified(false);
          setVerification(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (email, password, displayName, role = 'student') => {
    setLoading(true);
    setError(null);
    try {
      // Validate email domain for the selected role
      const validation = validateForRole(email, role);
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Email domain not allowed for this role');
      }
      
      const userCredential = await firebaseSignUp(email, password, displayName);
      
      // Create user profile in Firestore
      await createUserProfile(userCredential.user.uid, {
        email,
        displayName,
        role
      });
      
      const userProfile = await getUserProfile(userCredential.user.uid);
      setProfile(userProfile);
      return userCredential;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseSignIn(email, password);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseSignInWithGoogle();
      
      // Check if profile exists, create if not
      let userProfile = await getUserProfile(result.user.uid);
      if (!userProfile) {
        await createUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName || '',
          role: 'student'
        });
        userProfile = await getUserProfile(result.user.uid);
      }
      setProfile(userProfile);
      return result;
    } catch (err) {
      console.error('Google sign-in error:', err);
      // Handle specific Firebase auth errors
      let errorMessage = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in. Please use email/password.';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await updateUserProfile(user.uid, data);
      const updatedProfile = await getUserProfile(user.uid);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const linkWallet = async (walletAddress) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await updateUserProfile(user.uid, { walletAddress });
      setProfile(prev => ({ ...prev, walletAddress }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get DID - either wallet address or custodial ID
  const getDID = () => {
    if (profile?.walletAddress) {
      return profile.walletAddress;
    }
    if (user) {
      return generateCustodialDID(user.uid);
    }
    return null;
  };

  // Save SheerID verification result
  const saveStudentVerification = async (verificationData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await saveVerification(user.uid, verificationData);
      setIsStudentVerified(verificationData.status === 'approved');
      setVerification(verificationData);
      setProfile(prev => ({
        ...prev,
        isStudentVerified: verificationData.status === 'approved',
        sheerIdVerification: verificationData
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check current verification status
  const checkVerificationStatus = async () => {
    if (!user) return { isVerified: false, verification: null };
    
    try {
      const status = await getVerificationStatus(user.uid);
      if (status.verification && !isVerificationExpired(status.verification)) {
        setIsStudentVerified(status.isVerified);
        setVerification(status.verification);
        return status;
      }
      return { isVerified: false, verification: null };
    } catch (err) {
      console.error('Error checking verification:', err);
      return { isVerified: false, verification: null };
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    initialized,
    isAuthenticated: !!user,
    hasWallet: !!profile?.walletAddress,
    isStudentVerified,
    verification,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    linkWallet,
    getDID,
    saveStudentVerification,
    checkVerificationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
