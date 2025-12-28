import { ethers } from 'ethers';
import { alchemyConfig } from '../config/services';

/**
 * Alchemy Blockchain Integration Service
 * Provides unified interface for blockchain read/write operations via Alchemy API
 * Manages wallet connections and transaction signing through MetaMask
 */

let cachedProviderInstance = null;
let cachedSignerInstance = null;

/**
 * JSON RPC Provider
 * Singleton pattern ensures only one provider instance exists
 * Handles all read-only blockchain operations
 */

function initializeJsonRpcProvider() {
  if (cachedProviderInstance) {
    return cachedProviderInstance;
  }

  const rpcEndpoint = alchemyConfig.getRpcUrl();
  cachedProviderInstance = new ethers.JsonRpcProvider(rpcEndpoint);
  
  return cachedProviderInstance;
}

/**
 * Signer Instance
 * Acquires signer from user's MetaMask wallet for transaction authorization
 */

async function getSignerFromWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask wallet not detected. Please install MetaMask to enable transactions.');
  }
  
  const walletProvider = new ethers.BrowserProvider(window.ethereum);
  cachedSignerInstance = await walletProvider.getSigner();
  
  return cachedSignerInstance;
}

/**
 * Wallet Connection Management
 */

async function initiateWalletConnection() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected. Install MetaMask to connect your wallet.');
  }
  
  const accountList = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  return accountList[0];
}

async function retrieveConnectedAccount() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  const accountList = await window.ethereum.request({
    method: 'eth_accounts'
  });
  
  return accountList[0] || null;
}

/**
 * Smart Contract Interface Factory
 * Creates contract instance with optional signer for state-modifying transactions
 */

async function createContractInterface(contractAddress, contractABI, includeSignerForWrites = false) {
  if (includeSignerForWrites) {
    const walletSigner = await getSignerFromWallet();
    return new ethers.Contract(contractAddress, contractABI, walletSigner);
  }
  
  return new ethers.Contract(contractAddress, contractABI, initializeJsonRpcProvider());
}

/**
 * Blockchain Information Queries
 */

async function fetchNetworkInformation() {
  const network = await initializeJsonRpcProvider().getNetwork();
  
  return {
    name: network.name,
    chainId: network.chainId
  };
}

async function fetchLatestBlockHeight() {
  return await initializeJsonRpcProvider().getBlockNumber();
}

async function fetchAccountBalance(walletAddress) {
  const balanceInWei = await initializeJsonRpcProvider().getBalance(walletAddress);
  return ethers.formatEther(balanceInWei);
}

/**
 * Event Listeners for MetaMask
 */

function listenToAccountChanges(changeHandler) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', changeHandler);
  }
}

function listenToNetworkChanges(changeHandler) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', changeHandler);
  }
}

/**
 * Utility Functions
 */

function checkWalletAvailability() {
  return typeof window !== 'undefined' && !!window.ethereum;
}

function computeDataHash(dataObject) {
  const jsonSerialized = JSON.stringify(dataObject);
  return ethers.keccak256(ethers.toUtf8Bytes(jsonSerialized));
}

// Export public API
export const getProvider = initializeJsonRpcProvider;
export const getSigner = getSignerFromWallet;
export const connectWallet = initiateWalletConnection;
export const getAccount = retrieveConnectedAccount;
export const getContract = createContractInterface;
export const getNetworkInfo = fetchNetworkInformation;
export const getBlockNumber = fetchLatestBlockHeight;
export const getBalance = fetchAccountBalance;
export const onAccountChange = listenToAccountChanges;
export const onNetworkChange = listenToNetworkChanges;
export const isWalletInstalled = checkWalletAvailability;
export const hashData = computeDataHash;

/**
 * Module Export
 */
export const alchemyService = {
  getProvider,
  getSigner,
  connectWallet,
  getAccount,
  getContract,
  getNetworkInfo,
  getBlockNumber,
  getBalance,
  onAccountChange,
  onNetworkChange,
  isWalletInstalled,
  hashData
};

export default alchemyService;
  onAccountChange,
  onNetworkChange,
  isWalletInstalled,
  hashData
};

export default alchemyService;
