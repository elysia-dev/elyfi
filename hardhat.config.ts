import 'dotenv/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ganache';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-deploy-ethers';
import 'hardhat-deploy';
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
  // namedAccounts: {
  //   deployer: 0,
  // },
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
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 4,
    },
    ganache: {
      url: 'http://0.0.0.0:8545',
    },
    ganache_remote: {
      url: 'http://elyfi-test-ALB-1122646302.ap-northeast-2.elb.amazonaws.com:8545',
    },
    ganache_remote_dev: {
      url: 'http://host.docker.internal:8545',
    }
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
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
};

export default config;
