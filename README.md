## UnifiedID SDK

JavaScript SDK to interact with the Glyph **Unified ID Registry** smart contract:

- **Read** Unified ID metadata and mappings
- **Generate & verify calldata** for relayer flows
- **Build EIP‑1559 transactions** for gas‑sponsored execution
- **Validate inputs** (IDs, addresses, calldata) with friendly error types
- **Use on multiple EVM networks** (Polygon, Base, Sepolia)
- **Consume as ESM** with first‑class `ethers@5` support

---

## Installation

```bash
npm install @glyph-hq/unified-id-sdk
```

- **Runtime dependency:** `ethers@^5.7.2`
- **Node.js:** `>=14.0.0`
- The SDK is published as **ES modules**.

---

## Package Overview

Main entry (from `src/index.js`):

- **Class**
  - `UnifiedIDContract`
- **Validation utilities**
  - `validateUnifiedId`, `validateAddress`, `normalizeUnifiedId`, `normalizeAddress`
- **Encoding utilities**
  - `encodeCreateUnifiedID`, `decodeCreateUnifiedID`, `getFunctionSelector`, `isCreateUnifiedIDCalldata`
- **Error classes**
  - `UnifiedIDError`, `ValidationError`, `ContractError`, `EncodingError`
- **Network constants & helpers**
  - `NETWORK_CONFIGS`, `getNetworkConfig`, `getSupportedChainIds`, `isNetworkSupported`, `getDeployedNetworks`, `GAS_LIMITS`
- **ABI & metadata**
  - `UnifiedIDRegistryABI`, `VERSION`

Sub‑path exports (from `package.json`):

- `@glyph-hq/unified-id-sdk/contract` → `UnifiedIDContract`
- `@glyph-hq/unified-id-sdk/validation` → validation helpers
- `@glyph-hq/unified-id-sdk/encoding` → encoding helpers
- `@glyph-hq/unified-id-sdk/constants` → network constants
- `@glyph-hq/unified-id-sdk/abi` → raw `UnifiedIDRegistry.json` ABI

---

## Importing

### ESM (recommended)

```javascript
import {
  UnifiedIDContract
} from '@glyph-hq/unified-id-sdk';
```


### CommonJS (via dynamic import)

The package is ESM‑only. In CommonJS you can use:

```javascript
const {
  UnifiedIDContract
} = await import('@glyph-hq/unified-id-sdk');
```

---

## Quick Start

```javascript
import { UnifiedIDContract } from '@glyph-hq/unified-id-sdk';

// Example: Sepolia deployment
const contract = new UnifiedIDContract({
  chainId: 11155111, // optional (metadata + validation)
  contractAddress: '0xYourRegistryAddressHere',
  rpcURL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
});

// Check if a Unified ID is available
const isTaken = await contract.exists('alice');
const isAvailable = !isTaken;

// Resolve primary wallet for an existing Unified ID
const wallet = await contract.getPrimaryWallet('alice');

// Build calldata + transaction for relayer
const tx = await contract.buildTransactionForRelayer('alice', wallet);
```

---

## Supported Networks

The SDK ships with **metadata** for several networks (names, explorers, native currency).
You must still provide the **contract address** and **RPC/provider** yourself.

| Network          | Chain ID | Explorer (example)                     | Status          |
|------------------|---------:|----------------------------------------|-----------------|
| Polygon Mumbai   |   80001  | `https://mumbai.polygonscan.com`      | ✅ Testnet      |
| Polygon Mainnet  |     137  | `https://polygonscan.com`             | ✅ Mainnet      |
| Ethereum Sepolia | 11155111 | `https://sepolia.etherscan.io`        | ✅ Testnet      |
| Base Sepolia     |   84532  | `https://sepolia.etherscan.io`        | ✅ Testnet      |
| Base Mainnet     |    8453  | `https://basescan.org`                | ✅ Mainnet      |

Use `NETWORK_CONFIGS` and helpers to introspect these at runtime.

---

## `UnifiedIDContract` – Configuration

Constructor signature (`src/UnifiedIDContract.js`):

