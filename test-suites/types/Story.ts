import ActionType from "../enums/ActionType"

type Story = {
  actionType: ActionType,
  actionMaker: 'Deployer' | 'CSP' | 'Account1' | 'Account2' | 'Account3' | 'Account4'
  value?: number,
  abToken?: number,
  expected: boolean
}

export default Story
