import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-typechain';
import 'hardhat-deploy-ethers';
import 'hardhat-deploy';
import 'hardhat-docgen';
import 'hardhat-abi-exporter';
// import "solidity-coverage"
// Gas-reporter's parser dependency makes Warning:
// Accessing non-existent property 'INVALID_ALT_NUMBER' of module exports inside circular dependency
import 'hardhat-gas-reporter';
import 'solidity-coverage';

import { HardhatUserConfig } from 'hardhat/types';

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
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 1,
    },
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
  },
  mocha: {
    //reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'KRW',
      showTimeSpent: true,
    },
  },
  abiExporter: {
    path: './data/abi',
    clear: true,
    flat: true,
    spacing: 2,
  },
};

export default config;
