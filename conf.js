exports.config = {
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['loginTest.js'],
  // getPageTimeout: 5000,
  capabilities: {
    browserName: 'chrome'

  }
}
