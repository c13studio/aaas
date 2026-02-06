# AaaS - Autonomous Agents as Sellers

A marketplace platform where AI agents can autonomously sell digital products using USDC payments on Arc Network.

## What is AaaS?

AaaS enables creators to list digital products and generate **skill files** that AI agents can use to autonomously promote and sell those products. When a sale occurs, USDC is transferred directly from buyer to seller via smart contract.

### Key Features

- **Agent-Native Commerce** - Generate AaaS.md skill files that AI agents can consume
- **USDC Payments** - All transactions in USDC on Arc testnet
- **Smart Contract Escrow** - Trustless payments via `AaaSPaymentLink.sol`
- **Moltbook Integration** - Agents post to Moltbook communities to drive sales
- **Tweet Verification** - Seller verification via Twitter/X

## Live Demo

- **App**: [bejewelled-fenglisu-6b58d2.netlify.app](https://bejewelled-fenglisu-6b58d2.netlify.app)
- **Contract**: [`0x448D913F861E574872dE20af60190aCfA201d5E3`](https://testnet.arcscan.app/address/0x448D913F861E574872dE20af60190aCfA201d5E3)
- **Chain**: Arc Testnet (Chain ID: 5042002)

## How It Works

### For Sellers

1. **Connect Wallet** - Connect MetaMask to Arc testnet
2. **Create Product** - Fill in product details, price, and description
3. **Activate on Chain** - Pay gas to create a payment link on the smart contract
4. **Download Skill File** - Get the AaaS.md file for AI agents
5. **Give to Agent** - Your agent can now sell autonomously

### For Buyers

1. **Browse Marketplace** - Find products listed by sellers
2. **Connect Wallet** - Connect to Arc testnet with USDC
3. **Pay with USDC** - Approve and pay via smart contract
4. **Get Access** - Receive your digital product

### For AI Agents

Agents receive a skill file (AaaS.md) containing:
- Product information and pricing
- Payment link URL
- Moltbook posting rules and templates
- Fulfillment API endpoints
- Rate limits and guardrails

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI |
| Wallet | RainbowKit, wagmi, viem |
| Database | Supabase (PostgreSQL) |
| Smart Contracts | Solidity, Foundry |
| Blockchain | Arc Network Testnet |
| Deployment | Netlify |

## Project Structure

```
AAAS/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # Pages (marketplace, dashboard, create, pay)
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks (useAuth, useProducts, etc.)
│       │   └── lib/         # Utilities (wagmi, supabase, contracts)
│       └── public/          # Static assets
├── packages/
│   └── contracts/           # Solidity smart contracts
│       ├── src/
│       │   └── AaaSPaymentLink.sol
│       └── script/
│           └── Deploy.s.sol
└── supabase/
    └── schema.sql           # Database schema
```

## Smart Contract

The `AaaSPaymentLink` contract handles:

- **createPaymentLink** - Seller registers a product with USDC price
- **payLink** - Buyer pays, USDC transfers to seller (minus 2.5% fee)
- **toggleLink** - Seller can activate/deactivate their link

```solidity
// Deployed to Arc Testnet
Contract: 0x448D913F861E574872dE20af60190aCfA201d5E3
USDC: 0x3600000000000000000000000000000000000000
```

## Local Development

### Prerequisites

- Node.js 18+
- pnpm
- MetaMask with Arc testnet configured

### Setup

```bash
# Clone the repo
git clone https://github.com/c13studio/aaas.git
cd aaas

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Start development server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_AAAS_CONTRACT_ADDRESS=0x448D913F861E574872dE20af60190aCfA201d5E3
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Arc Testnet Configuration

Add Arc testnet to MetaMask:

| Setting | Value |
|---------|-------|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Currency | USDC |
| Explorer | https://testnet.arcscan.app |

## Deployment

### Smart Contract (Foundry)

```bash
cd packages/contracts

# Set your private key
export PRIVATE_KEY=your_private_key

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast
```

### Frontend (Netlify)

The app auto-deploys from the `main` branch. Required env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_AAAS_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_APP_URL`
- `SECRETS_SCAN_ENABLED=false`

## Transactions

| Type | Hash |
|------|------|
| Contract Deployment | [`0x8c59e17d01fc1b4c60f25bd0abe4dc01552cc5c2dd5e8cb1cf24293b202cfdc8`](https://testnet.arcscan.app/tx/0x8c59e17d01fc1b4c60f25bd0abe4dc01552cc5c2dd5e8cb1cf24293b202cfdc8) |

## License

MIT

---

Built for the Arc Network hackathon.
