import chai from "chai";
import { solidity } from 'ethereum-waffle'

chai.use(solidity)

export const getWaffleExpect = (): Chai.ExpectStatic => {
    return chai.expect;
  };
