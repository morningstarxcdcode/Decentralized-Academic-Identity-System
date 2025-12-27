// Services configuration loaded from environment variables

export const pinataConfig = {
  apiKey: import.meta.env.VITE_PINATA_API_KEY,
  secretKey: import.meta.env.VITE_PINATA_SECRET_KEY,
  jwt: import.meta.env.VITE_PINATA_JWT,
  gateway: 'https://gateway.pinata.cloud/ipfs/'
};

export const alchemyConfig = {
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  network: import.meta.env.VITE_ALCHEMY_NETWORK || 'polygon-mainnet',
  getRpcUrl: () => {
    const network = alchemyConfig.network;
    return `https://${network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`;
  }
};

export const polygonscanConfig = {
  apiKey: import.meta.env.VITE_POLYGONSCAN_API_KEY
};

// Validate configuration on load
export const validateConfig = () => {
  const errors = [];
  
  if (!pinataConfig.jwt) {
    errors.push('Missing VITE_PINATA_JWT');
  }
  
  if (!alchemyConfig.apiKey) {
    errors.push('Missing VITE_ALCHEMY_API_KEY');
  }
  
  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
  
  return errors.length === 0;
};
