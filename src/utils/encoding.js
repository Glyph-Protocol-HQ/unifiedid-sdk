import { ethers } from 'ethers';
import { validateUnifiedId, validateAddress } from './validation.js';
import { EncodingError, ValidationError } from './errors.js';

/**
 * Encodes calldata for the createUnifiedID function.
 * @param {Array|Object} abi - The ABI of the contract
 * @param {string} unifiedId - The UnifiedID to create
 * @param {string} primaryWallet - The primary wallet address
 * @returns {string} Hex-encoded calldata string
 * @throws {ValidationError} If input validation fails
 * @throws {EncodingError} If encoding fails
 */
export function encodeCreateUnifiedID(abi, unifiedId, primaryWallet) {
  try {
    // Validate inputs
    const unifiedIdValidation = validateUnifiedId(unifiedId);
    if (!unifiedIdValidation.valid) {
      throw new ValidationError(unifiedIdValidation.error);
    }

    const addressValidation = validateAddress(primaryWallet);
    if (!addressValidation.valid) {
      throw new ValidationError(addressValidation.error);
    }

    // Create ethers Interface from abi
    const iface = new ethers.utils.Interface(abi);

    // Encode function data for 'createUnifiedID' with parameters
    const calldata = iface.encodeFunctionData('createUnifiedID', [unifiedId, primaryWallet]);

    return calldata;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new EncodingError(`Failed to encode createUnifiedID: ${error.message}`);
  }
}

/**
 * Decodes calldata for the createUnifiedID function.
 * @param {Array|Object} abi - The ABI of the contract
 * @param {string} calldata - The hex-encoded calldata to decode
 * @returns {{ unifiedId: string, primaryWallet: string }} Decoded parameters
 * @throws {EncodingError} If decoding fails
 */
export function decodeCreateUnifiedID(abi, calldata) {
  try {
    // Create ethers Interface from abi
    const iface = new ethers.utils.Interface(abi);

    // Decode function data from calldata
    const decoded = iface.decodeFunctionData('createUnifiedID', calldata);

    return {
      unifiedId: decoded[0],
      primaryWallet: decoded[1]
    };
  } catch (error) {
    throw new EncodingError(`Failed to decode createUnifiedID calldata: ${error.message}`);
  }
}

/**
 * Extracts the function selector from calldata.
 * @param {string} calldata - The hex-encoded calldata
 * @returns {string} Function selector (0x + 8 hex characters)
 * @throws {EncodingError} If input is invalid
 */
export function getFunctionSelector(calldata) {
  try {
    // Check calldata starts with '0x'
    if (!calldata.startsWith('0x')) {
      throw new EncodingError('Calldata must start with 0x');
    }

    // Check length >= 10
    if (calldata.length < 10) {
      throw new EncodingError('Calldata must be at least 10 characters long (0x + 8 hex chars)');
    }

    // Return first 10 characters (0x + 8 hex chars)
    return calldata.substring(0, 10);
  } catch (error) {
    if (error instanceof EncodingError) {
      throw error;
    }
    throw new EncodingError(`Failed to get function selector: ${error.message}`);
  }
}

/**
 * Checks if calldata is for the createUnifiedID function.
 * @param {Array|Object} abi - The ABI of the contract
 * @param {string} calldata - The hex-encoded calldata to check
 * @returns {boolean} True if calldata is for createUnifiedID, false otherwise
 */
export function isCreateUnifiedIDCalldata(abi, calldata) {
  try {
    // Get expected selector from abi
    const iface = new ethers.utils.Interface(abi);
    const expectedSelector = iface.getSighash('createUnifiedID');

    // Get actual selector from calldata
    const actualSelector = getFunctionSelector(calldata);

    // Return boolean comparison
    return expectedSelector.toLowerCase() === actualSelector.toLowerCase();
  } catch (error) {
    // Return false if any error occurs
    return false;
  }
}

