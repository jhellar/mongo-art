var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
var bodyParser = require('body-parser');

// list the endpoints which you want to make securable here
var securableEndpoints;
securableEndpoints = [];

var app = express();

// Enable CORS for all requests
app.use(cors());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

/* uncomment this code if you want to use $fh.auth in the app preview
 * localAuth is only used for local development. 
 * If the app is deployed on the platform, 
 * this function will be ignored and the request will be forwarded 
 * to the platform to perform authentication.

app.use('/box', mbaasExpress.auth({localAuth: function(req, cb){
  return cb(null, {status:401, body: {"message": "bad request"}});
}}));

or

app.use('/box', mbaasExpress.core({localAuth: {status:401, body: {"message": "not authorised”}}}));
*/

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

app.get('/test', function(req, res) {
  mbaasApi.db({
    'act': 'create',
    'type': 'test-collection',
    'fields': { value: 'test-value' }
  }, function(err, data) {
    res.json({ url: process.env.FH_MONGODB_CONN_URL });
  });
});

app.post('/submission', bodyParser(), function(req, res) {
  const fieldEntry = {
    fieldId: req.body.form.pages[0].fields[0]._id,
    fieldValues: ['test']
  };
  const submission = {
    "timezoneOffset": -60,  // https://issues.jboss.org/browse/RHMAP-15423
    "formId": req.body.form._id,
    "deviceFormTimestamp": 1496909713881,
    "appId": req.body.clientApp.guid,
    "deviceIPAddress": "192.168.0.1",
    "comments": [],
    "formFields": [fieldEntry],
    "deviceId": "A200CC72B96946148950EC1EB0FE688B"
  };
  var options = {
    submission: submission,
    appClientId: req.body.clientApp.guid
  };
  mbaasApi.forms.submitFormData(options, function(err, data) {
    mbaasApi.forms.completeSubmission({
      submission: {
        submissionId: data.submissionId
      }
    }, function(err, data) {
      res.json({ msg: 'ok' });
    });
  });
});

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: " + port); 
});
