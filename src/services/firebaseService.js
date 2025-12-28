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

/**
 * Authentication Module
 * Handles user registration, login, session management and OAuth integration
 * All functions are async and throw errors on failure for proper handling
 */

async function registerNewUser(userEmail, userPassword, userName) {
  try {
    const createdUserRef = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
    
    // Update display name only if provided and not empty
    if (userName && userName.trim().length > 0) {
      await updateProfile(createdUserRef.user, { displayName: userName });
    }
    
    return createdUserRef;
  } catch (registrationError) {
    throw new Error(`User registration failed: ${registrationError.message}`);
  }
}

async function loginWithEmail(userEmail, userPassword) {
  try {
    const signInResult = await signInWithEmailAndPassword(auth, userEmail, userPassword);
    return signInResult;
  } catch (loginError) {
    throw new Error(`Email login failed: ${loginError.message}`);
  }
}

async function signInViaGoogle() {
  try {
    const googleLoginResult = await signInWithPopup(auth, googleProvider);
    return googleLoginResult;
  } catch (googleError) {
    throw new Error(`Google sign-in failed: ${googleError.message}`);
  }
}

async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (logoutError) {
    throw new Error(`Logout failed: ${logoutError.message}`);
  }
}

function subscribeToAuthStateChanges(authCallback) {
  // Returns unsubscribe function for cleanup on component unmount
  return onAuthStateChanged(auth, authCallback);
}

export const signUp = registerNewUser;
export const signIn = loginWithEmail;
export const signInWithGoogle = signInViaGoogle;
export const signOut = logoutUser;
export const onAuthChange = subscribeToAuthStateChanges;

/**
 * User Profile Management
 * Manages user metadata and profile information stored in Firestore
 * Direct document lookups provide O(1) performance for profile retrieval
 */