```ts
new UnifiedIDContract(config?: {
  chainId?: number;                    // optional, used for metadata + validation
  contractAddress: string;             // required
  rpcURL?: string;                     // required unless provider is supplied
  provider?: ethers.providers.Provider // optional; overrides rpcURL
})
```

- **`contractAddress` (required)**  
  Deployed Unified ID Registry contract address.
- **`rpcURL` or `provider` (one is required)**  
  - If `provider` is supplied, `rpcURL` is ignored.
  - If `provider` is omitted, a `JsonRpcProvider` is created from `rpcURL`.
- **`chainId` (optional but recommended)**  
  - Used to attach network metadata (name, explorer, currency) from `NETWORK_CONFIGS`.
  - Used by `detectAndValidateNetwork()` to enforce a chain‑ID match.

If `contractAddress` is missing, or neither `rpcURL` nor `provider` is provided,
the SDK throws a `ValidationError`.

### Basic JSON‑RPC

```javascript
const contract = new UnifiedIDContract({
  chainId: 11155111,
  contractAddress: '0x9C0999B30a8ebd018792f6c74f11d066161FA45D',
  rpcURL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
});
```

---

## `UnifiedIDContract` – Read Methods

All methods are `async` unless stated otherwise and throw **`ValidationError`** for bad
inputs and **`ContractError`** for RPC/contract failures.

- **`getUnifiedID(unifiedId: string)`**  
  - **Returns:** `Promise<{ primaryWallet: string; createdAt: number } | null>`  
  - `null` is returned when the contract signals that the Unified ID does not exist.

- **`exists(unifiedId: string)`**  
  - **Returns:** `Promise<boolean>` – `true` if the Unified ID exists.

- **`getPrimaryWallet(unifiedId: string)`**  
  - **Returns:** `Promise<string | null>` – primary wallet, or `null` if the ID does not exist.

- **`getUnifiedIdByWallet(address: string)`**  
  - **Returns:** `Promise<string | null>`  
  - The underlying contract returns `""` for “no Unified ID”; the SDK normalises this to `null`.

- **`getTotalIDs()`**  
  - **Returns:** `Promise<number>` – total count of IDs in the registry.

- **`getRelayerAddress()`**  
  - **Returns:** `Promise<string>` – address configured as the relayer.

- **`getOwner()`**  
  - **Returns:** `Promise<string>` – owner address of the registry.

---

## `UnifiedIDContract` – Network & Config Utilities

- **`getNetwork()`**  
  - **Returns:** `Promise<{ chainId: number; name: string }>` (from `provider.getNetwork()`).

- **`getBlockNumber()`**  
  - **Returns:** `Promise<number>` – current block number from the provider.

- **`detectAndValidateNetwork()`**  
  - **Returns:** `Promise<number>` – detected chain ID.
  - If a `chainId` was passed to the constructor and it **differs** from the detected one,
    a `ValidationError` is thrown.

- **`getConfig()`**  
  - **Returns:** current configuration snapshot:
    ```ts
    {
      contractAddress: string;
      chainId: number | null;
      networkName: string;
      rpcURL: string | null;
      blockExplorer: string | null;
      nativeCurrency: { name: string; symbol: string; decimals: number };
    }
    ```

- **`getTransactionURL(txHash: string)`**  
  - **Returns:** `string | null` – explorer URL for a transaction, or `null` if no explorer known.

- **`getAddressURL(address: string)`**  
  - **Returns:** `string | null` – explorer URL for an address, or `null` if no explorer known.

---

## `UnifiedIDContract` – Calldata & Transactions

These methods build on top of the contract ABI loaded from `UnifiedIDRegistryABI`.

- **`encodeCreateUnifiedID(unifiedId: string, primaryWallet: string)`**  
  - **Returns:** `string` – hex calldata for `createUnifiedID(unifiedId, primaryWallet)`.  
  - Performs validation on both arguments and additionally normalises the wallet
    to a checksum address via `ethers.utils.getAddress`.
  - Throws `ValidationError` on invalid inputs, `EncodingError` if ABI encoding fails.

- **`decodeCreateUnifiedID(calldata: string)`**  
  - **Returns:** `{ unifiedId: string; primaryWallet: string }`  
  - Wraps `Interface.decodeFunctionData` under the hood.

