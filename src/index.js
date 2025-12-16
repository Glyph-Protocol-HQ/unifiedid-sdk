/**
 * UnifiedID SDK
 * Minimal contract wrapper for UnifiedIDRegistry
 */

// Export UnifiedIDContract class
export { UnifiedIDContract } from './UnifiedIDContract.js';

// Export validation utilities
export {
  validateUnifiedId,
  validateAddress,
  normalizeUnifiedId,
  normalizeAddress
} from './utils/validation.js';

// Export error classes
export {
  UnifiedIDError,
  ValidationError,
  ContractError,
  EncodingError
} from './utils/errors.js';

// Export encoding utilities
export {
  encodeCreateUnifiedID,
  decodeCreateUnifiedID,
  getFunctionSelector,
  isCreateUnifiedIDCalldata
} from './utils/encoding.js';

// Export constants and network utilities
export {
  NETWORK_CONFIGS,
  getNetworkConfig,
  getSupportedChainIds,
  isNetworkSupported,
  getDeployedNetworks,
  GAS_LIMITS
} from './constants.js';

// Export ABI as UnifiedIDRegistryABI
export { default as UnifiedIDRegistryABI } from './abi/UnifiedIDRegistry.json' with { type: 'json' };

// Export SDK version
export const VERSION = '1.0.0';

