import { ethers } from 'ethers';
import { alchemyConfig } from '../config/services';

// Contract ABI - matches CredentialRegistry.sol
const CONTRACT_ABI = [
  // Events
  "event IssuerAuthorized(address indexed issuerAddress, string name)",
  "event IssuerRevoked(address indexed issuerAddress)",
  "event CredentialIssued(bytes32 indexed credHash, address indexed issuer, string studentDID)",
  "event CredentialRevoked(bytes32 indexed credHash, address indexed issuer)",
  
  // Read functions
  "function admin() view returns (address)",
  "function credentials(bytes32) view returns (address issuer, string studentName, string studentDID, string courseName, bytes32 credHash, string ipfsCID, uint256 timestamp, bool isValid, bool isRevoked)",
  "function authorizedIssuers(address) view returns (string name, bool isAuthorized, uint256 registeredAt)",
  "function getCredential(bytes32 _credHash) view returns (tuple(address issuer, string studentName, string studentDID, string courseName, bytes32 credHash, string ipfsCID, uint256 timestamp, bool isValid, bool isRevoked))",
  "function getAllCredentialHashes() view returns (bytes32[])",
  "function isValidCredential(bytes32 _credHash) view returns (bool)",
  
  // Write functions
  "function authorizeIssuer(address _issuer, string _name)",
  "function revokeIssuer(address _issuer)",
  "function issueCredential(string _studentName, string _studentDID, string _courseName, string _ipfsCID, bytes32 _credHash)",
  "function revokeCredential(bytes32 _credHash)"
];

// Contract address - UPDATE THIS after deploying to Polygon
// For now using a placeholder - you need to deploy the contract
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || null;

let provider = null;
let contract = null;

/**
 * Get Alchemy provider for read operations
 */
export const getProvider = () => {
  if (!provider) {
    const rpcUrl = `https://${alchemyConfig.network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`;
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
};

/**
 * Get browser provider (MetaMask) for write operations
 */
export const getBrowserProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get contract instance for read operations
 */
export const getReadContract = () => {
  if (!CONTRACT_ADDRESS) {
    console.warn('Contract address not configured');
    return null;
  }
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
  }
  return contract;
};

/**
 * Get contract instance with signer for write operations
 */
export const getWriteContract = async () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please deploy the contract first.');
  }
  const browserProvider = getBrowserProvider();
  const signer = await browserProvider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

/**
 * Connect wallet and get address
 */
export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to use this application.');
  }
  
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  return accounts[0];
};

/**
 * Get current connected account
 */
export const getAccount = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  const accounts = await window.ethereum.request({
    method: 'eth_accounts'
  });
  
  return accounts[0] || null;
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = async () => {
  const account = await getAccount();
  return !!account;
};

/**
 * Check if MetaMask is installed
 */
export const isWalletInstalled = () => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

/**
 * Get network info
 */
export const getNetworkInfo = async () => {
  const network = await getProvider().getNetwork();
  return {
    name: network.name,
    chainId: Number(network.chainId)
  };
};

/**
 * Get current block number
 */
export const getBlockNumber = async () => {
  return await getProvider().getBlockNumber();
};

/**
 * Get account balance
 */
export const getBalance = async (address) => {
  const balance = await getProvider().getBalance(address);
  return ethers.formatEther(balance);
};

/**
 * Hash credential data
 */
export const hashCredential = (data) => {
  const jsonString = JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(jsonString));
};

/**
 * Check if address is authorized issuer
 */
export const isAuthorizedIssuer = async (address) => {
  const contract = getReadContract();
  if (!contract) return false;
  
  try {
    const issuer = await contract.authorizedIssuers(address);
    return issuer.isAuthorized;
  } catch (error) {
    console.error('Error checking issuer:', error);
    return false;
  }
};

/**
 * Get issuer info
 */
export const getIssuerInfo = async (address) => {
  const contract = getReadContract();
  if (!contract) return null;
  
  try {
    const issuer = await contract.authorizedIssuers(address);
    return {
      name: issuer.name,
      isAuthorized: issuer.isAuthorized,
      registeredAt: Number(issuer.registeredAt)
    };
  } catch (error) {
    console.error('Error getting issuer info:', error);
    return null;
  }
};

