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
yarn test test-suites/scenarios.test.ts

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

## Contract Addresses
Mainnet(ETH)
| Contract | Address |
| ------------- | ------------- |
| Moneypool | 0xa93008fD32EB24E488DDAA6C0aA152559fDa9E8c |
| DataPipeline | 0x128AF7E290ECCDe0050f33A1b5A4Bc8b2BB4d817 |
| DAI LToken | 0x527c901E05228f54a9a63151A924A97622F9f173 |
| DAI DToken | 0x62324ce2E14bb94512eC26C9fF0Be2CaD8c83d1B |
| DAI Tokeninzer | 0xc6701e7be98a79485364419961838eb141141aaf |
| USDT LToken | 0xe0BdA8E3A27E889837Ae37970fe97194453ee79C |
| USDT DToken | 0xf421bed2ae79615ad17f51137873139a47342a5e |
| USDT Tokeninzer | 0x68f69Ab21242e194ebd7534B598e26180dD92616 |
| USDC LToken | 0xe0BdA8E3A27E889837Ae37970fe97194453ee79C |
| USDC DToken | 0xf917147d8ED7b57C107D36576f4cCDe410ae29B6 |
| USDC Tokeninzer | 0xD86f51C8d0F10AAd267fB42E143D6d0B97aE9B23 |

BSC
| Contract | Address |
| ------------- | ------------- |
| Moneypool | 0x0bdFef5f8B75741d33a22d85022244CBE793DA24 |
| DataPipeline | 0xA63830cCCDcd380b00EF00f070357Cb03cDc2E7b |
| BUSD LToken | 0x5bb4d02A0BA38fB8B916758f11d9B256967a1F7F |
| BUSD DToken | 0xE9f638C2ba70EA022c710eAeEf14824F126d0c34 |
| BUSD Tokeninzer | 0x0d768c1507B5099CB37e5D28B1959B831B5EbF9e |


## Primary Accounts
Mainnet
| Name | Address |
| ------------- | ------------- |
| Moneypool Owner | 0x715B006d4723977CcDb1581a62948f6354752e62 |
| CSP (Elyloan) | 0x9FCdc09bF1e0f933e529325Ac9D24f56034d8eD7 |
| Council | 0x53c14659BF777b2D7e0A7fBa4d5DfF87D594495c |

BSC
| Name | Address |
| ------------- | ------------- |
| Moneypool Owner | 0x8d86dD9fe7318e04Cc51440C0252663f7FeCF01E |
| CSP (Elyloan) | 0x9FCdc09bF1e0f933e529325Ac9D24f56034d8eD7 |
| Council | 0x1Ba25f40bA5BEFcffef536709271e3098345b0Cc |

## The graph
- https://thegraph.com/explorer/subgraph?id=56zkjAwQ8Kq1MjmYm4Zxwe7bv8fGSwUCNBT7jcXi8nFn&view=Playground
- https://thegraph.com/hosted-service/subgraph/donguks/elyfi-bsc
