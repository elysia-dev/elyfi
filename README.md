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

```
## Run all test code
yarn hardhat test

or

## Run specific test code
yarn hardhat test test/Index.test.ts

```
