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

// Authentication context - manages user session and profile state
// Provides auth methods to entire component tree via React context
const AuthContext = createContext(null);

// Custom hook for consuming auth context with safe defaults
// Returns stub methods when context unavailable (during initial render)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Return fallback object when context not yet available
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

// Main auth provider component managing Firebase authentication state
// Handles user registration, login, and profile synchronization
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [verification, setVerification] = useState(null);

  // Subscribe to Firebase auth state changes on mount
  // Automatically fetches/creates user profile when auth state changes
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Attempt to retrieve existing user profile
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // Initialize profile for new users
          if (!userProfile) {
            await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'student'
            });
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          if (isMounted) {
            setProfile(userProfile);
            
            // Restore verification status if not expired
            const verificationData = userProfile?.sheerIdVerification;
            if (verificationData && !isVerificationExpired(verificationData)) {
              setIsStudentVerified(userProfile.isStudentVerified || false);
              setVerification(verificationData);
            } else {
              setIsStudentVerified(false);
              setVerification(null);
            }
          }
        } catch (profileError) {
          console.error('Error loading profile:', profileError);
          if (isMounted) {
            setError(profileError.message);
            // Set minimal profile from Firebase user data
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
        if (isMounted) {
          setProfile(null);
          setIsStudentVerified(false);
          setVerification(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // User registration with email domain validation for role assignment
  // Creates Firebase auth account and corresponding Firestore profile
  const signUp = async (email, password, displayName, role = 'student') => {
    setLoading(true);
    setError(null);
    try {
      // Verify email domain is permitted for requested role
      const domainValidation = validateForRole(email, role);
      if (!domainValidation.isValid) {
        throw new Error(domainValidation.reason || 'Email domain not allowed for this role');
      }
      
      const userCredential = await firebaseSignUp(email, password, displayName);
      
      // Initialize user profile document in Firestore
      await createUserProfile(userCredential.user.uid, {
        email,
        displayName,
        role
      });
      
      const newUserProfile = await getUserProfile(userCredential.user.uid);
      setProfile(newUserProfile);
      return userCredential;
    } catch (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    } finally {
      setLoading(false);
    }
  };

  // Standard email/password authentication
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const authResult = await firebaseSignIn(email, password);
      return authResult;
    } catch (signInError) {
      setError(signInError.message);
      throw signInError;
    } finally {
      setLoading(false);
    }
  };

  // OAuth authentication via Google popup
  // Creates profile for new users automatically
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const authResult = await firebaseSignInWithGoogle();
      
      // Ensure profile exists for OAuth users
      let userProfile = await getUserProfile(authResult.user.uid);
      if (!userProfile) {
        await createUserProfile(authResult.user.uid, {
          email: authResult.user.email,
          displayName: authResult.user.displayName || '',
          role: 'student'
        });
        userProfile = await getUserProfile(authResult.user.uid);
      }
      setProfile(userProfile);
      return authResult;
    } catch (googleError) {
      console.error('Google sign-in error:', googleError);
      
      // Map Firebase error codes to user-friendly messages
      let friendlyMessage = googleError.message;
      if (googleError.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Sign-in popup was closed. Please try again.';
      } else if (googleError.code === 'auth/popup-blocked') {
        friendlyMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (googleError.code === 'auth/unauthorized-domain') {
        friendlyMessage = 'This domain is not authorized for Google sign-in. Please use email/password.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // End user session and clear local state
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile fields in Firestore
  const updateProfile = async (updateData) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      await updateUserProfile(user.uid, updateData);
      const refreshedProfile = await getUserProfile(user.uid);
      setProfile(refreshedProfile);
    } catch (updateError) {
      setError(updateError.message);
      throw updateError;
    }
  };

  // Associate blockchain wallet address with user profile
  const linkWallet = async (walletAddress) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      await updateUserProfile(user.uid, { walletAddress });
      setProfile(prevProfile => ({ ...prevProfile, walletAddress }));
    } catch (linkError) {
      setError(linkError.message);
      throw linkError;
    }
  };

  // Generate decentralized identifier for user
  // Returns wallet address if available, otherwise Firebase-based DID
  const getDID = () => {
    if (profile?.walletAddress) {
      return profile.walletAddress;
    }
    if (user) {
      return generateCustodialDID(user.uid);
    }
    return null;
  };

  // Persist SheerID verification result to user profile
  const saveStudentVerification = async (verificationData) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      await saveVerification(user.uid, verificationData);
      const isApproved = verificationData.status === 'approved';
      setIsStudentVerified(isApproved);
      setVerification(verificationData);
      setProfile(prevProfile => ({
        ...prevProfile,
        isStudentVerified: isApproved,
        sheerIdVerification: verificationData
      }));
    } catch (saveError) {
      setError(saveError.message);
      throw saveError;
    }
  };

  // Query current SheerID verification state
  const checkVerificationStatus = async () => {
    if (!user) {
      return { isVerified: false, verification: null };
    }
    
    try {
      const status = await getVerificationStatus(user.uid);
      if (status.verification && !isVerificationExpired(status.verification)) {
        setIsStudentVerified(status.isVerified);
        setVerification(status.verification);
        return status;
      }
      return { isVerified: false, verification: null };
    } catch (checkError) {
      console.error('Error checking verification:', checkError);
      return { isVerified: false, verification: null };
    }
  };

  // Context value exposed to consumers
  const contextValue = {
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
