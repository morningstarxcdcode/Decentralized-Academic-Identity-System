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

// Initialize RPC provider instance - Alchemy endpoint for read operations
// O(1) initialization with singleton pattern to reuse provider connection

export const getProvider = () => {
  if (cachedProvider) {
    return cachedProvider;
  }

  const alchemyRpcUrl = `https://${alchemyConfig.network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`;
  cachedProvider = new ethers.JsonRpcProvider(alchemyRpcUrl);
  
  return cachedProvider;
};

// Access MetaMask provider for write transactions
// Requires user approval and connected wallet

export const getBrowserProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask wallet not detected. Please install MetaMask browser extension.');
  }
  
  return new ethers.BrowserProvider(window.ethereum);
};

// Retrieve contract instance for read-only operations
// Uses Alchemy RPC for efficient data retrieval

export const getReadContract = () => {
  if (!CONTRACT_ADDRESS) {
    console.warn('Contract address not configured - operating in demo mode');
    return null;
  }

  if (cachedContract) {
    return cachedContract;
  }

  cachedContract = new ethers.Contract(
    CONTRACT_ADDRESS, 
    CONTRACT_ABI, 
    getProvider()
  );

  return cachedContract;
};

// Get contract instance with user's signer for state-changing operations
// Connects through MetaMask for transaction signing

export const getWriteContract = async () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Smart contract address not configured. Please deploy contract first.');
  }

  const browserProvider = getBrowserProvider();
  const userSigner = await browserProvider.getSigner();
  
  return new ethers.Contract(
    CONTRACT_ADDRESS, 
    CONTRACT_ABI, 
    userSigner
  );
};

// Wallet connection handler - initiates MetaMask account selection
// Time complexity: O(1) - direct MetaMask request

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask wallet not found. Install MetaMask to use this application.');
  }
  
  try {
    const userAccounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    return userAccounts[0];
  } catch (err) {
    throw err;
  }
};

// Retrieve currently connected account without user prompt
// Returns null if no wallet connected

