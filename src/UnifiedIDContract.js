import { ethers } from 'ethers';
import { validateUnifiedId, validateAddress } from './utils/validation.js';
import { ContractError, ValidationError, EncodingError } from './utils/errors.js';
import { getNetworkConfig, GAS_LIMITS } from './constants.js';
import UnifiedIDRegistryABI from './abi/UnifiedIDRegistry.json' with { type: 'json' };

/**
 * UnifiedIDContract class for interacting with the UnifiedID Registry contract.
 * Provides methods to generate calldata and interact with the contract.
 * 
 * @class UnifiedIDContract
 */
export class UnifiedIDContract {
  /**
   * Creates an instance of UnifiedIDContract.
   * 
   * @param {Object} config - Configuration object
   * @param {number} [config.chainId] - Chain ID for supported network (optional, for metadata only)
   * @param {string} config.contractAddress - Contract address (required)
   * @param {string} [config.rpcURL] - RPC endpoint URL (required unless provider is provided)
   * @param {ethers.providers.Provider} [config.provider] - Custom ethers provider (optional, if provided, rpcURL not needed)
   * 
   * @throws {ValidationError} If contractAddress is not provided
   * @throws {ValidationError} If neither rpcURL nor provider is provided
   * @throws {ValidationError} If contract address is invalid
   * 
   * @example
   * // With chainId for network metadata
   * const contract = new UnifiedIDContract({
   *   chainId: 11155111,
   *   contractAddress: '0x9C0999B30a8ebd018792f6c74f11d066161FA45D',
   *   rpcURL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
   * });
   * 
   * @example
   * // Custom network without chainId
   * const contract = new UnifiedIDContract({
   *   contractAddress: '0x1234...',
   *   rpcURL: 'https://custom-rpc.com'
   * });
   * 
   * @example
   * // With MetaMask provider
   * const provider = new ethers.providers.Web3Provider(window.ethereum);
   * const contract = new UnifiedIDContract({
   *   chainId: 11155111,
   *   contractAddress: '0x9C0999B30a8ebd018792f6c74f11d066161FA45D',
   *   provider: provider
   * });
   */
  constructor(config = {}) {
    const { chainId, contractAddress, rpcURL, provider } = config;

    // Validate that contractAddress is provided
    if (!contractAddress) {
      throw new ValidationError(
        'Contract address is required. Please provide contractAddress in the configuration.'
      );
    }

    // Validate that either rpcURL or provider is provided
    if (!rpcURL && !provider) {
      throw new ValidationError(
        'Either rpcURL or provider must be provided.'
      );
    }

    // Set contractAddress
    this.contractAddress = contractAddress;

    // If chainId provided: get network config for metadata
    if (chainId) {
      const networkConfig = getNetworkConfig(chainId);
      
      // Set chainId
      this.chainId = chainId;
      
      // Set network metadata from config
      this.networkName = networkConfig.name;
      this.blockExplorer = networkConfig.blockExplorer;
      this.nativeCurrency = networkConfig.nativeCurrency;
    } else {
      // No chainId provided
      this.chainId = null;
      
      // Set defaults for network metadata
      this.networkName = 'Custom Network';
      this.blockExplorer = null;
      this.nativeCurrency = {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      };
    }

    // Set rpcURL (needed for provider creation if provider not provided)
    this.rpcURL = rpcURL || null;

    // Validate contractAddress format
    const addressValidation = validateAddress(this.contractAddress);
    if (!addressValidation.valid) {
      throw new ValidationError(
        `Invalid contract address: ${addressValidation.error}`
      );
    }

    // Setup provider: use config.provider if provided, otherwise create new JsonRpcProvider
    if (provider) {
      this.provider = provider;
    } else {
      if (!this.rpcURL) {
        throw new ValidationError(
          'rpcURL is required when provider is not provided.'
        );
      }
      this.provider = new ethers.providers.JsonRpcProvider(this.rpcURL);
    }

    // Load ABI from UnifiedIDRegistryABI
    this.abi = UnifiedIDRegistryABI;

    // Create contract instance using ethers.Contract
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.abi,
      this.provider
    );

