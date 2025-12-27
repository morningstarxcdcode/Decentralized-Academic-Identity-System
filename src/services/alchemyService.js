import { ethers } from 'ethers';
import { alchemyConfig } from '../config/services';

let provider = null;
let signer = null;

/**
 * Get or create the Alchemy JSON-RPC provider
 * @returns {ethers.JsonRpcProvider}
 */
export const getProvider = () => {
  if (!provider) {
    const rpcUrl = alchemyConfig.getRpcUrl();
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
};

/**
 * Get signer from browser wallet (MetaMask)
 * @returns {Promise<ethers.Signer>}
 */
export const getSigner = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }
  
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  signer = await browserProvider.getSigner();
  return signer;
};

/**
 * Connect to MetaMask and get account address
 * @returns {Promise<string>}
 */
export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }
  
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  return accounts[0];
};

/**
 * Get current connected account
 * @returns {Promise<string|null>}
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
 * Get contract instance
 * @param {string} address - Contract address
 * @param {Array} abi - Contract ABI
 * @param {boolean} withSigner - Whether to connect with signer
 * @returns {Promise<ethers.Contract>}
 */
export const getContract = async (address, abi, withSigner = false) => {
  if (withSigner) {
    const signerInstance = await getSigner();
    return new ethers.Contract(address, abi, signerInstance);
  }
  return new ethers.Contract(address, abi, getProvider());
};

/**
 * Get network information
 * @returns {Promise<{name: string, chainId: bigint}>}
 */
export const getNetworkInfo = async () => {
  const network = await getProvider().getNetwork();
  return {
    name: network.name,
    chainId: network.chainId
  };
};

/**
 * Get current block number
 * @returns {Promise<number>}
 */
export const getBlockNumber = async () => {
  return await getProvider().getBlockNumber();
};

/**
 * Get account balance
 * @param {string} address - Wallet address
 * @returns {Promise<string>} Balance in ETH/MATIC
 */
export const getBalance = async (address) => {
  const balance = await getProvider().getBalance(address);
  return ethers.formatEther(balance);
};

/**
 * Listen for account changes
 * @param {function} callback - Callback function
 */
export const onAccountChange = (callback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 * @param {function} callback - Callback function
 */
export const onNetworkChange = (callback) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Check if MetaMask is installed
 * @returns {boolean}
 */
export const isWalletInstalled = () => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

/**
 * Hash data using keccak256
 * @param {string} data - Data to hash
 * @returns {string}
 */
export const hashData = (data) => {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
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
