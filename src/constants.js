/**
 * @typedef {Object} NetworkConfig
 * @property {string} name - Network name
 * @property {string|null} blockExplorer - Block explorer URL (null if not available)
 * @property {Object} nativeCurrency - Native currency information
 * @property {string} nativeCurrency.name - Currency name
 * @property {string} nativeCurrency.symbol - Currency symbol
 * @property {number} nativeCurrency.decimals - Currency decimals
 */

/**
 * Network configurations for supported chains.
 * Note: rpcURL and contractAddress are not stored here for security reasons.
 * Users must provide these during SDK initialization.
 * @type {Object<number, NetworkConfig>}
 */
export const NETWORK_CONFIGS = {
  80001: {
    name: 'Polygon Mumbai',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  137: {
    name: 'Polygon',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  1337: {
    name: 'Hardhat Local',
    blockExplorer: null,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  11155111: {
    name: 'Ethereum Sepolia',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  84532: {
    name: 'Base Sepolia',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  8453: {
    name: 'Base Mainnet',
    blockExplorer: 'https://basescan.org/',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
};

/**
 * Gas limits for contract operations.
 * @type {Object<string, number>}
 */
export const GAS_LIMITS = {
  CREATE_UNIFIED_ID: 100000,
  BUFFER_PERCENTAGE: 20
};

/**
 * Gets the network configuration for a given chain ID.
 * @param {number|string} chainId - The chain ID
 * @returns {NetworkConfig} Network configuration object
 * @throws {Error} If chain ID is not supported
 */
export function getNetworkConfig(chainId) {
  const config = NETWORK_CONFIGS[chainId];
  if (!config) {
    const supportedIds = getSupportedChainIds().join(', ');
    throw new Error(
      `Chain ID ${chainId} is not supported. Supported chain IDs: ${supportedIds}`
    );
  }
  return config;
}

/**
 * Gets an array of all supported chain IDs.
 * @returns {number[]} Array of supported chain IDs
 */
export function getSupportedChainIds() {
  return Object.keys(NETWORK_CONFIGS).map(Number);
}

/**
 * Checks if a network is supported.
 * @param {number|string} chainId - The chain ID to check
 * @returns {boolean} True if network is supported
 */
export function isNetworkSupported(chainId) {
  return NETWORK_CONFIGS[chainId] !== undefined;
}

/**
 * Gets all supported networks.
 * @returns {Array<{ chainId: number, name: string }>} Array of supported network info
 */
export function getDeployedNetworks() {
  return Object.entries(NETWORK_CONFIGS)
    .map(([chainId, config]) => ({
      chainId: Number(chainId),
      name: config.name
    }));
}

