var fh = require('fh-js-sdk');
var async = require('async');

var datasetId = 'test-dataset';

fh.sync.init({ 'storage_strategy': 'dom' });
async.series([
  function(cb) {
    console.log('manage dataset');
    fh.sync.manage(datasetId, {}, {}, {}, cb);
  },
  function(cb) {
    console.log('create data');
    fh.sync.doCreate(datasetId, { value: 'test-value' }, function() { cb(); }, cb);
  },
  function(cb) {
    console.log('force sync');
    fh.sync.forceSync(datasetId, cb, cb);
  },
  function(cb) {
    console.log('wait for sync');
    setTimeout(cb, 5000);
  }
], function() {
  window.close();
});
