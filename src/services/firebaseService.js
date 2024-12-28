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

// Authentication service module for user registration and sign-in flows
// Handles both email/password and OAuth-based authentication strategies

export const signUp = async (email, password, displayName) => {
  try {
    const newUser = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && displayName.trim()) {
      await updateProfile(newUser.user, { displayName });
    }
    
    return newUser;
  } catch (err) {
    throw err;
  }
};

export const signIn = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw err;
  }
};

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    throw err;
  }
};

export const signOut = async () => {
  try {
    return await firebaseSignOut(auth);
  } catch (err) {
    throw err;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// User profile management - Creates and retrieves user metadata stored in Firestore
// O(1) lookup time for single user, O(n) for batch operations

export const createUserProfile = async (uid, userData) => {
  const userDocRef = doc(db, 'users', uid);
  const defaultRole = userData.role || 'student';
  const userPayload = {
    uid,
    email: userData.email,
    displayName: userData.displayName || '',
    role: defaultRole,
    walletAddress: userData.walletAddress || null,
    credentialRefs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(userDocRef, userPayload);
};

export const getUserProfile = async (uid) => {
  const userDocRef = doc(db, 'users', uid);
  const docSnapshot = await getDoc(userDocRef);
  
  if (!docSnapshot.exists()) {
    return null;
  }

  return { 
    id: docSnapshot.id, 
    ...docSnapshot.data() 
  };
};

export const updateUserProfile = async (uid, updateData) => {
  const userDocRef = doc(db, 'users', uid);
  const timestamp = serverTimestamp();
  
  aCredential management - stores academic credentials in subcollection
// Uses credential hash as unique document identifier to prevent duplication
// Time complexity: O(log n) for individual operations, O(n) for batch retrieval

export const addCredential = async (uid, credentialData) => {
  const hashId = credentialData.hash;
  const credentialDocRef = doc(db, 'users', uid, 'credentials', hashId);
  
  const credentialRecord = {
    ...credentialData,
    createdAt: serverTimestamp()
  };
  
  await setDoc(credentialDocRef, credentialRecord);
};

export const getUserCredentials = async (uid) => {
  const credentialsCollectionRef = collection(db, 'users', uid, 'credentials');
  const credentialsSnapshot = await getDocs(credentialsCollectionRef);
  
  const allCredentials = credentialsSnapshot.docs.map(credentialDoc => {
    return credentialDoc.data();
  });
  
  return allCredentials;
};

export const addCredentialRef = async (uid, credentialHash) => {
  const userDocRef = doc(db, 'users', uid);
  
  await updateDoc(userDoc.map(doc => doc.data());
};

// Legacy ref method (kept for backward compatibility if needed, but likely unused now)
export const addCredentialRef = async (uid, credentialHash) => {
  cDecentralized identifier generation for non-wallet authentication users
// Enables credential binding without blockchain wallet requirement

export const generateCustodialDID = (uid) => {
  return `did:firebase:${uid}`;
};

// Student verification management using SheerID service integration
// Tracks verification status and expiration timeline for academic credentials

export const saveVerification = async (uid, verificationData) => {
  const userDocRef = doc(db, 'users', uid);
  
  const verificationPayload = {
    verificationId: verificationData.verificationId,
    status: verificationData.status,
    segment: verificationData.segment,
    email: verificationData.email,
    organization: verificationData.organization,
    verifiedAt: verificationData.verifiedAt,
    expiresAt: verificationData.expiresAt,
    demoMode: verificationData.demoMode || false
  };
  
  const isApproved = verificationData.status === 'approved';
  
  await updateDoc(userDocRef, {
    sheerIdVerification: verificationPayload,
    isStudentVerified: isApproved,
    updatedAt: serverTimestamp()
  });
};

export const getVerificationStatus = async (uid) => {
  const userProfile = await getUserProfile(uid);
  
  if (!userProfile) {
    return {
      isVerified: false,
   Password recovery flow - initiates email-based credential reset
// Time complexity: O(1) - direct Firebase backend operation

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    // Security: Return generic success regardless of error
    // Prevents email enumeration attacks
    console.error('Password reset request error:', err);
    return { success: true };
  }
};

export const confirmPasswordReset = async (resetCode, newPassword) => {
  try {
    await verifyPasswordResetCode(auth, resetCode);
    await firebaseConfirmPasswordReset(auth, resetCode, newPassword);
    return { success: true };
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    
    let userFriendlyMessage = 'Failed to reset password. Please try again.';
    
    if (err.code === 'auth/expired-action-code') {
      userFriendlyMessage = 'This password reset link has expired. Please request a new one.';
    } else if (err.code === 'auth/invalid-action-code') {
      userFriendlyMessage = 'This password reset link is invalid. Please request a new one.';
    } else if (err.code === 'auth/weak-password') {
      userFriendlyMessage = 'Password must be at least 6 characters.';
    }
    
    throw new Error(userFriendlyMwordResetEmail = async (email) => {
  tOpenCampus ID linking - connects blockchain identity to user account
// Stores Ethereum address and linkage timestamp for auditability

export const linkOCID = async (uid, ocidConnectionData) => {
  const userDocRef = doc(db, 'users', uid);
  
  await updateDoc(userDocRef, {
    ocId: ocidConnectionData.ocId,
    ocIdLinkedAt: serverTimestamp(),
    ethAddress: ocidConnectionData.ethAddress || null,
    updatedAt: serverTimestamp()
  });
};

export const unlinkOCID = async (uid) => {
  const userDocRef = doc(db, 'users', uid);
  
  await updateDoc(userDocRef, {
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
  addCredential,
  getUserCredentials,
  addCredentialRef,
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
