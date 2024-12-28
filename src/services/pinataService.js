import axios from 'axios';
import { pinataConfig } from '../config/services';

// IPFS pinning service through Pinata - decentralized content storage
// Implements redundant gateway strategy for reliable retrieval
// Time complexity: O(1) for individual operations, O(n) for batch operations

const PINATA_ENDPOINT = 'https://api.pinata.cloud';
const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

// Publish JSON data to IPFS network via Pinata pinning service
// Content addressed by cryptographic hash, immutable storage
// Time complexity: O(1) request, variable network latency
export const uploadJSON = async (jsonData, uploadOptions = {}) => {
  const requestBody = {
    pinataContent: jsonData,
    pinataMetadata: {
      name: uploadOptions.name || `credential-${Date.now()}`,
      keyvalues: uploadOptions.metadata || {}
    },
    pinataOptions: {
      cidVersion: 1
    }
  };

  try {
    const uploadResponse = await axios.post(
      `${PINATA_ENDPOINT}/pinning/pinJSONToIPFS`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );

    console.log('[Pinata] JSON content pinned successfully:', uploadResponse.data.IpfsHash);
    return uploadResponse.data;
  } catch (err) {
    console.error('[Pinata] JSON upload error:', err.response?.data || err.message);
    throw new Error(
      `IPFS JSON upload failed: ${err.response?.data?.message || err.message}`
    );
  }
};

// Upload file to IPFS via Pinata with metadata tracking
// Supports arbitrary file types with custom metadata
// Time complexity: O(n) where n is file size
export const uploadFile = async (fileObject, uploadOptions = {}) => {
  const multipartData = new FormData();
  multipartData.append('file', fileObject);
  
  const metadataConfig = JSON.stringify({
    name: uploadOptions.name || fileObject.name,
    keyvalues: uploadOptions.metadata || {}
  });
  multipartData.append('pinataMetadata', metadataConfig);
  
  const pinningConfig = JSON.stringify({
    cidVersion: 1
  });
  multipartData.append('pinataOptions', pinningConfig);

  try {
    const uploadResponse = await axios.post(
      `${PINATA_ENDPOINT}/pinning/pinFileToIPFS`,
      multipartData,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        },
        maxBodyLength: Infinity
      }
    );

    console.log('[Pinata] File uploaded successfully:', uploadResponse.data.IpfsHash);
    return uploadResponse.data;
  } catch (err) {
    console.error('[Pinata] File upload error:', err.response?.data || err.message);
    throw new Error(
      `IPFS file upload failed: ${err.response?.data?.message || err.message}`
    );
  }
};

// Retrieve IPFS content by hash using gateway fallback strategy
// Tries multiple gateways for redundancy and availability
// Time complexity: O(k) where k is number of gateway retries
export const fetchByCID = async (contentHash) => {
  const gatewayEndpoints = [
    `${IPFS_GATEWAY_URL}${contentHash}`,
    `https://ipfs.io/ipfs/${contentHash}`,
    `https://cloudflare-ipfs.com/ipfs/${contentHash}`,
    `https://dweb.link/ipfs/${contentHash}`
  ];

  for (const gatewayUrl of gatewayEndpoints) {
    try {
      const retrievalResponse = await axios.get(gatewayUrl, { timeout: 10000 });
      console.log('[IPFS] Content retrieved from gateway:', gatewayUrl);
      return retrievalResponse.data;
    } catch (err) {
      console.warn(`[IPFS] Gateway attempt failed (${gatewayUrl}):`, err.message);
      continue;
    }
  }

  throw new Error('IPFS content retrieval failed - no available gateways');
};

// List pinned content with optional filtering parameters
// Useful for auditing and managing stored credentials
// Time complexity: O(1) API call, O(n) for response processing
export const getPinList = async (filterOptions = {}) => {
  try {
    const pinnedListResponse = await axios.get(
      `${PINATA_ENDPOINT}/data/pinList`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        },
        params: filterOptions
      }
    );
    return pinnedListResponse.data;
  } catch (err) {
    console.error('[Pinata] Pin list retrieval failed:', err.message);
    throw err;
  }
};

// Unpin and remove content from Pinata node
// Time complexity: O(1)
export const unpin = async (contentHash) => {
  try {
    await axios.delete(
      `${PINATA_ENDPOINT}/pinning/unpin/${contentHash}`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );
    console.log('[Pinata] Content unpinned successfully:', contentHash);
  } catch (err) {
    console.error('[Pinata] Unpin operation failed:', err.message);
    throw err;
  }
};

// Generate publicly accessible IPFS gateway URL
// Time complexity: O(1) string concatenation
export const getGatewayUrl = (contentHash) => {
  return `${IPFS_GATEWAY_URL}${contentHash}`;
};

// Validate Pinata API authentication and connectivity
// Time complexity: O(1)
export const testConnection = async () => {
  try {
    const authTestResponse = await axios.get(
      `${PINATA_ENDPOINT}/data/testAuthentication`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );
    console.log('[Pinata] Connection validated successfully:', authTestResponse.data);
    return true;
  } catch (err) {
    console.error('[Pinata] Connection validation failed:', err.message);
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
