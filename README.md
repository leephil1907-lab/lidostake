# Lido Stake Pro CLI

Command-line interface for managing your Lido Stake Pro contract.

## Setup

```bash
npm install
```

Create `.env` file (see `.env.example`):
```bash
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY
```

## Commands

```bash
# Show contract info
npm run cli -- info

# Show token balance
npm run cli -- balance --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091

# Approve spender
npm run cli -- approve --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091 --spender 0x... --amount 100

# Transfer tokens
npm run cli -- transfer --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091 --to 0x... --amount 10

# Transfer full balance
npm run cli -- send-max --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091 --to 0x...

# Transfer using allowance
npm run cli -- transfer-from --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091 --from 0x... --to 0x... --amount 5

# Check allowance
npm run cli -- allowance --token 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091 --spender 0x...

# Permit2 approve
npm run cli -- permit2-approve --token 0x... --spender 0x... --amount 100

# Permit2 transferFrom
npm run cli -- permit2-transfer-from --token 0x... --from 0x... --to 0x... --amount 10

# Uniswap swap
npm run cli -- swap-exact-input-single --token-in 0x... --token-out 0x... --fee 3000 --amount-in 1

# Lido token info
npm run cli -- lido-info
```

## Contract Addresses

- **Owner:** `0xEfc5859335A58d64A5e8E01d02c5241c852CBD40`
- **Contract:** `0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091`
- **stETH:** `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- **wstETH:** `0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0`