export const getAccount = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const userAccounts = await window.ethereum.request({
      method: 'eth_accounts'
export const isWalletConnected = async () => {
  const connectedAccount = await getAccount();
  return !!connectedAccount;
};

export const isWalletInstalled = () => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

// Fetch current blockchain network metadata
// Time complexity: O(1) - single RPC call

export const getNetworkInfo = async () => {
  const network = await getProvider().getNetwork();
  
  return {
    name: network.name,
    chainId: Number(network.chainId)
  };
};

// Query latest block height - useful for monitoring blockchain sync
// O(1) operation

export const getBlockNumber = async () => {
  return await getProvider().getBlockNumber();
};

// Retrieve account token balance in native currency
// Time complexity: O(1)

export const getBalance = async (addressToCheck) => {
  const balanceInWei = await getProvider().getBalance(addressToCheck);
  return ethers.formatEther(balanceInWei () => {
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
 / Compute cryptographic hash of credential data
// Uses Keccak256 algorithm consistent with Solidity hashing
// Time complexity: O(n) where n is input size

export const hashCredential = (credentialObject) => {
  const jsonSerialized = JSON.stringify(credentialObject);
  return ethers.keccak256(
    ethers.toUtf8Bytes(jsonSerialized)
  );
};

// Verify if address holds issuer authorization
// Time complexity: O(1) - direct contract lookup

export const isAuthorizedIssuer = async (issuerAddress) => {
  const readableContract = getReadContract();
  
  if (!readableContract) {
    return false;
  }
  
  try {
    const issuerData = await readableContract.authorizedIssuers(issuerAddress);
    return issuerData.isAuthorized;
  } catch (err) {
    console.error('Issuer verification failed:', err);
    return false;
  }
};

// Retrieve issuer metadata and authorization status
// Time complexity: O(1)

export const getIssuerInfo = async (issuerAddress) => {
  const readableContract = getReadContract();
  
  if (!readableContract) {
    return null;
  }
  
  try {
    const issuerRecord = await readableContract.authorizedIssuers(issuerAddress);
    
    return {
 / Publish credential record to blockchain
// Performs write transaction that modifies contract state
// Time complexity: O(1) execution, variable gas cost

export const issueCredentialOnChain = async (
  studentName, 
  studentDID, 
  courseName, 
  ipfsCID, 
  credentialHash
) => {
  const signedContract = await getWriteContract();
  
  const transaction = await signedContract.issueCredential(
    studentName,
    studentDID,
    courseName,
    ipfsCID,
    credentialHash
  );
  
  console.log('Transaction hash:', transaction.hash);
  
  const receipt = await transaction.wait();
  console.log('Block confirmation:', receipt.blockNumber);
  
  return {
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber
  };
};

// Invalidate credential on blockchain - marks as revoked
// Time complexity: O(1) execution

export const revokeCredentialOnChain = async (credentialHash) => {
  const signedContract = await getWriteContract();
  
  const transaction = await signedContract.revokeCredential(credentialHash);
  const receipt = await transaction.wait();
  
  return {
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber
  };
};

// Grant issuer permissions to contract (admin only)
// Time complexity: O(1)

export const authorizeIssuerOnChain = async (issuerAddress, issuerName) => {
  const signedContract = await getWriteContract();
  
  const transaction = await signedContract.authorizeIssuer(issuerAddress, issuerName);
 / Retrieve complete credential details from blockchain
// Time complexity: O(1)

export const getCredentialFromChain = async (credentialHash) => {
  const readableContract = getReadContract();
  
  if (!readableContract) {
    return null;
  }
  
  try {
    const credentialRecord = await readableContract.getCredential(credentialHash);
    
    return {
      issuer: credentialRecord.issuer,
      studentName: credentialRecord.studentName,
      studentDID: credentialRecord.studentDID,
      courseName: credentialRecord.courseName,
      credHash: credentialRecord.credHash,
      ipfsCID: credentialRecord.ipfsCID,
      timestamp: Number(credentialRecord.timestamp),
      isValid: credentialRecord.isValid,
      isRevoked: credentialRecord.isRevoked
    };
  } catch (err) {
    console.error('Credential retrieval error:', err);
    return null;
  }
};

// Verify credential authenticity and revocation status
// Time complexity: O(1) - single contract lookup

export const verifyCredentialOnChain = async (credentialHash) => {
  const readableContract = getReadContract();
  
  if (!readableContract) {
    return {
      valid: false,
      message: 'Smart contract not configured'
    };
  }
  
  try {
    const isCredentialValid = await readableContract.isValidCredential(credentialHash);
    const credentialRecord = await readableContract.getCredential(credentialHash);
    
    // Check if credential exists (timestamp will be 0 for non-existent)
    if (credentialRecord.timestamp === 0n) {
      return {
        valid: false,
        message: 'Credential not found on blockchain'
      };
    }
    
    return {
      valid: isCredentialValid,
      credential: {
        issuer: credentialRecord.issuer,
        studentName: credentialRecord.studentName,
        studentDID: credentialRecord.studentDID,
        courseName: credentialRecord.courseName,
 / Fetch all credential identifiers in existence
// Time complexity: O(n) where n is total credentials
// Note: May be expensive for large datasets - consider pagination

export const getAllCredentialHashes = async () => {
  const readableContract = getReadContract();
  
  if (!readableContract) {
    return [];
  }
  
  try {
    const hashes = await readableContract.getAllCredentialHashes();
    return hashes;
  } catch (err) {
    console.error('Error retrieving credential hashes:', err);
    return [];
  }
};

// Subscribe to account changes via MetaMask event
// Useful for detecting wallet switches

export const onAccountChange = (accountChangeCallback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', accountChangeCallback);
  }
};

// Subscribe to network changes
// Called when user switches blockchain networks

export const onNetworkChange = (networkChangeCallback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', networkChangeCallback);
  }
};

// Switch active network to Polygon mainnet
// May prompt user if chain not already configured

export const switchToPolygon = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  const POLYGON_CHAIN_ID = '0x89'; // 137 in hexadecimal
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }]
    });
  } catch (switchErr) {
    // Chain not yet added - add it
    if (switchErr.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: POLYGON_CHAIN_ID,
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
      throw switchErr;
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
