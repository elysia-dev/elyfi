import AssetBondState from "../../test/types/AssetBondState"

type AbToken = {
  state: AssetBondState,
  borrower: 'Deployer' | 'CSP' | 'Account1' | 'Account2' | 'Account3' | 'Account4'
  principal: number,
}

export default AbToken
