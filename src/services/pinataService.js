import axios from 'axios';
import { pinataConfig } from '../config/services';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload JSON data to Pinata IPFS
 * Uses JWT authentication for secure uploads
 */
export const uploadJSON = async (data, options = {}) => {
  const body = {
    pinataContent: data,
    pinataMetadata: {
      name: options.name || `credential-${Date.now()}`,
      keyvalues: options.metadata || {}
    },
    pinataOptions: {
      cidVersion: 1
    }
  };

  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );

    console.log('[Pinata] Successfully uploaded JSON:', response.data.IpfsHash);
    return response.data;
  } catch (error) {
    console.error('[Pinata] Upload failed:', error.response?.data || error.message);
    throw new Error(`IPFS upload failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Upload a file to Pinata IPFS
 */
export const uploadFile = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const metadata = JSON.stringify({
    name: options.name || file.name,
    keyvalues: options.metadata || {}
  });
  formData.append('pinataMetadata', metadata);
  
  const pinataOptions = JSON.stringify({
    cidVersion: 1
  });
  formData.append('pinataOptions', pinataOptions);

  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        },
        maxBodyLength: Infinity
      }
    );

    console.log('[Pinata] Successfully uploaded file:', response.data.IpfsHash);
    return response.data;
  } catch (error) {
    console.error('[Pinata] File upload failed:', error.response?.data || error.message);
    throw new Error(`IPFS file upload failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Fetch content from IPFS by CID using multiple gateways
 */
export const fetchByCID = async (cid) => {
  const gateways = [
    `${PINATA_GATEWAY}${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  for (const gateway of gateways) {
    try {
      const response = await axios.get(gateway, { timeout: 10000 });
      console.log('[IPFS] Successfully fetched from:', gateway);
      return response.data;
    } catch (error) {
      console.warn(`[IPFS] Failed to fetch from ${gateway}:`, error.message);
      continue;
    }
  }

  throw new Error('Failed to fetch content from IPFS - all gateways failed');
};

/**
 * Get pin list from Pinata
 */
export const getPinList = async (filters = {}) => {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/pinList`, {
      headers: {
        'Authorization': `Bearer ${pinataConfig.jwt}`
      },
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('[Pinata] Failed to get pin list:', error.message);
    throw error;
  }
};

/**
 * Unpin content from Pinata
 */
export const unpin = async (cid) => {
  try {
    await axios.delete(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
      headers: {
        'Authorization': `Bearer ${pinataConfig.jwt}`
      }
    });
    console.log('[Pinata] Successfully unpinned:', cid);
  } catch (error) {
    console.error('[Pinata] Failed to unpin:', error.message);
    throw error;
  }
};

/**
 * Generate gateway URL for a CID
 */
export const getGatewayUrl = (cid) => {
  return `${PINATA_GATEWAY}${cid}`;
};

/**
 * Test Pinata connection
 */
export const testConnection = async () => {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: {
        'Authorization': `Bearer ${pinataConfig.jwt}`
      }
    });
    console.log('[Pinata] Connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('[Pinata] Connection test failed:', error.message);
    return false;
  }
};

export const pinataService = {
  uploadJSON,
  uploadFile,
  fetchByCID,
  getPinList,
  unpin,
  getGatewayUrl,
  testConnection
};

export default pinataService;
