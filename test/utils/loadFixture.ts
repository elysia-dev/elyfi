import { waffle } from 'hardhat';

// Unfortuntately currently the buidler-integrated loadFixture is broken as discovered by PaulRBerg.
// The solution is to use createFixtureLoader as shown on the below.
// https://soliditydeveloper.com/waffle
const loadFixture = waffle.createFixtureLoader(
  waffle.provider.getWallets(),
  waffle.provider
);

export default loadFixture