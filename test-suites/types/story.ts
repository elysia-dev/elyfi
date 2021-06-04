import ActionType from "../enums/actinoType"

type Story = {
  description: string,
  actionType: ActionType,
  actionMaker: 0 | 1 | 2 | 3,
  value: number,
  expected: boolean
}

export default Story