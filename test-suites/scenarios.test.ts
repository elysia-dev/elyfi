import fs from "fs";
import hre from 'hardhat';
import ElyfiContracts from "./types/ElyfiContracts";
import Scenario from "./types/scenario";
import excuteStory from "./utils/excuteStory";
import makeTestSuiteContracts from "./utils/makeTestSuiteContracts";

fs.readdirSync('test-suites/scenarios').forEach((file) => {
  const scenario = require(`./scenarios/${file}`) as Scenario;

  describe(scenario.description, async () => {
    const provider = hre.waffle.provider;
    let elyfiContracts: ElyfiContracts;
    let snapshotId: string;

    before(async () => {
      snapshotId = await provider.send('evm_snapshot', [])

      elyfiContracts = await makeTestSuiteContracts(provider)
    })

    after(async () => {
      await provider.send('evm_revert', [snapshotId])
    })

    scenario.stories.forEach((story) => {
      it(story.description, async () => {
        await excuteStory(
          story,
          provider.getWallets()[story.actionMaker],
          elyfiContracts,
        )
      })
    })
  })
})