import 'dotenv/config';
import 'hardhat-typechain';
import 'hardhat-deploy-ethers';
import 'hardhat-deploy';

import { HardhatUserConfig } from 'hardhat/types';
import './tasks/local/moneyPool';
import './tasks/local/underlyingAsset';
import './tasks/testnet/moneyPool';
import './tasks/testnet/underlyingAsset';
import './tasks/testnet/tokenizer';

const testMnemonic = 'suggest mirror pulp horn goat wagon body long fortune dirt glass awesome';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.3',
    settings: {
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
        mnemonic: process.env.TEST_MNEMONIC || testMnemonic,
      },
      chainId: 3,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
        mnemonic: process.env.TEST_MNEMONIC || testMnemonic,
      },
      chainId: 42,
    },
    ganache: {
      url: 'http://0.0.0.0:8545',
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'KRW',
      showTimeSpent: true,
    },
  },
};

export default config;
