import { ethers } from 'ethers';
import { alchemyConfig } from '../config/services';

/**
 * Smart Contract ABI Definition
 * Defines the interface to the CredentialRegistry smart contract on Polygon blockchain
 * These signatures must match the deployed Solidity contract exactly
 */
const CONTRACT_ABI = [
  // Events - emit when state changes on blockchain
  "event IssuerAuthorized(address indexed issuerAddress, string name)",
  "event IssuerRevoked(address indexed issuerAddress)",
  "event CredentialIssued(bytes32 indexed credHash, address indexed issuer, string studentDID)",
  "event CredentialRevoked(bytes32 indexed credHash, address indexed issuer)",
  
  // Read-only functions - no gas cost, view contract state
  "function admin() view returns (address)",
  "function credentials(bytes32) view returns (address issuer, string studentName, string studentDID, string courseName, bytes32 credHash, string ipfsCID, uint256 timestamp, bool isValid, bool isRevoked)",
  "function authorizedIssuers(address) view returns (string name, bool isAuthorized, uint256 registeredAt)",
  "function getCredential(bytes32 _credHash) view returns (tuple(address issuer, string studentName, string studentDID, string courseName, bytes32 credHash, string ipfsCID, uint256 timestamp, bool isValid, bool isRevoked))",
  "function getAllCredentialHashes() view returns (bytes32[])",
  "function isValidCredential(bytes32 _credHash) view returns (bool)",
  
  // State-modifying functions - require gas and user signature
  "function authorizeIssuer(address _issuer, string _name)",
  "function revokeIssuer(address _issuer)",
  "function issueCredential(string _studentName, string _studentDID, string _courseName, string _ipfsCIC, bytes32 _credHash)",
  "function revokeCredential(bytes32 _credHash)"
];

// Smart contract address deployed on Polygon network
// Must be updated after contract deployment and set in environment variables
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || null;

// Cached provider instances to reuse connections
let cachedProvider = null;
let cachedReadContract = null;

/**
 * RPC Provider Management
 * Initializes and caches JSON RPC provider for blockchain read operations
 * Uses Alchemy API endpoint for reliable, scalable access
 * Singleton pattern prevents creating multiple provider instances
 */

function createJsonRpcProvider() {
  const alchemyRpcUrl = `https://${alchemyConfig.network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`;
  return new ethers.JsonRpcProvider(alchemyRpcUrl);
}

function initializeReadProvider() {
  if (cachedProvider) {
    return cachedProvider;
  }
  
  cachedProvider = createJsonRpcProvider();
  return cachedProvider;
}

export const getProvider = initializeReadProvider;

/**
 * Browser Provider (MetaMask)
 * Accesses the user's MetaMask wallet for transaction signing
 * Throws if MetaMask is not installed or available
 */

function getBrowserWalletProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask wallet not detected. Please install MetaMask browser extension to continue.');
  }
  
  return new ethers.BrowserProvider(window.ethereum);
}

export const getBrowserProvider = getBrowserWalletProvider;

/**
 * Contract Read Interface
 * Returns a contract instance bound to the read-only provider
 * Enables querying contract state without user interaction
 */

function initializeReadContract() {
  if (!CONTRACT_ADDRESS) {
    console.warn('Contract address not configured. Running in demonstration mode.');
    return null;
  }

  if (cachedReadContract) {
    return cachedReadContract;
  }

  cachedReadContract = new ethers.Contract(
    CONTRACT_ADDRESS, 
    CONTRACT_ABI, 
    getProvider()
  );

  return cachedReadContract;
}

export const getReadContract = initializeReadContract;

/**
 * Contract Write Interface
 * Returns a contract instance bound to user's wallet signer
 * Enables state-changing operations that require user approval and transaction fees
 */

async function initializeWriteContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Smart contract address not configured. Please deploy the contract first.');
  }

  const userWalletProvider = getBrowserProvider();
  const userSigningKey = await userWalletProvider.getSigner();
  
  return new ethers.Contract(
    CONTRACT_ADDRESS, 
    CONTRACT_ABI, 
    userSigningKey
  );
}

export const getWriteContract = initializeWriteContract;

/**
 * Wallet Connection Management
 * Handles MetaMask account selection and blockchain access permissions
 */

async function requestWalletConnection() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask wallet not found. Please install MetaMask browser extension first.');
  }
  
  try {
    const accountList = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    return accountList[0];
  } catch (connectionError) {
    throw new Error(`Failed to connect wallet: ${connectionError.message}`);
  }
}

