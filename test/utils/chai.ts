import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
require('../assertions/equals.ts');

chai.use(chaiAsPromised);

export default chai;