async function initializeUserProfile(userId, profileData) {
  const userDocumentRef = doc(db, 'users', userId);
  const assignedRole = profileData.role || 'student';
  
  const profilePayload = {
    uid: userId,
    email: profileData.email,
    displayName: profileData.displayName || '',
    role: assignedRole,
    walletAddress: profileData.walletAddress || null,
    credentialRefs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  try {
    await setDoc(userDocumentRef, profilePayload);
  } catch (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }
}

async function fetchUserProfile(userId) {
  const userDocumentRef = doc(db, 'users', userId);
  
  try {
    const userDocSnapshot = await getDoc(userDocumentRef);
    
    if (!userDocSnapshot.exists()) {
      return null;
    }

    return { 
      id: userDocSnapshot.id, 
      ...userDocSnapshot.data() 
    };
  } catch (fetchError) {
    throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
  }
}

async function modifyUserProfile(userId, changedData) {
  const userDocumentRef = doc(db, 'users', userId);
  
  const updatePayload = {
    ...changedData,
    updatedAt: serverTimestamp()
  };
  
  try {
    await updateDoc(userDocumentRef, updatePayload);
  } catch (updateError) {
    throw new Error(`Failed to update user profile: ${updateError.message}`);
  }
}

export const createUserProfile = initializeUserProfile;
export const getUserProfile = fetchUserProfile;
export const updateUserProfile = modifyUserProfile;

/**
 * Credential Management
 * Stores and retrieves academic credentials in user subcollections
 * Uses credential hash as unique identifier to prevent duplication
 * Subcollection queries: O(n) where n is number of user credentials
 */

async function storeCredentialForUser(userId, credentialData) {
  const credentialHashId = credentialData.hash;
  const credentialDocRef = doc(db, 'users', userId, 'credentials', credentialHashId);
  
  const credentialStoragePayload = {
    ...credentialData,
    createdAt: serverTimestamp()
  };
  
  try {
    await setDoc(credentialDocRef, credentialStoragePayload);
  } catch (storageError) {
    throw new Error(`Failed to store credential: ${storageError.message}`);
  }
}

async function retrieveUserCredentials(userId) {
  const credentialsCollectionRef = collection(db, 'users', userId, 'credentials');
  
  try {
    const credentialsSnapshot = await getDocs(credentialsCollectionRef);
    
    const storedCredentials = credentialsSnapshot.docs.map(credentialDocument => {
      return credentialDocument.data();
    });
    
    return storedCredentials;
  } catch (retrievalError) {
    throw new Error(`Failed to retrieve credentials: ${retrievalError.message}`);
  }
}

async function linkCredentialToUserProfile(userId, credentialHash) {
  const userDocRef = doc(db, 'users', userId);
  
  try {
    await updateDoc(userDocRef, {
      credentialRefs: arrayUnion(credentialHash),
      updatedAt: serverTimestamp()
    });
  } catch (linkError) {
    throw new Error(`Failed to link credential: ${linkError.message}`);
  }
}

export const addCredential = storeCredentialForUser;
export const getUserCredentials = retrieveUserCredentials;
export const addCredentialRef = linkCredentialToUserProfile;

/**
 * Decentralized Identifier (DID) Generation
 * Creates Firebase-based DIDs for users without blockchain wallet
 * Enables credential binding without requiring cryptocurrency access
 */

function generateCustodialDID(userId) {
  return `did:firebase:${userId}`;
}

export { generateCustodialDID };

/**
 * Student Verification Management
 * Integrates with SheerID service to verify academic status
 * Tracks verification metadata and expiration for credential validity
 */

async function recordStudentVerification(userId, verificationData) {
  const userDocRef = doc(db, 'users', userId);
  
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
  
  try {
    await updateDoc(userDocRef, {
      sheerIdVerification: verificationPayload,
      isStudentVerified: isApproved,
      updatedAt: serverTimestamp()
    });
  } catch (verificationError) {
    throw new Error(`Failed to save verification: ${verificationError.message}`);
  }
}

async function retrieveVerificationStatus(userId) {
  const userProfile = await getUserProfile(userId);
  
  if (!userProfile) {
    return {
      isVerified: false,
      verification: null
    };
  }
  
  const verification = userProfile.sheerIdVerification;
  
  return {
    isVerified: userProfile.isStudentVerified || false,
    verification: verification || null
  };
}

function checkIfVerificationExpired(verificationData) {
  if (!verificationData || !verificationData.expiresAt) {
    return false;
  }
  
  const expirationDate = new Date(verificationData.expiresAt);
  const currentTime = new Date();
  
  return currentTime > expirationDate;
}

export const saveVerification = recordStudentVerification;
export const getVerificationStatus = retrieveVerificationStatus;
export const isVerificationExpired = checkIfVerificationExpired;

/**
 * Password Recovery Management
 * Implements Firebase password reset flow with email verification
 * Prevents email enumeration attacks by returning generic success messages
 */

async function initiatePasswordReset(userEmail) {
  try {
    await firebaseSendPasswordResetEmail(auth, userEmail);
    // Return generic success to prevent email enumeration
    return { success: true };
  } catch (resetError) {
    // Log error for debugging but return generic response
    console.error('Password reset request error:', resetError);
    return { success: true };
  }
}

async function completePasswordReset(resetCode, newPassword) {
  try {
    // First verify the reset code is valid
    await verifyPasswordResetCode(auth, resetCode);
    
    // Then confirm the password reset
    await firebaseConfirmPasswordReset(auth, resetCode, newPassword);
    return { success: true };
  } catch (confirmError) {
    console.error('Password reset confirmation error:', confirmError);
    
    let userFriendlyMessage = 'Failed to reset password. Please try again.';
    
    // Provide specific error messages for common issues
    if (confirmError.code === 'auth/expired-action-code') {
      userFriendlyMessage = 'This password reset link has expired. Please request a new one.';
    } else if (confirmError.code === 'auth/invalid-action-code') {
      userFriendlyMessage = 'This password reset link is invalid. Please request a new one.';
    } else if (confirmError.code === 'auth/weak-password') {
      userFriendlyMessage = 'Password must be at least 6 characters long.';
    }
    
    throw new Error(userFriendlyMessage);
  }
}

export const sendPasswordResetEmail = initiatePasswordReset;
export const confirmPasswordReset = completePasswordReset;

/**
 * OpenCampus ID Integration
 * Links Ethereum addresses and OpenCampus identities to user accounts
 * Stores linkage timestamps for audit trail and identity verification
 */

async function linkOpenCampusIdentity(userId, ocIdData) {
  const userRef = doc(db, 'users', userId);
  
  try {
    await updateDoc(userRef, {
      ocId: ocIdData.ocId,
      ocIdLinkedAt: serverTimestamp(),
      ethAddress: ocIdData.ethAddress || null,
      updatedAt: serverTimestamp()
    });
  } catch (linkingError) {
    throw new Error(`Failed to link OpenCampus ID: ${linkingError.message}`);
  }
}

async function removeOpenCampusIdentityLink(userId) {
  const userRef = doc(db, 'users', userId);
  
  try {
    await updateDoc(userRef, {
      ocId: null,
      ocIdLinkedAt: null,
      updatedAt: serverTimestamp()
    });
  } catch (unlinkError) {
    throw new Error(`Failed to unlink OpenCampus ID: ${unlinkError.message}`);
  }
}

export const linkOCID = linkOpenCampusIdentity;
export const unlinkOCID = removeOpenCampusIdentityLink;

/**
 * Module Exports
 * Public API for Firebase authentication and profile management
 */
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
  generateCustodialDID,
  saveVerification,
  getVerificationStatus,
  isVerificationExpired,
  sendPasswordResetEmail,
  confirmPasswordReset,
  linkOCID,
  unlinkOCID
};
