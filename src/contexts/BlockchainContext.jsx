import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pinataService } from '../services/pinataService';
import { contractService } from '../services/contractService';
import { useAuth } from './AuthContext';
import { addCredentialRef, getVerificationStatus, isVerificationExpired } from '../services/firebaseService';

const BlockchainContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useBlockchain = () => useContext(BlockchainContext);

export const BlockchainProvider = ({ children }) => {
  const auth = useAuth();
  
  const [walletAddress, setWalletAddress] = useState(null);
  const [demoRole, setDemoRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [contractReady, setContractReady] = useState(false);
  
  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: 0,
    txPerHour: 0,
    ipfsSuccess: 99.8,
    avgGas: 0.0022,
    latestBlock: 0
  });

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to AcadChain', message: 'Connect your wallet to get started.', type: 'info', time: Date.now() }
  ]);

  // Credentials cache (fetched from blockchain)
  const [credentialsCache, setCredentialsCache] = useState({});
  const [issuersCache, setIssuersCache] = useState({});

  const addNotification = (title, message, type = 'info') => {
    setNotifications(prev => [{
      id: Date.now(),
      title,
      message,
      type,
      time: Date.now()
    }, ...prev].slice(0, 10));
  };

  const [ipfsProgress, setIpfsProgress] = useState(0);

  // Check contract availability
  useEffect(() => {
    const checkContract = async () => {
      try {
        const contractAddr = import.meta.env.VITE_CONTRACT_ADDRESS;
        if (contractAddr) {
          setContractReady(true);
          const info = await contractService.getNetworkInfo();
          const blockNumber = await contractService.getBlockNumber();
          setNetworkInfo(info);
          setSystemMetrics(prev => ({ ...prev, latestBlock: blockNumber }));
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

  // Listen for account/network changes
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
          addNotification('Account Changed', `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`, 'info');
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

  // --- Wallet Connection ---
  const connectWallet = async (selectedRole) => {
    setLoading(true);
    
    // Demo mode - for testing without MetaMask
    if (selectedRole) {
      let mockAddr = "";
      if (selectedRole === 'university') mockAddr = "0xDEMO_UNIVERSITY_ADDRESS";
      else if (selectedRole === 'government') mockAddr = "0xDEMO_GOVERNMENT_ADDRESS";
      else if (selectedRole === 'admin') mockAddr = "0xDEMO_ADMIN_ADDRESS";
      else mockAddr = "0xDEMO_STUDENT_ADDRESS";
      
      setWalletAddress(mockAddr);
      setDemoRole(selectedRole);
      addNotification('Demo Mode', `Logged in as Demo ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}. Note: On-chain operations require a real wallet.`, 'warning');
      setLoading(false);
      return mockAddr;
    }
    
    // Real MetaMask connection
    if (!contractService.isWalletInstalled()) {
      setLoading(false);
      addNotification('Wallet Required', 'Please install MetaMask to use blockchain features', 'warning');
      throw new Error('MetaMask not installed');
    }
    
    try {
      // Switch to Polygon network
      await contractService.switchToPolygon();
      
      const address = await contractService.connectWallet();
      setWalletAddress(address);
      setDemoRole(null);
      
      // Check if user is an authorized issuer
      if (contractReady) {
        const issuerInfo = await contractService.getIssuerInfo(address);
        if (issuerInfo?.isAuthorized) {
          setIssuersCache(prev => ({
            ...prev,
            [address]: { name: issuerInfo.name, authorized: true }
          }));
        }
      }
      
      // Link wallet to Firebase profile if logged in
      if (auth?.user && auth?.linkWallet) {
        try {
          await auth.linkWallet(address);
        } catch (e) {
          console.warn('Could not link wallet to profile:', e);
        }
      }
      
      addNotification('Wallet Connected', `Connected to ${address.slice(0, 6)}...${address.slice(-4)} on Polygon`, 'success');
      setLoading(false);
      return address;
    } catch (err) {
      setLoading(false);
      addNotification('Connection Failed', err.message, 'error');
      throw err;
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setDemoRole(null);
    addNotification('Disconnected', 'Wallet disconnected.', 'info');
  };

  const getAccount = () => {
    if (walletAddress) return walletAddress;
    if (auth?.getDID) return auth.getDID();
    return null;
  };

  const getRole = () => {
    if (demoRole) return demoRole;
    if (auth?.profile?.role) return auth.profile.role;
    return 'guest';
  };

  const togglePause = () => {
    if (getRole() !== 'admin') throw new Error("Unauthorized: Only SuperAdmin can pause the contract.");
    setIsPaused(prev => !prev);
  };

  // --- Real Blockchain Operations ---

  const issueCredential = async (studentDID, studentName, courseName) => {
    if (isPaused) throw new Error("Contract is currently paused.");
    
    const role = getRole();
    const account = getAccount();
    
    if (role !== 'university') {
      throw new Error("Unauthorized: Only universities can issue credentials.");
    }

    // Check if student is verified (for Firebase DIDs)
    if (studentDID.startsWith('did:firebase:')) {
      const uid = studentDID.replace('did:firebase:', '');
      try {
        const verificationStatus = await getVerificationStatus(uid);
        if (!verificationStatus.isVerified || isVerificationExpired(verificationStatus.verification)) {
          throw new Error("Cannot issue credential: Student has not completed SheerID verification. The student must verify their student status first.");
        }
      } catch (e) {
        if (e.message.includes('SheerID')) {
          throw e;
        }
        console.warn('Could not verify student status:', e);
        // Allow if we can't check (might be a new user)
      }
    }

    setLoading(true);
    setIpfsProgress(0);
    
    try {
      setIpfsProgress(10);
      
      // Prepare credential metadata
      const credentialData = {
        version: '1.0',
        type: 'academic_credential',
        studentDID,
        studentName,
        issuer: {
          address: account,
          name: issuersCache[account]?.name || 'Authorized Issuer'
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

      // Upload to Pinata IPFS
      const ipfsResult = await pinataService.uploadJSON(credentialData, {
        name: `credential-${studentDID}-${Date.now()}`
      });
      
      setIpfsProgress(50);

      // Generate credential hash
      const credHash = contractService.hashCredential(credentialData);

      // Check if we can do on-chain operations
      if (contractReady && !demoRole) {
        setIpfsProgress(60);
        
        // Check if issuer is authorized on-chain
        const isAuthorized = await contractService.isAuthorizedIssuer(account);
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
            await addCredentialRef(uid, credHash);
          } catch (e) {
            console.warn('Could not add credential ref:', e);
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

  const batchIssueCredentials = async (records) => {
    if (getRole() !== 'university') throw new Error("Unauthorized");
    setLoading(true);
    const results = [];
    for (const record of records) {
      const res = await issueCredential(record.did, record.name, record.course);
      results.push(res);
    }
    setLoading(false);
    return results;
  };

  const verifyCredential = useCallback(async (hashOrId) => {
    setLoading(true);
    
    try {
      // First check on-chain if contract is ready
      if (contractReady) {
        const onChainResult = await contractService.verifyCredentialOnChain(hashOrId);
        
        if (onChainResult.valid || onChainResult.credential) {
          // Fetch IPFS data
          let ipfsData = null;
          try {
            ipfsData = await pinataService.fetchByCID(onChainResult.credential.ipfsCID);
          } catch (e) {
            console.warn('Could not fetch from IPFS:', e);
          }
          
          setLoading(false);
          return {
            valid: onChainResult.valid,
            record: onChainResult.credential,
            data: ipfsData,
            issuerName: onChainResult.credential.issuer,
            ipfsUrl: pinataService.getGatewayUrl(onChainResult.credential.ipfsCID),
            onChain: true,
            message: onChainResult.message
          };
        }
      }

      // Fallback to cache (for demo mode credentials)
      const cred = credentialsCache[hashOrId];
      if (!cred) {
        setLoading(false);
        return { valid: false, message: "Credential not found on blockchain or in cache." };
      }

      // Fetch from IPFS
      let ipfsData = null;
      try {
        ipfsData = await pinataService.fetchByCID(cred.ipfsCID);
      } catch (e) {
        console.warn('Could not fetch from IPFS:', e);
      }
      
      setLoading(false);
      return { 
        valid: cred.isValid, 
        record: cred, 
        data: ipfsData,
        issuerName: issuersCache[cred.issuer]?.name || "Unknown Issuer",
        ipfsUrl: pinataService.getGatewayUrl(cred.ipfsCID),
        onChain: false,
        demoMode: cred.demoMode
      };
    } catch (e) {
      setLoading(false);
      return { valid: false, message: e.message };
    }
  }, [contractReady, credentialsCache, issuersCache]);

  const batchVerifyCredentials = async (hashes) => {
    setLoading(true);
    const results = await Promise.all(hashes.map(h => verifyCredential(h)));
    setLoading(false);
    return results;
  };

  const revokeCredential = async (hash) => {
    if (isPaused) throw new Error("Contract is currently paused.");
    const role = getRole();
    if (role !== 'university' && role !== 'government') throw new Error("Unauthorized");
    
    if (contractReady && !demoRole) {
      // Revoke on-chain
      const txResult = await contractService.revokeCredentialOnChain(hash);
      addNotification('Credential Revoked On-Chain', `TX: ${txResult.txHash.slice(0, 10)}...`, 'warning');
    }
    
    // Update cache
    setCredentialsCache(prev => ({
      ...prev,
      [hash]: { ...prev[hash], isValid: false }
    }));
    
    addNotification('Credential Revoked', 'The credential has been revoked.', 'warning');
  };

  const authorizeIssuer = async (address, name) => {
    if (isPaused) throw new Error("Contract is currently paused.");
    if (getRole() !== 'government') throw new Error("Only Government can authorize issuers");
    
    if (contractReady && !demoRole) {
      // Authorize on-chain
      const txResult = await contractService.authorizeIssuerOnChain(address, name);
      addNotification('Issuer Authorized On-Chain', `TX: ${txResult.txHash.slice(0, 10)}...`, 'success');
    }
    
    // Update cache
    setIssuersCache(prev => ({
      ...prev,
      [address]: { name, authorized: true }
    }));
    
    addNotification('Issuer Authorized', `${name} has been authorized as an issuer.`, 'success');
  };

  // --- Getters ---
  const getMyCredentials = useCallback(() => {
    const account = getAccount();
    return Object.values(credentialsCache).filter(c => c.studentDID === account);
  }, [credentialsCache, walletAddress, auth]);

  const getIssuedCredentials = useCallback(() => {
    const account = getAccount();
    return Object.values(credentialsCache).filter(c => c.issuer === account);
  }, [credentialsCache, walletAddress, auth]);

  const getAllIssuers = () => issuersCache;

  const canPerformOnChainOps = () => {
    return contractReady && !!walletAddress && !demoRole;
  };

  const isDemoMode = () => {
    return !!demoRole || !contractReady;
  };

  // Check if a student DID is verified
  const checkStudentVerification = async (studentDID) => {
    if (!studentDID) return { isVerified: false, message: 'No student DID provided' };
    
    // For wallet addresses, we can't check SheerID (they need to link to Firebase)
    if (!studentDID.startsWith('did:firebase:')) {
      return { isVerified: true, message: 'Wallet-based DID (verification not required)' };
    }
    
    const uid = studentDID.replace('did:firebase:', '');
    try {
      const status = await getVerificationStatus(uid);
      if (status.isVerified && !isVerificationExpired(status.verification)) {
        return { 
          isVerified: true, 
          verification: status.verification,
          message: 'Student verified via SheerID'
        };
      }
      return { 
        isVerified: false, 
        message: 'Student has not completed SheerID verification'
      };
    } catch (e) {
      console.warn('Could not check verification:', e);
      return { isVerified: false, message: 'Could not verify student status' };
    }
  };

  const getWalletBalance = async () => {
    if (!walletAddress || demoRole) return '0';
    try {
      return await contractService.getBalance(walletAddress);
    } catch {
      return '0';
    }
  };

  return (
    <BlockchainContext.Provider value={{
      account: getAccount(),
      walletAddress,
      role: getRole(),
      demoRole,
      loading,
      ipfsProgress,
      isPaused,
      systemMetrics,
      networkInfo,
      notifications,
      contractReady,
      addNotification,
      togglePause,
      setSystemMetrics,
      connectWallet,
      disconnectWallet,
      issueCredential,
      batchIssueCredentials,
      verifyCredential,
      batchVerifyCredentials,
      revokeCredential,
      authorizeIssuer,
      getMyCredentials,
      getIssuedCredentials,
      getAllIssuers,
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
