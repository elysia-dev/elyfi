import fs from 'fs';
import hre from 'hardhat';
import AssetBondSettleData from '../test/types/AssetBondSettleData';
import ElyfiContracts from '../test/types/ElyfiContracts';
import Scenario from './types/Scenario';
import excuteStory from './utils/excuteStory';
import makeTestSuiteContracts from './utils/makeTestSuiteContracts';
import mintAbTokens from './utils/mintAbTokens';

fs.readdirSync('test-suites/scenarios').forEach((file) => {
  const scenario = require(`./scenarios/${file}`) as Scenario;

  describe(scenario.description, async () => {
    const provider = hre.waffle.provider;
    let elyfiContracts: ElyfiContracts;
    let snapshotId: string;
    let abTokens: AssetBondSettleData[];

    before(async () => {
      snapshotId = await provider.send('evm_snapshot', []);

      elyfiContracts = await makeTestSuiteContracts(provider);

      abTokens = await mintAbTokens(provider, elyfiContracts, scenario.abTokens || []);
    });

    after(async () => {
      await provider.send('evm_revert', [snapshotId]);
    });

    scenario.stories.forEach((story) => {
      it(`${story.actionMaker} ${story.actionType}`, async () => {
        await excuteStory(
          story,
          elyfiContracts,
          abTokens,
          scenario.abTokens
        );
      });
    });
  });
});
