/**
 * OpenCampus ID Context
 * 
 * Provides OCID authentication state and methods throughout the app.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeOCID,
  signInWithOCID,
  handleOCIDCallback,
  getOCIDAuthState,
  logoutOCID,
  getOCIDUserInfo,
  validateOCIDConfig,
  resetOCIDState
} from '../services/opencampusService';

const OCIDContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useOCID = () => {
  const context = useContext(OCIDContext);
  if (!context) {
    return {
      isOCIDAuthenticated: false,
      isInitialized: false,
      isConnecting: false,
      isVerifying: false,
      ocId: null,
      ethAddress: null,
      error: null,
      connectOCID: async () => {},
      disconnectOCID: async () => {},
      handleCallback: async () => ({}),
      getUserInfo: async () => null
    };
  }
  return context;
};

export const OCIDProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ocId, setOcId] = useState(null);
  const [ethAddress, setEthAddress] = useState(null);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Initialize OCID SDK on mount
  useEffect(() => {
    const init = async () => {
      try {
        const validation = validateOCIDConfig();
        if (!validation.isValid) {
          console.warn('OCID config issues:', validation.errors);
        }
        
        await initializeOCID();
        
        // Check if we have existing auth state
        const authState = getOCIDAuthState();
        if (authState.isAuthenticated) {
          setOcId(authState.ocId);
          setEthAddress(authState.ethAddress);
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize OCID:', err);
        setError(err.message);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    init();
  }, []);

  // Connect to OCID (triggers redirect)
  const connectOCID = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Generate a random state for CSRF protection
      const state = crypto.randomUUID();
      sessionStorage.setItem('ocid_state', state);
      
      await signInWithOCID(state);
      // Note: This will redirect, so the following won't execute
    } catch (err) {
      console.error('OCID connect error:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  }, []);

  // Handle OCID callback (called on redirect back)
  const handleCallback = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const authState = await handleOCIDCallback();
      
      if (authState.isAuthenticated) {
        setOcId(authState.ocId);
        setEthAddress(authState.ethAddress);
        
        // Fetch additional user info
        const info = await getOCIDUserInfo();
        setUserInfo(info);
      }
      
      setIsConnecting(false);
      return authState;
    } catch (err) {
      console.error('OCID callback error:', err);
      setError(err.message);
      setIsConnecting(false);
      throw err;
    }
  }, []);

  // Disconnect from OCID
  const disconnectOCID = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await logoutOCID();
      setOcId(null);
      setEthAddress(null);
      setUserInfo(null);
      resetOCIDState();
    } catch (err) {
      console.error('OCID disconnect error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Get user info
  const getUserInfo = useCallback(async () => {
    if (!ocId) return null;
    
    try {
      const info = await getOCIDUserInfo();
      setUserInfo(info);
      return info;
    } catch (err) {
      console.error('Failed to get user info:', err);
      return null;
    }
  }, [ocId]);

  const value = {
    // State
    isOCIDAuthenticated: !!ocId,
    isInitialized,
    isConnecting,
    isVerifying,
    ocId,
    ethAddress,
    userInfo,
    error,
    
    // Methods
    connectOCID,
    disconnectOCID,
    handleCallback,
    getUserInfo
  };

  return (
    <OCIDContext.Provider value={value}>
      {children}
    </OCIDContext.Provider>
  );
};

export default OCIDContext;
