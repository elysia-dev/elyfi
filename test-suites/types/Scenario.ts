import AbToken from "./AbToken"
import Story from "./Story"

type Scenario = {
  description: string,
  abTokens: AbToken[],
  stories: Story[],
}

export default Scenario