async function fetchConnectedAccount() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const accountList = await window.ethereum.request({
      method: 'eth_accounts'
    });
    
    return accountList.length > 0 ? accountList[0] : null;
  } catch (fetchError) {
    console.error('Failed to fetch connected account:', fetchError);
    return null;
  }
}

async function verifyWalletConnection() {
  const connectedAccount = await fetchConnectedAccount();
  return !!connectedAccount;
}

function checkWalletInstallation() {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export const connectWallet = requestWalletConnection;
export const getAccount = fetchConnectedAccount;
export const isWalletConnected = verifyWalletConnection;
export const isWalletInstalled = checkWalletInstallation;

/**
 * Blockchain Network Information
 * Provides metadata about the connected blockchain network
 */

async function fetchNetworkMetadata() {
  const network = await getProvider().getNetwork();
  
  return {
    name: network.name,
    chainId: Number(network.chainId)
  };
}

async function fetchLatestBlockHeight() {
  return await getProvider().getBlockNumber();
}

export const getNetworkInfo = fetchNetworkMetadata;
export const getBlockNumber = fetchLatestBlockHeight;

/**
 * Account Balance Queries
 * Retrieves the native currency balance for a given address in MATIC
 */

async function retrieveAccountBalance(walletAddress) {
  const balanceInWei = await getProvider().getBalance(walletAddress);
  return ethers.formatEther(balanceInWei);
}

export const getBalance = retrieveAccountBalance;

/**
 * Credential Hashing
 * Computes Keccak256 hash of credential data
 * Hash must match the hash generated on-chain for verification
 * Time complexity: O(n) where n is the size of serialized credential data
 */

function computeCredentialHash(credentialData) {
  const serializedJson = JSON.stringify(credentialData);
  const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(serializedJson));
  return hashBytes;
}

export const hashCredential = computeCredentialHash;

/**
 * Issuer Verification
 * Checks if an address has been granted issuer rights on the contract
 */

async function checkIssuerAuthorization(issuerAddress) {
  const contract = getReadContract();
  
  if (!contract) {
    return false;
  }
  
  try {
    const issuerRecord = await contract.authorizedIssuers(issuerAddress);
    return issuerRecord.isAuthorized;
  } catch (verificationError) {
    console.error('Issuer authorization check failed:', verificationError);
    return false;
  }
}

async function retrieveIssuerMetadata(issuerAddress) {
  const contract = getReadContract();
  
  if (!contract) {
    return null;
  }
  
  try {
    const issuerRecord = await contract.authorizedIssuers(issuerAddress);
    
    return {
      name: issuerRecord.name,
      isAuthorized: issuerRecord.isAuthorized,
      registeredAt: Number(issuerRecord.registeredAt)
    };
  } catch (fetchError) {
    console.error('Failed to fetch issuer metadata:', fetchError);
    return null;
  }
}

export const isAuthorizedIssuer = checkIssuerAuthorization;
export const getIssuerInfo = retrieveIssuerMetadata;

/**
 * Credential Issuance
 * Records a new academic credential on the blockchain
 * Creates an immutable record of the credential with associated metadata
 */

