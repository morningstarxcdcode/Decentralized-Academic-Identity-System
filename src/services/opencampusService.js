/**
 * OpenCampus ID Service
 * 
 * Handles OCID authentication and integration using @opencampus/ocid-connect-js SDK.
 * Supports both sandbox (development) and production modes.
 */

import { OCConnect } from '@opencampus/ocid-connect-js';

// Configuration from environment variables
const getOCIDConfig = () => ({
  clientId: import.meta.env.VITE_OCID_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_OCID_REDIRECT_URI || `${window.location.origin}/ocid/callback`,
  sandboxMode: import.meta.env.VITE_OCID_SANDBOX_MODE === 'true',
  referralCode: import.meta.env.VITE_OCID_REFERRAL_CODE || 'PARTNER6'
});

// Singleton instance
let ocConnectInstance = null;
let authState = {
  isAuthenticated: false,
  isInitialized: false,
  accessToken: null,
  idToken: null,
  ocId: null,
  ethAddress: null,
  error: null
};

/**
 * Initialize the OCID SDK
 * @returns {Promise<OCConnect>}
 */
export const initializeOCID = async () => {
  if (ocConnectInstance) {
    return ocConnectInstance;
  }

  const config = getOCIDConfig();
  
  try {
    ocConnectInstance = new OCConnect({
      opts: {
        redirectUri: config.redirectUri,
        referralCode: config.referralCode
      },
      sandboxMode: config.sandboxMode
    });

    authState.isInitialized = true;
    return ocConnectInstance;
  } catch (error) {
    console.error('Failed to initialize OCID:', error);
    authState.error = error.message;
    throw error;
  }
};

/**
 * Get the OCConnect instance (initializes if needed)
 * @returns {Promise<OCConnect>}
 */
export const getOCConnect = async () => {
  if (!ocConnectInstance) {
    return initializeOCID();
  }
  return ocConnectInstance;
};

/**
 * Trigger OCID login flow
 * @param {string} state - Optional state parameter for CSRF protection
 */
export const signInWithOCID = async (state = '') => {
  const ocConnect = await getOCConnect();
  
  try {
    // The SDK handles the redirect to OCID login page
    await ocConnect.signInWithRedirect({ state });
  } catch (error) {
    console.error('OCID sign-in error:', error);
    authState.error = error.message;
    throw error;
  }
};

/**
 * Handle the redirect callback from OCID
 * @returns {Promise<Object>} - Auth state with tokens and user info
 */
export const handleOCIDCallback = async () => {
  const ocConnect = await getOCConnect();
  
  try {
    // Parse the callback URL and extract tokens
    const authInfo = await ocConnect.handleLoginRedirect();
    
    if (authInfo) {
      authState = {
        isAuthenticated: true,
        isInitialized: true,
        accessToken: authInfo.accessToken || null,
        idToken: authInfo.idToken || null,
        ocId: authInfo.OCId || authInfo.edu_username || null,
        ethAddress: authInfo.eth_address || null,
        error: null
      };
    }
    
    return authState;
  } catch (error) {
    console.error('OCID callback error:', error);
    authState.error = error.message;
    authState.isAuthenticated = false;
    throw error;
  }
};

/**
 * Get current OCID auth state
 * @returns {Object} - Current auth state
 */
export const getOCIDAuthState = () => {
  return { ...authState };
};

/**
 * Check if user is authenticated with OCID
 * @returns {boolean}
 */
export const isOCIDAuthenticated = () => {
  return authState.isAuthenticated && !!authState.ocId;
};

/**
 * Logout from OCID
 * @param {string} returnUrl - URL to redirect after logout
 */
export const logoutOCID = async (returnUrl = window.location.origin) => {
  const ocConnect = await getOCConnect();
  
  try {
    await ocConnect.logout(returnUrl);
    
    // Reset auth state
    authState = {
      isAuthenticated: false,
      isInitialized: true,
      accessToken: null,
      idToken: null,
      ocId: null,
      ethAddress: null,
      error: null
    };
  } catch (error) {
    console.error('OCID logout error:', error);
    throw error;
  }
};

/**
 * Get user info from OCID token
 * @returns {Object|null} - User info or null if not authenticated
 */
export const getOCIDUserInfo = async () => {
  const ocConnect = await getOCConnect();
  
  try {
    const userInfo = await ocConnect.getUserInfo();
    return userInfo;
  } catch (error) {
    console.error('Failed to get OCID user info:', error);
    return null;
  }
};

/**
 * Validate OCID configuration
 * @returns {{isValid: boolean, errors: string[]}}
 */
export const validateOCIDConfig = () => {
  const config = getOCIDConfig();
  const errors = [];

  if (!config.sandboxMode && !config.clientId) {
    errors.push('OCID Client ID is required for production mode');
  }

  if (!config.redirectUri) {
    errors.push('OCID Redirect URI is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: {
      ...config,
      clientId: config.clientId ? '***' : 'not set' // Mask client ID
    }
  };
};

/**
 * Reset OCID state (useful for testing or re-initialization)
 */
export const resetOCIDState = () => {
  ocConnectInstance = null;
  authState = {
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
