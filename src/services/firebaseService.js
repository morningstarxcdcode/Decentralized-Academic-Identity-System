import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  getDocs
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

// ============ Authentication Methods ============

export const signUp = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name in Firebase Auth
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  return userCredential;
};

export const signIn = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ============ User Profile Methods (Firestore) ============

export const createUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email: data.email,
    displayName: data.displayName || '',
    role: data.role || 'student',
    walletAddress: data.walletAddress || null,
    credentialRefs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

export const updateUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// ============ Credential Reference Methods (for non-wallet users) ============

// ============ Credential Storage Methods (for persistent Demo Mode) ============

export const addCredential = async (uid, credentialData) => {
  // Store in a subcollection 'credentials' under the user
  // Use hash as doc ID to prevent duplicates
  const credRef = doc(db, 'users', uid, 'credentials', credentialData.hash);
  await setDoc(credRef, {
    ...credentialData,
    createdAt: serverTimestamp()
  });
};

export const getUserCredentials = async (uid) => {
  const credsRef = collection(db, 'users', uid, 'credentials');
  const snapshot = await getDocs(credsRef);
  return snapshot.docs.map(doc => doc.data());
};

// Legacy ref method (kept for backward compatibility if needed, but likely unused now)
export const addCredentialRef = async (uid, credentialHash) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    credentialRefs: arrayUnion(credentialHash),
    updatedAt: serverTimestamp()
  });
};

// ============ Helper to generate custodial ID for non-wallet users ============

export const generateCustodialDID = (uid) => {
  return `did:firebase:${uid}`;
};

// ============ SheerID Verification Methods ============

export const saveVerification = async (uid, verificationData) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    sheerIdVerification: {
      verificationId: verificationData.verificationId,
      status: verificationData.status,
      segment: verificationData.segment,
      email: verificationData.email,
      organization: verificationData.organization,
      verifiedAt: verificationData.verifiedAt,
      expiresAt: verificationData.expiresAt,
      demoMode: verificationData.demoMode || false
    },
    isStudentVerified: verificationData.status === 'approved',
    updatedAt: serverTimestamp()
  });
};

export const getVerificationStatus = async (uid) => {
  const profile = await getUserProfile(uid);
  return {
    isVerified: profile?.isStudentVerified || false,
    verification: profile?.sheerIdVerification || null
  };
};

export const isVerificationExpired = (verification) => {
  if (!verification || !verification.expiresAt) return true;
  return new Date(verification.expiresAt) < new Date();
};

// ============ Password Recovery Methods ============

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    // Return generic message for security (don't reveal if email exists)
    console.error('Password reset error:', error);
    return { success: true }; // Always return success for security
  }
};

export const confirmPasswordReset = async (code, newPassword) => {
  try {
    // Verify the code first
    await verifyPasswordResetCode(auth, code);
    // Then reset the password
    await firebaseConfirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    let message = 'Failed to reset password. Please try again.';
    if (error.code === 'auth/expired-action-code') {
      message = 'This password reset link has expired. Please request a new one.';
    } else if (error.code === 'auth/invalid-action-code') {
      message = 'This password reset link is invalid. Please request a new one.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password must be at least 6 characters.';
    }
    throw new Error(message);
  }
};

// ============ OCID Linking Methods ============

export const linkOCID = async (uid, ocIdData) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ocId: ocIdData.ocId,
    ocIdLinkedAt: serverTimestamp(),
    ethAddress: ocIdData.ethAddress || null,
    updatedAt: serverTimestamp()
  });
};

export const unlinkOCID = async (uid) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ocId: null,
    ocIdLinkedAt: null,
    updatedAt: serverTimestamp()
  });
};

export default {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  onAuthChange,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  addCredential, // New
  getUserCredentials, // New
  addCredentialRef, // Legacy
  generateCustodialDID,
  saveVerification,
  getVerificationStatus,
  isVerificationExpired,
  sendPasswordResetEmail,
  confirmPasswordReset,
  linkOCID,
  unlinkOCID
};
