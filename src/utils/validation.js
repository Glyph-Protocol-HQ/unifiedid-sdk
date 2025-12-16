/**
 * Validates a UnifiedID string.
 * @param {string} unifiedId - The UnifiedID to validate
 * @returns {{ valid: boolean, error?: string }} Validation result with error message if invalid
 */
export function validateUnifiedId(unifiedId) {
  // Check if string and not empty
  if (typeof unifiedId !== 'string' || unifiedId.trim().length === 0) {
    return { valid: false, error: 'UnifiedID must be a non-empty string' };
  }

  // Check length >= 4 and <= 16
  if (unifiedId.length < 4 || unifiedId.length > 16) {
    return { valid: false, error: 'UnifiedID must be between 4 and 16 characters' };
  }

  // Check matches regex: /^[a-z0-9]{4,16}$/
  if (!/^[a-z0-9]{4,16}$/.test(unifiedId)) {
    return { valid: false, error: 'UnifiedID must contain only lowercase letters and numbers' };
  }

  return { valid: true };
}

/**
 * Validates an Ethereum address.
 * @param {string} address - The address to validate
 * @returns {{ valid: boolean, error?: string }} Validation result with error message if invalid
 */
export function validateAddress(address) {
  // Check if string and not empty
  if (typeof address !== 'string' || address.trim().length === 0) {
    return { valid: false, error: 'Address must be a non-empty string' };
  }

  // Check matches regex: /^0x[a-fA-F0-9]{40}$/
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: false, error: 'Address must be a valid Ethereum address (0x followed by 40 hex characters)' };
  }

  return { valid: true };
}

/**
 * Validates calldata for contract interactions.
 * @param {string} calldata - The calldata to validate
 * @returns {{ valid: boolean, error?: string }} Validation result with error message if invalid
 */
export function validateCalldata(calldata) {
  // Check if string and not empty
  if (typeof calldata !== 'string' || calldata.trim().length === 0) {
    return { valid: false, error: 'Calldata must be a non-empty string' };
  }

  // Check starts with '0x'
  if (!calldata.startsWith('0x')) {
    return { valid: false, error: 'Calldata must start with 0x' };
  }

  // Check matches hex regex: /^0x[a-fA-F0-9]*$/
  if (!/^0x[a-fA-F0-9]*$/.test(calldata)) {
    return { valid: false, error: 'Calldata must contain only hexadecimal characters' };
  }

  // Check length >= 10
  if (calldata.length < 10) {
    return { valid: false, error: 'Calldata must be at least 10 characters long (including 0x prefix)' };
  }

  return { valid: true };
}

/**
 * Normalizes a UnifiedID by trimming and converting to lowercase.
 * @param {string} unifiedId - The UnifiedID to normalize
 * @returns {string} Normalized UnifiedID string
 */
export function normalizeUnifiedId(unifiedId) {
  return unifiedId.trim().toLowerCase();
}

/**
 * Normalizes an address by trimming whitespace.
 * @param {string} address - The address to normalize
 * @returns {string} Normalized address string
 */
export function normalizeAddress(address) {
  return address.trim();
}

