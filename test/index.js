
chai.use(require('sinon-chai'))

const testsContext = require.context('.', true, /^((?!index).)*$/);

testsContext.keys().forEach(testsContext);