/**
 * Issue credential on-chain
 */
export const issueCredentialOnChain = async (studentName, studentDID, courseName, ipfsCID, credHash) => {
  const contract = await getWriteContract();
  
  const tx = await contract.issueCredential(
    studentName,
    studentDID,
    courseName,
    ipfsCID,
    credHash
  );
  
  console.log('Transaction submitted:', tx.hash);
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt);
  
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
};

/**
 * Revoke credential on-chain
 */
export const revokeCredentialOnChain = async (credHash) => {
  const contract = await getWriteContract();
  
  const tx = await contract.revokeCredential(credHash);
  const receipt = await tx.wait();
  
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
};

/**
 * Authorize issuer (admin only)
 */
export const authorizeIssuerOnChain = async (issuerAddress, name) => {
  const contract = await getWriteContract();
  
  const tx = await contract.authorizeIssuer(issuerAddress, name);
  const receipt = await tx.wait();
  
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
};

/**
 * Get credential from chain
 */
export const getCredentialFromChain = async (credHash) => {
  const contract = getReadContract();
  if (!contract) return null;
  
  try {
    const cred = await contract.getCredential(credHash);
    return {
      issuer: cred.issuer,
      studentName: cred.studentName,
      studentDID: cred.studentDID,
      courseName: cred.courseName,
      credHash: cred.credHash,
      ipfsCID: cred.ipfsCID,
      timestamp: Number(cred.timestamp),
      isValid: cred.isValid,
      isRevoked: cred.isRevoked
    };
  } catch (error) {
    console.error('Error getting credential:', error);
    return null;
  }
};

/**
 * Verify credential on-chain
 */
export const verifyCredentialOnChain = async (credHash) => {
  const contract = getReadContract();
  if (!contract) {
    return { valid: false, message: 'Contract not configured' };
  }
  
  try {
    const isValid = await contract.isValidCredential(credHash);
    const cred = await contract.getCredential(credHash);
    
    if (cred.timestamp === 0n) {
      return { valid: false, message: 'Credential not found on blockchain' };
    }
    
    return {
      valid: isValid,
      credential: {
        issuer: cred.issuer,
        studentName: cred.studentName,
        studentDID: cred.studentDID,
        courseName: cred.courseName,
        ipfsCID: cred.ipfsCID,
        timestamp: Number(cred.timestamp),
        isRevoked: cred.isRevoked
      },
      message: isValid ? 'Credential verified on blockchain' : 'Credential has been revoked'
    };
  } catch (error) {
    console.error('Error verifying credential:', error);
    return { valid: false, message: error.message };
  }
};

/**
 * Get all credential hashes
 */
export const getAllCredentialHashes = async () => {
  const contract = getReadContract();
  if (!contract) return [];
  
  try {
    return await contract.getAllCredentialHashes();
  } catch (error) {
    console.error('Error getting credential hashes:', error);
    return [];
  }
};

/**
 * Listen for account changes
 */
export const onAccountChange = (callback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 */
export const onNetworkChange = (callback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Switch to Polygon network
 */
export const switchToPolygon = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  const polygonChainId = '0x89'; // 137 in hex
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: polygonChainId }]
    });
  } catch (error) {
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: polygonChainId,
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: ['https://polygon-rpc.com'],
          blockExplorerUrls: ['https://polygonscan.com']
        }]
      });
    } else {
      throw error;
    }
  }
};

export const contractService = {
  getProvider,
  getBrowserProvider,
  getReadContract,
  getWriteContract,
  connectWallet,
  getAccount,
  isWalletConnected,
  isWalletInstalled,
  getNetworkInfo,
  getBlockNumber,
  getBalance,
  hashCredential,
  isAuthorizedIssuer,
  getIssuerInfo,
  issueCredentialOnChain,
  revokeCredentialOnChain,
  authorizeIssuerOnChain,
  getCredentialFromChain,
  verifyCredentialOnChain,
  getAllCredentialHashes,
  onAccountChange,
  onNetworkChange,
  switchToPolygon
};

export default contractService;