    // Create interface using ethers.utils.Interface for encoding
    this.interface = new ethers.utils.Interface(this.abi);
  }

  /**
   * Gets the full UnifiedID data including primary wallet and creation timestamp.
   * @param {string} unifiedId - The UnifiedID to query
   * @returns {Promise<{ primaryWallet: string, createdAt: number }|null>} UnifiedID data or null if not found
   * @throws {ValidationError} If unifiedId is invalid
   * @throws {ContractError} If contract call fails (except when UnifiedID doesn't exist)
   */
  async getUnifiedID(unifiedId) {
    try {
      // Validate unifiedId using validateUnifiedId
      const validation = validateUnifiedId(unifiedId);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Call this.contract.getUnifiedID(unifiedId)
      const result = await this.contract.getUnifiedID(unifiedId);

      // Return { primaryWallet: result.primaryWallet, createdAt: result.createdAt.toNumber() }
      return {
        primaryWallet: result.primaryWallet,
        createdAt: result.createdAt.toNumber()
      };
    } catch (error) {
      // Return null if error contains 'UnifiedIdDoesNotExist'
      if (error.message && error.message.includes('UnifiedIdDoesNotExist')) {
        return null;
      }
      // Throw ContractError for other errors
      throw new ContractError(`Failed to get UnifiedID: ${error.message}`);
    }
  }

  /**
   * Checks if a UnifiedID exists in the registry.
   * @param {string} unifiedId - The UnifiedID to check
   * @returns {Promise<boolean>} True if UnifiedID exists, false otherwise
   * @throws {ValidationError} If unifiedId is invalid
   * @throws {ContractError} If contract call fails
   */
  async exists(unifiedId) {
    try {
      // Validate unifiedId
      const validation = validateUnifiedId(unifiedId);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Call this.contract.unifiedIdExists(unifiedId)
      const result = await this.contract.unifiedIdExists(unifiedId);

      // Return boolean result
      return result;
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to check UnifiedID existence: ${error.message}`);
    }
  }

  /**
   * Gets the primary wallet address for a UnifiedID.
   * @param {string} unifiedId - The UnifiedID to query
   * @returns {Promise<string|null>} Primary wallet address or null if UnifiedID doesn't exist
   * @throws {ValidationError} If unifiedId is invalid
   * @throws {ContractError} If contract call fails (except when UnifiedID doesn't exist)
   */
  async getPrimaryWallet(unifiedId) {
    try {
      // Validate unifiedId
      const validation = validateUnifiedId(unifiedId);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Call this.contract.getPrimaryWallet(unifiedId)
      const result = await this.contract.getPrimaryWallet(unifiedId);

      // Return address string
      return result;
    } catch (error) {
      // Return null if error contains 'UnifiedIdDoesNotExist'
      if (error.message && error.message.includes('UnifiedIdDoesNotExist')) {
        return null;
      }
      // Throw ContractError for other errors
      throw new ContractError(`Failed to get primary wallet: ${error.message}`);
    }
  }

  /**
   * Gets the UnifiedID associated with a wallet address.
   * @param {string} address - The wallet address to query
   * @returns {Promise<string|null>} UnifiedID string or null if wallet has no UnifiedID
   * @throws {ValidationError} If address is invalid
   * @throws {ContractError} If contract call fails
   * @note Contract returns empty string for wallets without UnifiedID. SDK converts this to null for consistency.
   */
  async getUnifiedIdByWallet(address) {
    try {
      // Validate address using validateAddress
      const validation = validateAddress(address);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Call this.contract.getUnifiedIdByWallet(address)
      const result = await this.contract.getUnifiedIdByWallet(address);

      // IMPORTANT: Check if result is empty string "" and return null if so
      if (result === '') {
        return null;
      }

      // Otherwise return result string
      return result;
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get UnifiedID by wallet: ${error.message}`);
    }
  }

  /**
   * Gets the total number of UnifiedIDs created in the registry.
   * @returns {Promise<number>} Total number of UnifiedIDs
   * @throws {ContractError} If contract call fails
   */
  async getTotalIDs() {
    try {
      // Call this.contract.totalIDs()
      const total = await this.contract.totalIDs();

      // Return total.toNumber()
      return total.toNumber();
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get total IDs: ${error.message}`);
    }
  }

  /**
   * Gets the relayer address configured in the contract.
   * @returns {Promise<string>} Relayer address
   * @throws {ContractError} If contract call fails
   */
  async getRelayerAddress() {
    try {
      // Call this.contract.relayerAddress()
      const result = await this.contract.relayerAddress();

      // Return address string
      return result;
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get relayer address: ${error.message}`);
    }
  }

  /**
   * Gets the owner address of the contract.
   * @returns {Promise<string>} Owner address
   * @throws {ContractError} If contract call fails
   */
  async getOwner() {
    try {
      // Call this.contract.owner()
      const result = await this.contract.owner();

      // Return address string
      return result;
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get owner: ${error.message}`);
    }
  }

  /**
   * Gets the network information from the provider.
   * @returns {Promise<{ chainId: number, name: string }>} Network information
   * @throws {ContractError} If provider call fails
   */
  async getNetwork() {
    try {
      // Call this.provider.getNetwork()
      const network = await this.provider.getNetwork();

      // Return { chainId: network.chainId, name: network.name }
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get network: ${error.message}`);
    }
  }

  /**
   * Gets the current block number from the provider.
   * @returns {Promise<number>} Current block number
   * @throws {ContractError} If provider call fails
   */
  async getBlockNumber() {
    try {
      // Call this.provider.getBlockNumber()
      const blockNumber = await this.provider.getBlockNumber();

      // Return block number
      return blockNumber;
    } catch (error) {
      // Throw ContractError on error
      throw new ContractError(`Failed to get block number: ${error.message}`);
    }
  }

  /**
   * Detects the network from the provider and validates it matches the configured chainId.
   * @returns {Promise<number>} Detected chain ID
   * @throws {ValidationError} If detected chainId doesn't match configured chainId
   * @throws {ContractError} If provider call fails
   */
  async detectAndValidateNetwork() {
    try {
      // Get network from provider
      const network = await this.provider.getNetwork();
      const detectedChainId = Number(network.chainId);

      // If this.chainId exists, validate it matches detected chainId
      if (this.chainId != null) {
        const configuredChainId = Number(this.chainId);
        if (configuredChainId !== detectedChainId) {
          throw new ValidationError(
            `Network mismatch: configured chainId ${configuredChainId} does not match detected chainId ${detectedChainId}`
          );
        }
      }

      // Return detected chainId
      return detectedChainId;
    } catch (error) {
      // Throw ContractError on provider error (unless it's a ValidationError)
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ContractError(`Failed to detect network: ${error.message}`);
    }
  }

  /**
   * Encodes calldata for the createUnifiedID function.
   * @param {string} unifiedId - The UnifiedID to create
   * @param {string} primaryWallet - The primary wallet address
   * @returns {string} Hex-encoded calldata string
   * @throws {ValidationError} If input validation fails
   * @throws {EncodingError} If encoding fails
   */
  encodeCreateUnifiedID(unifiedId, primaryWallet) {
    try {
      // Validate unifiedId using validateUnifiedId
      const unifiedIdValidation = validateUnifiedId(unifiedId);
      if (!unifiedIdValidation.valid) {
        throw new ValidationError(unifiedIdValidation.error);
      }

      // Validate primaryWallet using validateAddress
      const addressValidation = validateAddress(primaryWallet);
      if (!addressValidation.valid) {
        throw new ValidationError(addressValidation.error);
      }

      // ✅ CRITICAL FIX: Convert to checksummed address
      // This ensures ethers.js accepts the address regardless of input casing
      let checksummedAddress;
      try {
        checksummedAddress = ethers.utils.getAddress(primaryWallet);
      } catch (checksumError) {
        throw new ValidationError(`Invalid address checksum: ${checksumError.message}`);
      }

      // Use this.interface.encodeFunctionData with checksummed address
      const calldata = this.interface.encodeFunctionData('createUnifiedID', [
        unifiedId, 
        checksummedAddress
      ]);

      // Return hex-encoded calldata string
      return calldata;
    } catch (error) {
      // Throw ValidationError on validation failure
      if (error instanceof ValidationError) {
        throw error;
      }
      // Throw EncodingError on encoding failure
      throw new EncodingError(`Failed to encode createUnifiedID: ${error.message}`);
    }
  }

  /**
   * Decodes calldata for the createUnifiedID function.
   * @param {string} calldata - The hex-encoded calldata to decode
   * @returns {{ unifiedId: string, primaryWallet: string }} Decoded parameters
   * @throws {EncodingError} If decoding fails
   */
  decodeCreateUnifiedID(calldata) {
    try {
      // Use this.interface.decodeFunctionData('createUnifiedID', calldata)
      const decoded = this.interface.decodeFunctionData('createUnifiedID', calldata);

      // Return { unifiedId: decoded[0], primaryWallet: decoded[1] }
      return {
        unifiedId: decoded[0],
        primaryWallet: decoded[1]
      };
    } catch (error) {
      // Throw EncodingError on failure
      throw new EncodingError(`Failed to decode createUnifiedID calldata: ${error.message}`);
    }
  }

  /**
   * Estimates gas required for creating a UnifiedID.
   * @param {string} unifiedId - The UnifiedID to create
   * @param {string} primaryWallet - The primary wallet address
   * @returns {Promise<{ gasLimit: number, gasPrice: string, estimatedCost: string, network: string, note?: string }>} Gas estimation result
   * @throws {ValidationError} If input validation fails
   */
  async estimateGasForCreate(unifiedId, primaryWallet) {
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

      // Try to estimate gas using this.contract.estimateGas.createUnifiedID()
      const gasEstimate = await this.contract.estimateGas.createUnifiedID(unifiedId, primaryWallet);

      // Get fee data using this.provider.getFeeData()
      const feeData = await this.provider.getFeeData();

      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(gasEstimate.toNumber() * (1 + GAS_LIMITS.BUFFER_PERCENTAGE / 100));

      // ✅ IMPROVED: More robust gas price fallback
      let gasPrice;
      if (feeData.gasPrice) {
        gasPrice = feeData.gasPrice;
      } else if (feeData.maxFeePerGas) {
        gasPrice = feeData.maxFeePerGas;
      } else {
        // Fallback: 20 gwei
        gasPrice = ethers.utils.parseUnits('20', 'gwei');
      }

      // Calculate estimated cost
      const estimatedCostWei = gasPrice.mul(gasLimit);
      const estimatedCostEther = ethers.utils.formatEther(estimatedCostWei);
      const currencySymbol = this.nativeCurrency.symbol;

      // Return object with gas estimation details
      return {
        gasLimit: gasLimit,
        gasPrice: `${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`,
        estimatedCost: `${estimatedCostEther} ${currencySymbol}`,
        network: this.networkName
      };
    } catch (error) {
      // If estimation fails, return typical values
      if (error instanceof ValidationError) {
        throw error;
      }

      const currencySymbol = this.nativeCurrency.symbol;
      return {
        gasLimit: GAS_LIMITS.CREATE_UNIFIED_ID,
        gasPrice: '20 gwei',
        estimatedCost: `0.002 ${currencySymbol}`,
        network: this.networkName,
        note: 'Estimation failed, using typical values'
      };
    }
  }

  /**
   * Builds a transaction object for the relayer to execute.
   * @param {string} unifiedId - The UnifiedID to create
   * @param {string} primaryWallet - The primary wallet address
   * @returns {Promise<{ to: string, data: string, gasLimit: number, maxFeePerGas: ethers.BigNumber, maxPriorityFeePerGas: ethers.BigNumber, chainId: number, value: number }>} Transaction object
   * @throws {ValidationError} If input validation fails
   * @throws {EncodingError} If encoding fails
   * @throws {ContractError} If gas estimation or fee data retrieval fails
   */
  async buildTransactionForRelayer(unifiedId, primaryWallet) {
    try {
      // Get calldata using this.encodeCreateUnifiedID()
      const calldata = this.encodeCreateUnifiedID(unifiedId, primaryWallet);

      // Get gas estimate using this.estimateGasForCreate()
      const gasEstimate = await this.estimateGasForCreate(unifiedId, primaryWallet);

      // Get fee data using this.provider.getFeeData()
      const feeData = await this.provider.getFeeData();

      // Get chainId (use this.chainId or detect from network)
      let chainId = this.chainId;
      if (!chainId) {
        const network = await this.provider.getNetwork();
        chainId = network.chainId;
      }

      // Return transaction object
      return {
        to: this.contractAddress,
        data: calldata,
        gasLimit: gasEstimate.gasLimit,
        maxFeePerGas: feeData.maxFeePerGas || feeData.gasPrice,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || feeData.gasPrice,
        chainId: Number(chainId),
        value: 0
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof EncodingError) {
        throw error;
      }
      throw new ContractError(`Failed to build transaction: ${error.message}`);
    }
  }

  /**
   * Verifies that calldata is valid for createUnifiedID.
   * @param {string} calldata - The hex-encoded calldata to verify
   * @returns {boolean} True if calldata is valid, false otherwise
   */
  verifyCalldata(calldata) {
    try {
      // Try to decode calldata
      const decoded = this.decodeCreateUnifiedID(calldata);

      // Validate decoded unifiedId and primaryWallet
      const unifiedIdValidation = validateUnifiedId(decoded.unifiedId);
      if (!unifiedIdValidation.valid) {
        return false;
      }

      const addressValidation = validateAddress(decoded.primaryWallet);
      if (!addressValidation.valid) {
        return false;
      }

      // Return true if valid
      return true;
    } catch (error) {
      // Catch any errors and return false
      return false;
    }
  }

  /**
   * Gets the 4-byte function selector for createUnifiedID.
   * @returns {string} Function selector (0x + 8 hex characters)
   */
  getCreateUnifiedIDSelector() {
    // Use this.interface.getSighash('createUnifiedID')
    const selector = this.interface.getSighash('createUnifiedID');

    // Return 4-byte function selector
    return selector;
  }

  /**
   * Gets the current configuration of the contract instance.
   * @returns {{ contractAddress: string, chainId: number|null, networkName: string, rpcURL: string, blockExplorer: string|null, nativeCurrency: Object }} Configuration object
   */
  getConfig() {
    // Return object with configuration properties
    return {
      contractAddress: this.contractAddress,
      chainId: this.chainId,
      networkName: this.networkName,
      rpcURL: this.rpcURL,
      blockExplorer: this.blockExplorer,
      nativeCurrency: this.nativeCurrency
    };
  }

  /**
   * Gets the block explorer URL for a transaction hash.
   * @param {string} txHash - The transaction hash
   * @returns {string|null} Block explorer transaction URL or null if block explorer not available
   */
  getTransactionURL(txHash) {
    // If this.blockExplorer is null, return null
    if (!this.blockExplorer) {
      return null;
    }

    // Otherwise return `${this.blockExplorer}/tx/${txHash}`
    return `${this.blockExplorer}/tx/${txHash}`;
  }

  /**
   * Gets the block explorer URL for an address.
   * @param {string} address - The address to view
   * @returns {string|null} Block explorer address URL or null if block explorer not available
   */
  getAddressURL(address) {
    // If this.blockExplorer is null, return null
    if (!this.blockExplorer) {
      return null;
    }

    // Otherwise return `${this.blockExplorer}/address/${address}`
    return `${this.blockExplorer}/address/${address}`;
  }
}

