import axios from 'axios';
import { pinataConfig } from '../config/services';

/**
 * IPFS Pinning Service via Pinata
 * Provides decentralized content storage with redundant gateway retrieval
 * Enables immutable, distributed storage of academic credentials
 * Performance: O(1) upload, O(k) retrieval where k is gateway count
 */

const PINATA_API_ENDPOINT = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

/**
 * JSON Data Upload to IPFS
 * Stores serialized credential data on IPFS network
 * Content is addressed by cryptographic hash (CID)
 */

async function uploadJsonDataToIPFS(dataObject, uploadMetadata = {}) {
  const uploadPayload = {
    pinataContent: dataObject,
    pinataMetadata: {
      name: uploadMetadata.name || `credential-${Date.now()}`,
      keyvalues: uploadMetadata.tags || {}
    },
    pinataOptions: {
      cidVersion: 1
    }
  };

  try {
    const responseData = await axios.post(
      `${PINATA_API_ENDPOINT}/pinning/pinJSONToIPFS`,
      uploadPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );

    console.log('Successfully pinned JSON to IPFS:', responseData.data.IpfsHash);
    return responseData.data;
  } catch (uploadError) {
    console.error('JSON upload to IPFS failed:', uploadError.response?.data || uploadError.message);
    throw new Error(
      `Failed to upload credential to IPFS: ${uploadError.response?.data?.message || uploadError.message}`
    );
  }
}

/**
 * File Upload to IPFS
 * Stores binary files (PDFs, images, etc.) on IPFS network
 * Supports metadata tagging and custom naming
 */

async function uploadFileToIPFS(fileBlob, uploadMetadata = {}) {
  const formData = new FormData();
  formData.append('file', fileBlob);
  
  const metadataJson = JSON.stringify({
    name: uploadMetadata.name || fileBlob.name,
    keyvalues: uploadMetadata.tags || {}
  });
  formData.append('pinataMetadata', metadataJson);
  
  const pinningJson = JSON.stringify({
    cidVersion: 1
  });
  formData.append('pinataOptions', pinningJson);

  try {
    const responseData = await axios.post(
      `${PINATA_API_ENDPOINT}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        },
        maxBodyLength: Infinity
      }
    );

    console.log('Successfully uploaded file to IPFS:', responseData.data.IpfsHash);
    return responseData.data;
  } catch (uploadError) {
    console.error('File upload to IPFS failed:', uploadError.response?.data || uploadError.message);
    throw new Error(
      `Failed to upload file to IPFS: ${uploadError.response?.data?.message || uploadError.message}`
    );
  }
}

/**
 * Content Retrieval via IPFS Gateway
 * Implements fallback strategy across multiple gateway providers
 * Ensures high availability and redundancy for credential access
 */

async function retrieveContentFromIPFS(contentHash) {
  // List of IPFS gateway endpoints to try in sequence
  const ipfsGateways = [
    `${PINATA_GATEWAY_URL}${contentHash}`,
    `https://ipfs.io/ipfs/${contentHash}`,
    `https://cloudflare-ipfs.com/ipfs/${contentHash}`,
    `https://dweb.link/ipfs/${contentHash}`
  ];

  // Attempt retrieval from each gateway until success
  for (const gatewayUrl of ipfsGateways) {
    try {
      const response = await axios.get(gatewayUrl, { timeout: 10000 });
      console.log('Successfully retrieved content from IPFS gateway:', gatewayUrl);
      return response.data;
    } catch (gatewayError) {
      console.warn(`IPFS gateway unavailable (${gatewayUrl}):`, gatewayError.message);
      // Continue to next gateway on failure
    }
  }

  // All gateways failed
  throw new Error('Unable to retrieve content from any IPFS gateway - please try again later');
}

/**
 * List Pinned Content
 * Retrieves inventory of all pinned files with optional filtering
 */

async function listPinnedContent(filterCriteria = {}) {
  try {
    const response = await axios.get(
      `${PINATA_API_ENDPOINT}/data/pinList`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        },
        params: filterCriteria
      }
    );
    return response.data;
  } catch (queryError) {
    console.error('Failed to retrieve pinned content list:', queryError.message);
    throw queryError;
  }
}

/**
 * Unpin Content
 * Removes content from Pinata node (no longer accessible via gateway)
 */

async function unpinContentFromIPFS(contentHash) {
  try {
    await axios.delete(
      `${PINATA_API_ENDPOINT}/pinning/unpin/${contentHash}`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );
    console.log('Successfully unpinned content:', contentHash);
  } catch (unpinError) {
    console.error('Failed to unpin content:', unpinError.message);
    throw unpinError;
  }
}

/**
 * Gateway URL Generation
 * Creates public, IPFS-compliant URL for content retrieval
 */

function generateGatewayURL(contentHash) {
  return `${PINATA_GATEWAY_URL}${contentHash}`;
}

/**
 * Connection Validation
 * Verifies Pinata API authentication and service availability
 */

async function validatePinataConnection() {
  try {
    const response = await axios.get(
      `${PINATA_API_ENDPOINT}/data/testAuthentication`,
      {
        headers: {
          'Authorization': `Bearer ${pinataConfig.jwt}`
        }
      }
    );
    console.log('Pinata connection validated successfully');
    return true;
  } catch (connectionError) {
    console.error('Pinata connection validation failed:', connectionError.message);
    return false;
  }
}

// Export public API
export const uploadJSON = uploadJsonDataToIPFS;
export const uploadFile = uploadFileToIPFS;
export const fetchByCID = retrieveContentFromIPFS;
export const getPinList = listPinnedContent;
export const unpin = unpinContentFromIPFS;
export const getGatewayUrl = generateGatewayURL;
export const testConnection = validatePinataConnection;

/**
 * Module Export
 */
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