async function recordCredentialOnBlockchain(
  studentName, 
  studentDID, 
  courseName, 
  ipfsCID, 
  credentialHash
) {
  const contract = await getWriteContract();
  
  try {
    const transaction = await contract.issueCredential(
      studentName,
      studentDID,
      courseName,
      ipfsCID,
      credentialHash
    );
    
    console.log('Credential issuance transaction hash:', transaction.hash);
    
    // Wait for blockchain confirmation
    const receipt = await transaction.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    return {
      txHash: transaction.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (issuanceError) {
    throw new Error(`Failed to issue credential: ${issuanceError.message}`);
  }
}

/**
 * Credential Revocation
 * Marks a credential as revoked on the blockchain
 * Revoked credentials are no longer considered valid
 */

async function markCredentialAsRevoked(credentialHash) {
  const contract = await getWriteContract();
  
  try {
    const transaction = await contract.revokeCredential(credentialHash);
    const receipt = await transaction.wait();
    
    return {
      txHash: transaction.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (revocationError) {
    throw new Error(`Failed to revoke credential: ${revocationError.message}`);
  }
}

/**
 * Issuer Authorization
 * Grants issuer rights to an address (admin operation)
 */

async function authorizeNewIssuer(issuerAddress, issuerDisplayName) {
  const contract = await getWriteContract();
  
  try {
    const transaction = await contract.authorizeIssuer(issuerAddress, issuerDisplayName);
    const receipt = await transaction.wait();
    
    return {
      txHash: transaction.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (authError) {
    throw new Error(`Failed to authorize issuer: ${authError.message}`);
  }
}

export const issueCredentialOnChain = recordCredentialOnBlockchain;
export const revokeCredentialOnChain = markCredentialAsRevoked;
export const authorizeIssuerOnChain = authorizeNewIssuer;

/**
 * Credential Retrieval and Verification
 * Queries the blockchain for credential details and validity status
 */

async function fetchCredentialFromBlockchain(credentialHash) {
  const contract = getReadContract();
  
  if (!contract) {
    return null;
  }
  
  try {
    const credentialData = await contract.getCredential(credentialHash);
    
    return {
      issuer: credentialData.issuer,
      studentName: credentialData.studentName,
      studentDID: credentialData.studentDID,
      courseName: credentialData.courseName,
      credHash: credentialData.credHash,
      ipfsCID: credentialData.ipfsCID,
      timestamp: Number(credentialData.timestamp),
      isValid: credentialData.isValid,
      isRevoked: credentialData.isRevoked
    };
  } catch (retrievalError) {
    console.error('Failed to fetch credential from blockchain:', retrievalError);
    return null;
  }
}

async function validateCredentialAuthenticity(credentialHash) {
  const contract = getReadContract();
  
  if (!contract) {
    return {
      valid: false,
      message: 'Smart contract interface not available'
    };
  }
  
  try {
    const isValid = await contract.isValidCredential(credentialHash);
    const credentialRecord = await contract.getCredential(credentialHash);
    
    // Check if credential exists by verifying timestamp is non-zero
    if (credentialRecord.timestamp === 0n) {
      return {
        valid: false,
        message: 'Credential does not exist on blockchain'
      };
    }
    
    return {
      valid: isValid,
      credential: {
        issuer: credentialRecord.issuer,
        studentName: credentialRecord.studentName,
        studentDID: credentialRecord.studentDID,
        courseName: credentialRecord.courseName,
        timestamp: Number(credentialRecord.timestamp),
        ipfsCID: credentialRecord.ipfsCID
      }
    };
  } catch (verifyError) {
    console.error('Credential verification failed:', verifyError);
    return {
      valid: false,
      message: 'Verification operation failed'
    };
  }
}

/**
 * Credential Discovery
 * Retrieves all credential identifiers from the blockchain
 * Performance note: O(n) operation - may be expensive for large datasets
 */

async function fetchAllCredentialIdentifiers() {
  const contract = getReadContract();
  
  if (!contract) {
    return [];
  }
  
  try {
    const credentialHashes = await contract.getAllCredentialHashes();
    return credentialHashes;
  } catch (queryError) {
    console.error('Failed to fetch credential hashes:', queryError);
    return [];
  }
}

export const getCredentialFromChain = fetchCredentialFromBlockchain;
export const verifyCredentialOnChain = validateCredentialAuthenticity;
export const getAllCredentialHashes = fetchAllCredentialIdentifiers;

/**
 * MetaMask Event Listeners
 * Responds to wallet and network changes
 */

function subscribeToAccountChanges(changeCallback) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', changeCallback);
  }
}

function subscribeToNetworkChanges(changeCallback) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', changeCallback);
  }
}

export const onAccountChange = subscribeToAccountChanges;
export const onNetworkChange = subscribeToNetworkChanges;

/**
 * Network Switching
 * Switches MetaMask to Polygon network
 * Prompts user to add Polygon if not already configured
 */

async function switchToPolygonNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask extension not found. Please install MetaMask first.');
  }
  
  const POLYGON_CHAIN_ID = '0x89'; // Decimal 137 in hexadecimal format
  
  try {
    // Try to switch to Polygon if already configured
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }]
    });
  } catch (switchError) {
    // Chain not yet added to MetaMask - add it now
    if (switchError.code === 4902) {
      try {
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
      } catch (addError) {
        throw new Error(`Failed to add Polygon network: ${addError.message}`);
      }
    } else {
      throw new Error(`Failed to switch to Polygon: ${switchError.message}`);
    }
  }
}

export const switchToPolygon = switchToPolygonNetwork;

/**
 * Module Export
 * Public API for blockchain interactions
 */
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
