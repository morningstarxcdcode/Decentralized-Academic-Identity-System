// OpenCampus Identity integration using official SDK
// Provides decentralized identity authentication for academic ecosystem
// Supports both development sandbox and live production environments

import { OCConnect } from '@opencampus/ocid-connect-js';

// Configuration loader from environment variables
const getOCIDConfig = () => ({
  clientId: import.meta.env.VITE_OCID_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_OCID_REDIRECT_URI || `${window.location.origin}/ocid/callback`,
  sandboxMode: import.meta.env.VITE_OCID_SANDBOX_MODE === 'true',
  referralCode: import.meta.env.VITE_OCID_REFERRAL_CODE || 'PARTNER6'
});

// Module-level singleton to maintain single SDK instance
let ocConnectInstance = null;

// Authentication state tracker
let authenticationState = {
  isAuthenticated: false,
  isInitialized: false,
  accessToken: null,
  idToken: null,
  ocId: null,
  ethAddress: null,
  error: null
};

// Initialize OpenCampus SDK singleton instance
// Time complexity: O(1)
export const initializeOCID = async () => {
  if (ocConnectInstance) {
    return ocConnectInstance;
  }

  const configuration = getOCIDConfig();
  
  try {
    ocConnectInstance = new OCConnect({
      opts: {
        redirectUri: configuration.redirectUri,
        referralCode: configuration.referralCode
      },
      sandboxMode: configuration.sandboxMode
    });

    authenticationState.isInitialized = true;
    return ocConnectInstance;
  } catch (err) {
    console.error('OCID initialization failed:', err);
    authenticationState.error = err.message;
    throw err;
  }
};

// Retrieve existing SDK instance or create new one
// Time complexity: O(1)
export const getOCConnect = async () => {
  if (!ocConnectInstance) {
    return initializeOCID();
  }
  return ocConnectInstance;
};

// Initiate OAuth redirect flow to OCID login
// Time complexity: O(1) - redirect is immediate
export const signInWithOCID = async (csrfState = '') => {
  const ocConnect = await getOCConnect();
  
  try {
    await ocConnect.signInWithRedirect({ state: csrfState });
  } catch (err) {
    console.error('OCID sign-in redirect failed:', err);
    authenticationState.error = err.message;
    throw err;
  }
};

// Process OAuth callback and extract authentication tokens
// Time complexity: O(1)
export const handleOCIDCallback = async () => {
  const ocConnect = await getOCConnect();
  
  try {
    const authInfo = await ocConnect.handleLoginRedirect();
    
    if (authInfo) {
      authenticationState = {
        isAuthenticated: true,
        isInitialized: true,
        accessToken: authInfo.accessToken || null,
        idToken: authInfo.idToken || null,
        ocId: authInfo.OCId || authInfo.edu_username || null,
        ethAddress: authInfo.eth_address || null,
        error: null
      };
    }
    
    return authenticationState;
  } catch (err) {
    console.error('OCID callback processing failed:', err);
    authenticationState.error = err.message;
    authenticationState.isAuthenticated = false;
    throw err;
  }
};

// Get current authentication state snapshot
// Time complexity: O(1) - returns copy to prevent mutation
export const getOCIDAuthState = () => {
  return { ...authenticationState };
};

// Check if user has valid OCID session
// Time complexity: O(1)
export const isOCIDAuthenticated = () => {
  return authenticationState.isAuthenticated && !!authenticationState.ocId;
};

// Terminate OCID session and clear local state
// Time complexity: O(1)
export const logoutOCID = async (returnUrl = window.location.origin) => {
  const ocConnect = await getOCConnect();
  
  try {
    await ocConnect.logout(returnUrl);
    
    // Reset local authentication state
    authenticationState = {
      isAuthenticated: false,
      isInitialized: true,
      accessToken: null,
      idToken: null,
      ocId: null,
      ethAddress: null,
      error: null
    };
  } catch (err) {
    console.error('OCID logout failed:', err);
    throw err;
  }
};

// Fetch user profile information from OCID token
// Time complexity: O(1)
export const getOCIDUserInfo = async () => {
  const ocConnect = await getOCConnect();
  
  try {
    const userInfo = await ocConnect.getUserInfo();
    return userInfo;
  } catch (err) {
    console.error('Failed to retrieve OCID user info:', err);
    return null;
  }
};

// Validate environment configuration for OCID
// Time complexity: O(1)
export const validateOCIDConfig = () => {
  const configuration = getOCIDConfig();
  const validationErrors = [];

  if (!configuration.sandboxMode && !configuration.clientId) {
    validationErrors.push('OCID Client ID required for production mode');
  }

  if (!configuration.redirectUri) {
    validationErrors.push('OCID Redirect URI is required');
  }

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    config: {
      ...configuration,
      clientId: configuration.clientId ? '***' : 'not set'
    }
  };
};

// Clear SDK instance and authentication state
// Useful for re-initialization or testing
// Time complexity: O(1)
export const resetOCIDState = () => {
  ocConnectInstance = null;
  authenticationState = {
    isAuthenticated: false,
    isInitialized: false,
    accessToken: null,
    idToken: null,
    ocId: null,
    ethAddress: null,
    error: null
  };
};

export default {
  initializeOCID,
  getOCConnect,
  signInWithOCID,
  handleOCIDCallback,
  getOCIDAuthState,
  isOCIDAuthenticated,
  logoutOCID,
  getOCIDUserInfo,
  validateOCIDConfig,
  resetOCIDState
};
