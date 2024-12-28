import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pinataService } from '../services/pinataService';
import { contractService } from '../services/contractService';
import { useAuth } from './AuthContext';
import { addCredential, getUserCredentials, getVerificationStatus, isVerificationExpired } from '../services/firebaseService';

// React context for blockchain state management across the application
// Handles wallet connections, credential operations, and IPFS interactions
// Supports both real blockchain operations and demo mode for testing
const BlockchainContext = createContext();

// Custom hook for accessing blockchain context throughout component tree
// eslint-disable-next-line react-refresh/only-export-components
export const useBlockchain = () => useContext(BlockchainContext);

// Main provider component managing all blockchain-related state
// Implements caching strategy to reduce redundant network calls
export const BlockchainProvider = ({ children }) => {
  const auth = useAuth();
  
  // Core wallet and connection state
  const [walletAddress, setWalletAddress] = useState(null);
  const [demoRole, setDemoRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [contractReady, setContractReady] = useState(false);
  
  // Platform metrics for dashboard display
  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: 0,
    txPerHour: 0,
    ipfsSuccess: 99.8,
    avgGas: 0.0022,
    latestBlock: 0
  });

  // User notification queue with FIFO management
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to AcadChain', message: 'Connect your wallet to get started.', type: 'info', time: Date.now() }
  ]);

  // Local credential cache - reduces blockchain queries
  // Pre-seeded with demo credential for verifier portal testing
  const [credentialsCache, setCredentialsCache] = useState({
    "0xDEMO_CREDENTIAL_HASH": {
      hash: "0xDEMO_CREDENTIAL_HASH",
      studentName: "Alex Rivera",
      courseName: "Advanced Blockchain Architecture",
      issuer: "0xDEMO_UNIVERSITY_ADDRESS",
      issuedDate: new Date().toISOString(),
      isValid: true,
      demoMode: true,
      ipfsCID: "QmDemoCid123456789"
    }
  });
  
  // Issuer registry cache - maps addresses to institution names
  const [issuersCache, setIssuersCache] = useState({
    "0xDEMO_UNIVERSITY_ADDRESS": { name: "MIT Tech", authorized: true }
  });

  // Push notification to queue with automatic cleanup (max 10 items)
  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      time: Date.now()
    };
    
    setNotifications(prevNotifications => {
      const updatedList = [newNotification, ...prevNotifications];
      return updatedList.slice(0, 10);
    });
  };

  const [ipfsProgress, setIpfsProgress] = useState(0);

  // Verify smart contract availability on component mount
  // Sets up network info and determines if on-chain operations are possible
  useEffect(() => {
    const checkContract = async () => {
      try {
        const contractAddr = import.meta.env.VITE_CONTRACT_ADDRESS;
        if (contractAddr) {
          setContractReady(true);
          const info = await contractService.getNetworkInfo();
          const blockNumber = await contractService.getBlockNumber();
          setNetworkInfo(info);
          setSystemMetrics(prevMetrics => ({ ...prevMetrics, latestBlock: blockNumber }));
        } else {
          console.warn('Contract address not configured - running in demo mode only');
          setContractReady(false);
        }
      } catch (err) {
        console.warn('Failed to connect to blockchain:', err.message);
        setContractReady(false);
      }
    };
    checkContract();
  }, []);

  // Subscribe to MetaMask account and network change events
  // Handles wallet disconnect and account switching scenarios
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
          setDemoRole(null);
          addNotification('Wallet Disconnected', 'Your wallet has been disconnected.', 'warning');
        } else if (accounts[0] !== walletAddress) {
          setWalletAddress(accounts[0]);
          setDemoRole(null);
          const shortAddr = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
          addNotification('Account Changed', `Switched to ${shortAddr}`, 'info');
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletAddress]);

  // Load user's credentials from Firebase on authentication change
  // Merges stored credentials with local cache for consistency
  useEffect(() => {
    const loadCredentials = async () => {
      if (auth?.user?.uid) {
        try {
          const savedCreds = await getUserCredentials(auth.user.uid);
          if (savedCreds && savedCreds.length > 0) {
            const credentialMap = {};
            savedCreds.forEach(credential => {
              credentialMap[credential.hash] = credential;
            });
            setCredentialsCache(prevCache => ({ ...prevCache, ...credentialMap }));
          }
        } catch (loadError) {
          console.warn('Failed to load credentials from Firestore:', loadError);
        }
      }
    };
    loadCredentials();
  }, [auth?.user?.uid]);

  // Wallet connection handler - supports both demo and real MetaMask connections
  // Demo mode uses mock addresses for testing without blockchain interaction
  const connectWallet = async (selectedRole) => {
    setLoading(true);
    
    // Demo mode flow - assigns mock address based on role selection
    if (selectedRole) {
      let mockAddress = "";
      if (selectedRole === 'university') mockAddress = "0xDEMO_UNIVERSITY_ADDRESS";
      else if (selectedRole === 'government') mockAddress = "0xDEMO_GOVERNMENT_ADDRESS";
      else if (selectedRole === 'admin') mockAddress = "0xDEMO_ADMIN_ADDRESS";
      else mockAddress = "0xDEMO_STUDENT_ADDRESS";
      
      setWalletAddress(mockAddress);
      setDemoRole(selectedRole);
      
      const roleDisplayName = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
      addNotification(
        'Demo Mode', 
        `Logged in as Demo ${roleDisplayName}. Note: On-chain operations require a real wallet.`, 
        'warning'
      );
      setLoading(false);
      return mockAddress;
    }
    
    // Real MetaMask wallet connection flow
    if (!contractService.isWalletInstalled()) {
      setLoading(false);
      addNotification('Wallet Required', 'Please install MetaMask to use blockchain features', 'warning');
      throw new Error('MetaMask not installed');
    }
    
    try {
      // Ensure we're on the correct network before proceeding
      await contractService.switchToPolygon();
      
      const connectedAddress = await contractService.connectWallet();
      setWalletAddress(connectedAddress);
      setDemoRole(null);
      
      // Check if connected wallet is an authorized credential issuer
      if (contractReady) {
        const issuerInfo = await contractService.getIssuerInfo(connectedAddress);
        if (issuerInfo?.isAuthorized) {
          setIssuersCache(prevIssuers => ({
            ...prevIssuers,
            [connectedAddress]: { name: issuerInfo.name, authorized: true }
          }));
        }
      }
      
      // Sync wallet address with Firebase user profile if authenticated
      if (auth?.user && auth?.linkWallet) {
        try {
          await auth.linkWallet(connectedAddress);
        } catch (linkError) {
          console.warn('Could not link wallet to profile:', linkError);
        }
      }
      
      const shortAddress = `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
      addNotification('Wallet Connected', `Connected to ${shortAddress} on Polygon`, 'success');
      setLoading(false);
      return connectedAddress;
    } catch (connectionError) {
      setLoading(false);
      addNotification('Connection Failed', connectionError.message, 'error');
      throw connectionError;
    }
  };

  // Disconnect wallet and clear associated state
  const disconnectWallet = () => {
    setWalletAddress(null);
    setDemoRole(null);
    addNotification('Disconnected', 'Wallet disconnected.', 'info');
  };

  // Get current account identifier - prioritizes wallet, falls back to DID
  const getAccount = useCallback(() => {
    if (walletAddress) return walletAddress;
    if (auth?.getDID) return auth.getDID();
    return null;
  }, [walletAddress, auth]);

  // Determine user role from demo selection or Firebase profile
  const getRole = () => {
    if (demoRole) return demoRole;
    if (auth?.profile?.role) return auth.profile.role;
    return 'guest';
  };

  // Toggle contract pause state - admin only functionality
  const togglePause = () => {
    if (getRole() !== 'admin') {
      throw new Error("Unauthorized: Only SuperAdmin can pause the contract.");
    }
    setIsPaused(previousState => !previousState);
  };

  // Core credential issuance function - handles IPFS upload and blockchain recording
  // Validates issuer authorization and student verification before proceeding
  // Time complexity: O(1) for local operations, variable for network calls
  const issueCredential = async (studentDID, studentName, courseName) => {
    if (isPaused) {
      throw new Error("Contract is currently paused.");
    }
    
    const currentRole = getRole();
    const currentAccount = getAccount();
    
    if (currentRole !== 'university') {
      throw new Error("Unauthorized: Only universities can issue credentials.");
    }

    // Verify student status for Firebase-based DIDs before credential issuance
    if (studentDID.startsWith('did:firebase:')) {
      const studentUid = studentDID.replace('did:firebase:', '');
      try {
        const verificationStatus = await getVerificationStatus(studentUid);
        if (!verificationStatus.isVerified || isVerificationExpired(verificationStatus.verification)) {
          throw new Error("Cannot issue credential: Student has not completed SheerID verification. The student must verify their student status first.");
        }
      } catch (verifyError) {
        if (verifyError.message.includes('SheerID')) {
          throw verifyError;
        }
        console.warn('Could not verify student status:', verifyError);
      }
    }

    setLoading(true);
    setIpfsProgress(0);
    
    try {
      setIpfsProgress(10);
      
      // Construct credential metadata object for IPFS storage
      const credentialMetadata = {
        version: '1.0',
        type: 'academic_credential',
        studentDID,
        studentName,
        issuer: {
          address: currentAccount,
          name: issuersCache[currentAccount]?.name || 'Authorized Issuer'
        },
        credential: {
          type: 'certificate',
          title: courseName,
          issuedDate: new Date().toISOString()
        },
        metadata: {
          createdAt: Date.now(),
          network: 'polygon'
        }
      };

      setIpfsProgress(30);

      // Pin credential data to IPFS via Pinata
      const ipfsResult = await pinataService.uploadJSON(credentialMetadata, {
        name: `credential-${studentDID}-${Date.now()}`
      });
      
      setIpfsProgress(50);

      // Generate deterministic hash from credential content
      const credentialHash = contractService.hashCredential(credentialMetadata);

      // Execute on-chain transaction if blockchain is available
      if (contractReady && !demoRole) {
        setIpfsProgress(60);
        
        // Verify issuer authorization on-chain
        const isAuthorized = await contractService.isAuthorizedIssuer(currentAccount);
        if (!isAuthorized) {
          throw new Error("Your wallet is not authorized as an issuer on the blockchain. Contact government admin.");
        }

        setIpfsProgress(70);

        // Issue credential on blockchain
        const txResult = await contractService.issueCredentialOnChain(
          studentName,
          studentDID,
          courseName,
          ipfsResult.IpfsHash,
          credHash
        );

        setIpfsProgress(90);

        // Cache the credential
        const newCred = {
          issuer: account,
          studentDID,
          studentName,
          courseName,
          hash: credHash,
          ipfsCID: ipfsResult.IpfsHash,
          timestamp: Date.now(),
          isValid: true,
          txHash: txResult.txHash,
          blockNumber: txResult.blockNumber
        };

        setCredentialsCache(prev => ({
          ...prev,
          [credHash]: newCred
        }));

        setIpfsProgress(100);
        setLoading(false);
        
        addNotification('Credential Issued On-Chain', `TX: ${txResult.txHash.slice(0, 10)}...`, 'success');
        
        return { hash: credHash, cid: ipfsResult.IpfsHash, txHash: txResult.txHash };
      } else {
        // Demo mode - store locally only
        setIpfsProgress(70);
        
        const newCred = {
          issuer: account,
          studentDID,
          studentName,
          courseName,
          hash: credHash,
          ipfsCID: ipfsResult.IpfsHash,
          timestamp: Date.now(),
          isValid: true,
          demoMode: true
        };

        setCredentialsCache(prev => ({
          ...prev,
          [credHash]: newCred
        }));

        // Store in Firebase if student has Firebase DID
        if (studentDID.startsWith('did:firebase:')) {
          const uid = studentDID.replace('did:firebase:', '');
          try {
            await addCredential(uid, newCred);
          } catch (e) {
            console.warn('Could not add credential to Firestore:', e);
          }
        }

        setIpfsProgress(100);
        setLoading(false);
        
        addNotification('Credential Issued (Demo)', `IPFS CID: ${ipfsResult.IpfsHash.slice(0, 15)}...`, 'success');
        
        return { hash: credHash, cid: ipfsResult.IpfsHash };
      }
    } catch (e) {
      setLoading(false);
      setIpfsProgress(0);
      addNotification('Issue Failed', e.message, 'error');
      throw e;
    }
  };

  // Process batch credential issuance for multiple students
  // Iterates through records sequentially to avoid rate limiting
  // Time complexity: O(n) where n is number of records
  const batchIssueCredentials = async (studentRecords) => {
    if (getRole() !== 'university') {
      throw new Error("Unauthorized: Only universities can batch issue");
    }
    
    setLoading(true);
    const issuanceResults = [];
    
    for (const record of studentRecords) {
      const credentialResult = await issueCredential(
        record.did, 
        record.name, 
        record.course
      );
      issuanceResults.push(credentialResult);
    }
    
    setLoading(false);
    return issuanceResults;
  };

  // Demo simulation state for testing verification flow
  const [demoRotationIndex, setDemoRotationIndex] = useState(0);

  // Sample demo scenarios for testing verification UI
  const demoScenarios = [
    {
      hash: "0xDEMO_CREDENTIAL_HASH",
      studentName: "none",
      courseName: "Advanced Blockchain Architecture",
      issuer: "0xDEMO_GNIT_ADDRESS", 
      issuerName: "GNIT",
      issuedDate: "2025-12-28T10:00:00Z",
      isValid: true,
      demoMode: true,
      ipfsCID: "QmDemoCid1"
    },
    {
      hash: "0xDEMO_CREDENTIAL_HASH",
      studentName: "Sourav Rajak",
      courseName: "Advanced Blockchain Architecture",
      issuer: "0xDEMO_UNKNOWN_ADDRESS",
      issuerName: "none",
      issuedDate: "2025-12-28T10:00:00Z",
      isValid: true,
      demoMode: true,
      ipfsCID: "QmDemoCid2"
    }
  ];

  // Verify credential authenticity - checks on-chain, cache, and IPFS
  // Supports demo mode for testing without blockchain connection
  // Time complexity: O(1) for cache lookup, O(log n) for blockchain verification
  const verifyCredential = useCallback(async (hashOrId) => {
    setLoading(true);
    
    // Demo simulation: Return fixed scenario for testing hash
    if (hashOrId === "0xDEMO_CREDENTIAL_HASH") {
      // Simulate realistic network latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const demoCredential = {
        hash: "0xDEMO_CREDENTIAL_HASH",
        studentName: "Sourav Rajak",
        courseName: "none(Aadhar)",
        issuer: "0xDEMO_UIDAI_ADDRESS", 
        issuerName: "the Unique Identification Authority of India (UIDAI)", 
        issuedDate: "2025-12-28T10:00:00Z",
        timestamp: "2025-12-28T10:00:00Z",
        isValid: true,
        demoMode: true,
        ipfsCID: "QmDemoCidUIDAI123"
      };

      setLoading(false);
      return { 
        valid: demoCredential.isValid, 
        record: demoCredential, 
        data: { ...demoCredential, description: "Verified Identity Document" },
        issuerName: demoCredential.issuerName,
        ipfsUrl: "#",
        onChain: false,
        demoMode: true
      };
    }

    try {
      // Attempt on-chain verification first
      if (contractReady) {
        const blockchainResult = await contractService.verifyCredentialOnChain(hashOrId);
        
        if (blockchainResult.valid || blockchainResult.credential) {
          // Retrieve associated IPFS metadata
          let ipfsMetadata = null;
          try {
            ipfsMetadata = await pinataService.fetchByCID(
              blockchainResult.credential.ipfsCID
            );
          } catch (ipfsError) {
            console.warn('IPFS fetch failed:', ipfsError);
          }
          
          setLoading(false);
          return {
            valid: blockchainResult.valid,
            record: blockchainResult.credential,
            data: ipfsMetadata,
            issuerName: blockchainResult.credential.issuer,
            ipfsUrl: pinataService.getGatewayUrl(blockchainResult.credential.ipfsCID),
            onChain: true,
            message: blockchainResult.message
          };
        }
      }

      // Fallback: Check local cache for demo/offline credentials
      const cachedCredential = credentialsCache[hashOrId];
      if (!cachedCredential) {
        setLoading(false);
        return { 
          valid: false, 
          message: "Credential not found on blockchain or in cache." 
        };
      }

      // Fetch IPFS data for cached credential
      let ipfsMetadata = null;
      try {
        ipfsMetadata = await pinataService.fetchByCID(cachedCredential.ipfsCID);
      } catch (fetchError) {
        console.warn('Could not fetch IPFS data:', fetchError);
      }
      
      setLoading(false);
      return { 
        valid: cachedCredential.isValid, 
        record: cachedCredential, 
        data: ipfsMetadata,
        issuerName: issuersCache[cachedCredential.issuer]?.name || "Unknown Issuer",
        ipfsUrl: pinataService.getGatewayUrl(cachedCredential.ipfsCID),
        onChain: false,
        demoMode: cachedCredential.demoMode
      };
    } catch (verificationError) {
      setLoading(false);
      return { valid: false, message: verificationError.message };
    }
  }, [contractReady, credentialsCache, issuersCache, demoRotationIndex]);

  // Batch verify multiple credentials in parallel
  // Time complexity: O(n) where n is number of hashes
  const batchVerifyCredentials = async (credentialHashes) => {
    setLoading(true);
    const verificationResults = await Promise.all(
      credentialHashes.map(hash => verifyCredential(hash))
    );
    setLoading(false);
    return verificationResults;
  };

  // Revoke a credential - marks as invalid on-chain and in cache
  // Only authorized universities and government can perform this action
  const revokeCredential = async (credentialHash) => {
    if (isPaused) {
      throw new Error("Contract is currently paused.");
    }
    
    const userRole = getRole();
    if (userRole !== 'university' && userRole !== 'government') {
      throw new Error("Unauthorized: Only universities or government can revoke");
    }
    
    // Execute on-chain revocation if blockchain is connected
    if (contractReady && !demoRole) {
      const revokeTx = await contractService.revokeCredentialOnChain(credentialHash);
      addNotification(
        'Credential Revoked On-Chain', 
        `TX: ${revokeTx.txHash.slice(0, 10)}...`, 
        'warning'
      );
    }
    
    // Update local cache to reflect revocation
    setCredentialsCache(prevCache => ({
      ...prevCache,
      [credentialHash]: { ...prevCache[credentialHash], isValid: false }
    }));
    
    addNotification('Credential Revoked', 'The credential has been revoked.', 'warning');
  };

  // Authorize a new issuer (university) - government only function
  // Grants permission to issue credentials on the blockchain
  const authorizeIssuer = async (issuerAddress, issuerName) => {
    if (isPaused) {
      throw new Error("Contract is currently paused.");
    }
    
    if (getRole() !== 'government') {
      throw new Error("Only Government can authorize issuers");
    }
    
    // Execute on-chain authorization if connected
    if (contractReady && !demoRole) {
      const authorizeTx = await contractService.authorizeIssuerOnChain(
        issuerAddress, 
        issuerName
      );
      addNotification(
        'Issuer Authorized On-Chain', 
        `TX: ${authorizeTx.txHash.slice(0, 10)}...`, 
        'success'
      );
    }
    
    // Update local issuer cache
    setIssuersCache(prevIssuers => ({
      ...prevIssuers,
      [issuerAddress]: { name: issuerName, authorized: true }
    }));
    
    addNotification(
      'Issuer Authorized', 
      `${issuerName} has been authorized as an issuer.`, 
      'success'
    );
  };

  // Credential retrieval functions with memoization
  
  // Get credentials owned by current user (as student)
  // Filters by matching studentDID - Time complexity: O(n)
  const getMyCredentials = useCallback(() => {
    const currentAccount = getAccount();
    return Object.values(credentialsCache).filter(
      credential => credential.studentDID === currentAccount
    );
  }, [credentialsCache, getAccount]);

  // Get credentials issued by current user (as university)
  // Filters by matching issuer address - Time complexity: O(n)
  const getIssuedCredentials = useCallback(() => {
    const currentAccount = getAccount();
    return Object.values(credentialsCache).filter(
      credential => credential.issuer === currentAccount
    );
  }, [credentialsCache, getAccount]);

  // Return all cached issuers for display
  const getAllIssuers = () => issuersCache;

  // Check if on-chain operations are available
  // Requires: contract deployed, wallet connected, not in demo mode
  const canPerformOnChainOps = () => {
    return contractReady && !!walletAddress && !demoRole;
  };

  // Check if running in demo/offline mode
  const isDemoMode = () => {
    return !!demoRole || !contractReady;
  };

  // Verify student has completed SheerID verification
  // Required before issuing credentials to ensure student authenticity
  const checkStudentVerification = async (studentDID) => {
    if (!studentDID) {
      return { isVerified: false, message: 'No student DID provided' };
    }
    
    // Wallet-based DIDs bypass SheerID (already authenticated via blockchain)
    if (!studentDID.startsWith('did:firebase:')) {
      return { 
        isVerified: true, 
        message: 'Wallet-based DID (verification not required)' 
      };
    }
    
    // Extract Firebase UID and check SheerID verification status
    const firebaseUid = studentDID.replace('did:firebase:', '');
    try {
      const verificationStatus = await getVerificationStatus(firebaseUid);
      
      if (verificationStatus.isVerified && 
          !isVerificationExpired(verificationStatus.verification)) {
        return { 
          isVerified: true, 
          verification: verificationStatus.verification,
          message: 'Student verified via SheerID'
        };
      }
      
      return { 
        isVerified: false, 
        message: 'Student has not completed SheerID verification'
      };
    } catch (verificationError) {
      console.warn('Verification check failed:', verificationError);
      return { 
        isVerified: false, 
        message: 'Could not verify student status' 
      };
    }
  };

  // Fetch wallet balance for display (returns '0' in demo mode)
  const getWalletBalance = async () => {
    if (!walletAddress || demoRole) {
      return '0';
    }
    
    try {
      return await contractService.getBalance(walletAddress);
    } catch (balanceError) {
      return '0';
    }
  };

  // Provider value object - exposes all context state and methods
  return (
    <BlockchainContext.Provider value={{
      // Current user state
      account: getAccount(),
      walletAddress,
      role: getRole(),
      demoRole,
      
      // Loading and progress indicators
      loading,
      ipfsProgress,
      
      // System state
      isPaused,
      systemMetrics,
      networkInfo,
      notifications,
      contractReady,
      
      // Notification management
      addNotification,
      
      // Admin controls
      togglePause,
      setSystemMetrics,
      
      // Wallet operations
      connectWallet,
      disconnectWallet,
      
      // Credential operations
      issueCredential,
      batchIssueCredentials,
      verifyCredential,
      batchVerifyCredentials,
      revokeCredential,
      
      // Issuer management
      authorizeIssuer,
      
      // Data retrieval
      getMyCredentials,
      getIssuedCredentials,
      getAllIssuers,
      
      // Status checks
      canPerformOnChainOps,
      isDemoMode,
      checkStudentVerification,
      getWalletBalance,
      isWalletInstalled: contractService.isWalletInstalled
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};
