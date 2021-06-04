import { expect } from "chai";
import fs from "fs";
import Scenario from "./types/scenario";

fs.readdirSync('test-suites/scenarios').forEach((file) => {
  const scenario = require(`./scenarios/${file}`) as Scenario;

  describe(scenario.description, async () => {
    scenario.stories.forEach((story) => {
      it(story.description, () => {
        expect(story.expected).to.be.true
      })
    })
  })
})