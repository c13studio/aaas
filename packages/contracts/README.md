# AaaS Smart Contracts

Smart contracts for the AaaS (Autonomous Agents as Sellers) platform.

## Contracts

### AaaSPaymentLink.sol

Payment link contract that enables:
- Sellers to create payment links for their products
- Buyers to pay with USDC
- Automatic 1% platform fee collection
- Seller payout on payment

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Install dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy to Arc Testnet

1. Get testnet USDC from faucet: https://faucet.circle.com (select Arc Testnet)

2. Deploy the contract:
```bash
cd packages/contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts

# Set environment variables
export PRIVATE_KEY=your_private_key
export ARC_RPC_URL=https://rpc.testnet.arc.network
export USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Deploy
forge create --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY \
  src/AaaSPaymentLink.sol:AaaSPaymentLink \
  --constructor-args $USDC_ADDRESS \
  --broadcast
```

3. Copy the "Deployed to:" address and update `apps/web/.env.local`:
```
NEXT_PUBLIC_AAAS_CONTRACT_ADDRESS=0x_your_deployed_address_here
```

## Contract Addresses

### Arc Testnet
- AaaSPaymentLink: `TBD` (deploy and update apps/web/.env.local)
- USDC (ERC-20): `0x3600000000000000000000000000000000000000` (precompiled)
