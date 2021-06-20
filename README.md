# Elyfi

This repository contains the smart contracts source code and markets configuration for Elyfi. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Elyfi?

ELYFI is adding real estate to the DEFI concept. This is the expansion of the current crypto-to-crypto applications as ELYFI will introduce traditional assets to the open financial market.

To implment the project, We use same DEFI concepts like Index Model, Kinked Rates Model and Tokenization of Aave protocol

## Setup

- Create an file named .env and fill the next enviroment variables

```
# Secret key for deploying contracts
ADMIN=

INFURA_API_KEY=

ETHERSCAN_API_KEY=

```

- Install dependencies with `yarn`

## Test

For convenience, we assume that waffle's wallets are mapped in order of [deployer, account1, account2, account3 ...]

```
# Run specific test code
yarn test test/contracts/Index.test.ts

# With no-compile
yarn test:zap test/contracts/Index.test.ts

# Run scenarios. The below script dynamically loads ./scenarios/*.json
yarn test test-suites/scenario.test.ts

# Run script for subgrap testing
yarn hardhat deploy --network ganache
yarn hardhat createWithdraw --network ganache --asset ASSET_ADDRESS --pool POOL_ADDRESS
```

## Deploy

```
## Deploy local network
yarn hardhat deploy

## Deploy test network
yarn hardhat --network networkName deploy
```
