# Elyfi

This repository contains the smart contracts source code and markets configuration for Elyfi. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Elyfi?

ELYFI is adding real estate to the DEFI concept. This is the expansion of the current crypto-to-crypto applications as ELYFI will introduce traditional assets to the open financial market.

- [The Elyfi documents](https://elyfi-docs.elysia.land/v/eng/), describing what is elyfi and how it works
- For using the elyfi, [The Elyfi dapp](https://elyfi.elysia.land/)

## Community

You can join at the [telegram](https://t.me/elysia_official) or [kakaotalk](https://open.kakao.com/o/gUpSOwkb) for asking questions about protocol.

The forum for the elyfi will be completed soon. You can join and participate fully in the running of the elyfi protocol with the governance.

## Installation

- Set up .env file in the project directory and add the following environment variables:

```
# Secret key for deploying contracts
ADMIN=

INFURA_API_KEY=

ETHERSCAN_API_KEY=

```

- Install dependencies with `yarn`

## Deploy

The Elyfi protocol has two components. The core component including moneypool contract is the main part of the elyfi protocol which is main entry point into Elyfi protocol and each reserve components has its own supporting contracts for tokenization. Therefore, deployment can be done with two process.

```
## Deploying Core Components
yarn deploy:core --network ${networkname}

## Deploying Reserve Components
yarn deploy:reserve --network ${networkname} --tags ${asset symbol}_reserve
```

## Test

For convenience, we assume that waffle's wallets are mapped in order of [deployer, account1, account2, account3 ...]
You can run test with below scripts

```
# Run specific test code
yarn test test/contracts/Index.test.ts

# With no-compile
yarn test:zap test/contracts/Index.test.ts

# Run scenarios. The below script dynamically loads ./scenarios/*.json
yarn test test-suites/scenario.test.ts

# Run script for subgrap testing
yarn hardhat deploy --network ganache
yarn task createWithdraw --network ganache --asset ASSET_ADDRESS --pool POOL_ADDRESS

# Coverage
yarn coverage
open ./coverage/index.html
```

## Docgen

You can genenerate markdown docs from the smart contracts natspec.
The markdown docs templates is in the contracts.hbs in the ./template. You can edit this file or replace it on your own.

```
# Docgen
yarn docgen
```
