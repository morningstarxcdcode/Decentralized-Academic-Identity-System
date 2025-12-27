/**
 * MockIPFSService.js
 * Simulates hashing and "pinning" data to IPFS.
 * In production, this would use `ipfs-http-client` or Pinata API.
 */

// Simple mock hash function (not crypto secure, just for ID)
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
};

export const ipfsService = {
  /**
   * "Uploads" a file or JSON to mock storage.
   * Returns a mock CID (Content Identifier) and the File Hash.
   */
  upload: async (data) => {
    console.log("[IPFS] Uploading data...", data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const jsonString = JSON.stringify(data);
    const mockHash = "0x" + simpleHash(jsonString + Date.now()).padStart(64, '0');
    const mockCID = "Qm" + simpleHash(jsonString).repeat(4).substring(0, 44);

    // Store in localStorage to persist across reloads for the demo
    const storageKey = `ipfs_${mockCID}`;
    localStorage.setItem(storageKey, jsonString);

    return {
      cid: mockCID,
      hash: mockHash,
      url: `https://fake-ipfs.io/ipfs/${mockCID}`
    };
  },

  /**
   * Retrieves data from mock storage using CID.
   */
  fetch: async (cid) => {
    console.log("[IPFS] Fetching CID:", cid);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const data = localStorage.getItem(`ipfs_${cid}`);
    if (!data) throw new Error("Content not found on IPFS");
    
    return JSON.parse(data);
  }
};