- **`estimateGasForCreate(unifiedId: string, primaryWallet: string)`**  
  - **Returns:**
    ```ts
    {
      gasLimit: number;
      gasPrice: string;        // formatted in gwei
      estimatedCost: string;   // formatted in native currency
      network: string;
      note?: string;           // present when falling back to defaults
    }
    ```
  - Uses `contract.estimateGas.createUnifiedID(...)` + `provider.getFeeData()`.  
  - Adds a gas buffer defined by `GAS_LIMITS.BUFFER_PERCENTAGE`.  
  - On failure (non‑validation), it falls back to typical values (`GAS_LIMITS.CREATE_UNIFIED_ID`
    and `"20 gwei"`).

- **`buildTransactionForRelayer(unifiedId: string, primaryWallet: string)`**  
  - Combines encoding, gas estimation and fee data into a full EIP‑1559 style transaction object.
  - **Returns:**
    ```ts
    {
      to: string;
      data: string;
      gasLimit: number;
      maxFeePerGas: ethers.BigNumber | null;
      maxPriorityFeePerGas: ethers.BigNumber | null;
      chainId: number;
      value: 0;
    }
    ```

- **`verifyCalldata(calldata: string)`**  
  - **Returns:** `boolean` – `true` if:
    - the calldata decodes as `createUnifiedID`, and
    - both decoded arguments pass the SDK validators.

- **`getCreateUnifiedIDSelector()`**  
  - **Returns:** `string` – 4‑byte function selector (e.g. `0x12345678`) derived from the ABI.

---

## Error Types

All custom errors extend `UnifiedIDError` (`src/utils/errors.js`) and include a `.code` field:

- **`UnifiedIDError`**
  - Base class: `new UnifiedIDError(message, code)`.
- **`ValidationError`**
  - Code: `"VALIDATION_ERROR"`.
  - Thrown when inputs do not satisfy validators or configuration prerequisites.
- **`ContractError`**
  - Code: `"CONTRACT_ERROR"`.
  - Thrown for network/contract‑level failures (RPC, reverts, etc.).
- **`EncodingError`**
  - Code: `"ENCODING_ERROR"`.
  - Thrown when encoding/decoding calldata fails.

### Example: Error handling

```javascript
import {
  UnifiedIDContract,
  ValidationError,
  ContractError
} from '@glyph-hq/unified-id-sdk';

try {
  const contract = new UnifiedIDContract({
    chainId: 11155111,
    contractAddress: '0x9C0999B30a8ebd018792f6c74f11d066161FA45D',
    rpcURL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
  });

  const data = await contract.getUnifiedID('1nv@l!d'); // invalid
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Bad input:', err.message);
  } else if (err instanceof ContractError) {
    console.error('Chain issue:', err.message);
  } else {
    console.error('Unexpected error:', err);
  }
}
```

---

## Behaviour Notes & Gotchas

- **`getUnifiedIdByWallet` normalises empty IDs to `null`**  
  The underlying contract returns an empty string when a wallet has no Unified ID.
  The SDK converts this to `null`:

```javascript
const unifiedId = await contract.getUnifiedIdByWallet('0x...');
if (unifiedId === null) {
    console.log('Wallet has no Unified ID');
  }
  ```

- **Network mismatch detection**  
  If you pass a `chainId` to the constructor, you can enforce that your provider
  is actually connected to that chain:

```javascript
try {
  const detectedChainId = await contract.detectAndValidateNetwork();
  console.log('Network validated:', detectedChainId);
} catch (error) {
  console.error('Network mismatch:', error.message);
}
```

- **No default contract addresses**  
  For security and flexibility, the SDK does **not** hard‑code registry addresses.
  You must provide the correct `contractAddress` per environment.

---

Editors like VS Code will surface types and inline documentation automatically.

---

## Contributing

- **Issues:** use the GitHub Issues tracker configured in `package.json`.
- **Pull requests:** please include a clear description, usage notes and tests if applicable.
- Ensure changes are compatible with Node `>=14` and `ethers@^5.7.2`.

---

## License

MIT © Glyph Protocol HQ

---

_For the most precise reference, see the inline JSDoc comments in the `src/` directory._


