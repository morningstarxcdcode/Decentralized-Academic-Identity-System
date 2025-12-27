import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
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

export const addCredentialRef = async (uid, credentialHash) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    credentialRefs: arrayUnion(credentialHash),
    updatedAt: serverTimestamp()
  });
};

export const getCredentialRefs = async (uid) => {
  const profile = await getUserProfile(uid);
  return profile?.credentialRefs || [];
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

export default {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  onAuthChange,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  addCredentialRef,
  getCredentialRefs,
  generateCustodialDID,
  saveVerification,
  getVerificationStatus,
  isVerificationExpired
};
