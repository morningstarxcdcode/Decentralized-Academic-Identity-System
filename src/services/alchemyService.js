import { ethers } from 'ethers';
import { alchemyConfig } from '../config/services';

// Alchemy blockchain integration layer - provides read/write capabilities
// Manages wallet connections and transaction signing through MetaMask

let cachedProviderInstance = null;
let cachedSignerInstance = null;

// Singleton provider instance - reduces redundant RPC connection setup
// Time complexity: O(1) initialization and lookup

export const getProvider = () => {
  if (cachedProviderInstance) {
    return cachedProviderInstance;
  }

  const rpcEndpoint = alchemyConfig.getRpcUrl();
  cachedProviderInstance = new ethers.JsonRpcProvider(rpcEndpoint);
  
  return cachedProviderInstance;
};

// Acquire signer from connected wallet for transaction authorization
// Time complexity: O(1) lookup after initial connection

export const getSigner = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not detected. Install MetaMask for transaction signing.');
  }
  
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  cachedSignerInstance = await browserProvider.getSigner();
  
  return cachedSignerInstance;
};

// Initiate wallet connection through MetaMask UI
// Prompts user to select account if multiple exist

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not detected. Install MetaMask for transaction signing.');
  }
  
  const connectedAccounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  return connectedAccounts[0];
};

// Retrieve currently connected account without user interaction
// Returns null if no wallet connected

export const getAccount = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  const connectedAccounts = await window.ethereum.request({
    method: 'eth_accounts'
  });
  
  return connectedAccounts[0] || null;
};

// Factory function for contract instances - supports both read and write operations
// withSigner parameter determines transaction-signing capability

export const getContract = async (contractAddress, contractABI, withSigner = false) => {
  if (withSigner) {
    const signerInstance = await getSigner();
    return new ethers.Contract(contractAddress, contractABI, signerInstance);
  }
  
  return new ethers.Contract(contractAddress, contractABI, getProvider());
};

// Fetch blockchain network metadata - chain ID and name
// Time complexity: O(1)

export const getNetworkInfo = async () => {
  const network = await getProvider().getNetwork();
  
  return {
    name: network.name,
    chainId: network.chainId
  };
};

// Get current blockchain height in blocks
// Time complexity: O(1)

export const getBlockNumber = async () => {
  return await getProvider().getBlockNumber();
};

// Query account balance in native network currency
// Time complexity: O(1)

export const getBalance = async (accountAddress) => {
  const balanceInWei = await getProvider().getBalance(accountAddress);
  return ethers.formatEther(balanceInWei);
};

// Subscribe to account switching events
// Fired when user changes active account in MetaMask

export const onAccountChange = (accountChangeHandler) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', accountChangeHandler);
  }
};

// Subscribe to network switching events
// Called when user changes blockchain network

export const onNetworkChange = (networkChangeHandler) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', networkChangeHandler);
  }
};

// Detect MetaMask installation
// Time complexity: O(1)

export const isWalletInstalled = () => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

// Generate hash of data using keccak256 algorithm
// Consistent with Solidity's implementation for contract verification

export const hashData = (dataObject) => {
  const jsonString = JSON.stringify(dataObject);
  return ethers.keccak256(
    ethers.toUtf8Bytes(jsonString)
  );
};

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
