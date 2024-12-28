// OpenCampus ID integration context
// Manages OCID authentication state and SDK interactions
// Provides OAuth flow handling for decentralized identity verification

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

// Custom hook for OCID context consumption with safe defaults
// eslint-disable-next-line react-refresh/only-export-components
export const useOCID = () => {
  const context = useContext(OCIDContext);
  
  // Return fallback when context not available
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

// OCID provider component - initializes SDK and manages auth state
export const OCIDProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ocId, setOcId] = useState(null);
  const [ethAddress, setEthAddress] = useState(null);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Initialize OCID SDK on component mount
  // Restores existing auth state if available
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const configValidation = validateOCIDConfig();
        if (!configValidation.isValid) {
          console.warn('OCID configuration issues:', configValidation.errors);
        }
        
        await initializeOCID();
        
        // Check for persisted authentication
        const existingAuthState = getOCIDAuthState();
        if (existingAuthState.isAuthenticated) {
          setOcId(existingAuthState.ocId);
          setEthAddress(existingAuthState.ethAddress);
        }
        
        setIsInitialized(true);
      } catch (initError) {
        console.error('Failed to initialize OCID:', initError);
        setError(initError.message);
        setIsInitialized(true); // Mark initialized to prevent blocking
      }
    };

    initializeSDK();
  }, []);

  // Initiate OCID OAuth flow - redirects to OpenCampus login
  const connectOCID = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Generate CSRF protection token
      const stateToken = crypto.randomUUID();
      sessionStorage.setItem('ocid_state', stateToken);
      
      await signInWithOCID(stateToken);
      // Redirect occurs - subsequent code won't execute
    } catch (connectError) {
      console.error('OCID connect error:', connectError);
      setError(connectError.message);
      setIsConnecting(false);
    }
  }, []);

  // Process OAuth callback after redirect from OpenCampus
  const handleCallback = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const authState = await handleOCIDCallback();
      
      if (authState.isAuthenticated) {
        setOcId(authState.ocId);
        setEthAddress(authState.ethAddress);
        
        // Fetch extended user profile
        const userProfile = await getOCIDUserInfo();
        setUserInfo(userProfile);
      }
      
      setIsConnecting(false);
      return authState;
    } catch (callbackError) {
      console.error('OCID callback error:', callbackError);
      setError(callbackError.message);
      setIsConnecting(false);
      throw callbackError;
    }
  }, []);

  // End OCID session and clear local state
  const disconnectOCID = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await logoutOCID();
      setOcId(null);
      setEthAddress(null);
      setUserInfo(null);
      resetOCIDState();
    } catch (disconnectError) {
      console.error('OCID disconnect error:', disconnectError);
      setError(disconnectError.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Fetch current user profile from OCID service
  const getUserInfo = useCallback(async () => {
    if (!ocId) return null;
    
    try {
      const profileInfo = await getOCIDUserInfo();
      setUserInfo(profileInfo);
      return profileInfo;
    } catch (fetchError) {
      console.error('Failed to get user info:', fetchError);
      return null;
    }
  }, [ocId]);

  // Context value exposed to consumers
  const contextValue = {
    isOCIDAuthenticated: !!ocId,
    isInitialized,
    isConnecting,
    isVerifying,
    ocId,
    ethAddress,
    userInfo,
    error,
    connectOCID,
    disconnectOCID,
    handleCallback,
    getUserInfo
  };

  return (
    <OCIDContext.Provider value={contextValue}>
      {children}
    </OCIDContext.Provider>
  );
};

export default OCIDContext;
