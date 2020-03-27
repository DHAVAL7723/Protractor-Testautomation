
var HtmlReporter = require('protractor-beautiful-reporter');

exports.config = {

  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['loginTest.js','PhysicianSearch-Test.js'],

  // getPageTimeout: 5000,
  capabilities: {
    browserName: 'chrome',
  },

  onPrepare: function() {
      // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
      jasmine.getEnv().addReporter(new HtmlReporter({
         baseDirectory: 'Reports/Screenshots'
      }).getJasmine2Reporter());
    }
};

