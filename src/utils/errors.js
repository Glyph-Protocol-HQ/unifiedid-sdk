/**
 * Base error class for all UnifiedID SDK errors.
 * @class UnifiedIDError
 * @extends Error
 */
export class UnifiedIDError extends Error {
  /**
   * Creates an instance of UnifiedIDError.
   * @param {string} message - Error message
   * @param {string} code - Error code
   */
  constructor(message, code) {
    super(message);
    this.name = 'UnifiedIDError';
    this.code = code;
  }
}

/**
 * Error class for validation-related errors.
 * @class ValidationError
 * @extends UnifiedIDError
 */
export class ValidationError extends UnifiedIDError {
  /**
   * Creates an instance of ValidationError.
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error class for contract-related errors.
 * @class ContractError
 * @extends UnifiedIDError
 */
export class ContractError extends UnifiedIDError {
  /**
   * Creates an instance of ContractError.
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 'CONTRACT_ERROR');
    this.name = 'ContractError';
  }
}

/**
 * Error class for encoding-related errors.
 * @class EncodingError
 * @extends UnifiedIDError
 */
export class EncodingError extends UnifiedIDError {
  /**
   * Creates an instance of EncodingError.
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 'ENCODING_ERROR');
    this.name = 'EncodingError';
  }
}

