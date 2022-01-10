// Script determines and reports bytecountestimate by appName for each 1-hour period
var $http = require('request')
var assert = require('assert')
var Q = require('q')

//  EDIT THESE VARIABLES TO MEET YOUR NEEDS
var HOURS = 1 // Hours
var QUERYKEY = 'NRIQ-s2XuzMcBo6FP6u1CsPNN3f50LjyRi3LO'
var INSERTAPIKEY = '0c68ed1c1990c38fd55ede5fe96da0fc83bad06f'
var ACCOUNTID = '1336182'
var FACETATTRIBUTE = 'appName'

// Multi-dimensional array [NRQL, TYPE] comma-delimited
var STATEMENTS = [
  ['SELECT bytecountestimate()/10e8 FROM `Transaction`, `TransactionError` FACET ' + FACETATTRIBUTE + ' SINCE ' + HOURS + ' hours ago LIMIT MAX', 'APM Events'],
  ['SELECT bytecountestimate()/10e8 FROM `Metric` WHERE instrumentation.provider != `kentik` AND instrumentation.provider != `pixie` FACET ' + FACETATTRIBUTE + ' SINCE ' + HOURS + ' hours ago LIMIT MAX', 'Metrics'],
  ['SELECT bytecountestimate()/10e8 FROM `PageAction`, `JavaScriptError`, `PageView`, `AjaxRequest`, `PageViewTiming`, `BrowserInteraction`, `BrowserTiming`, `Ajax` FACET ' + FACETATTRIBUTE + ' SINCE ' + HOURS + ' hours ago LIMIT MAX', 'Browser'],
  ['SELECT bytecountestimate()/10e8 FROM `Span`, `ErrorTrace`, `SqlTrace` WHERE instrumentation.provider != `pixie` FACET ' + FACETATTRIBUTE + ' SINCE ' + HOURS + ' hours ago LIMIT MAX', 'Tracing']
]
//  END OF VARIABLES TO EDIT

// Q.spawn() is not required but runs a generator function that automatically handles promise rejections on uncaught errors
Q.spawn(function * () {
  for (var index in STATEMENTS) {
    var NRQL = STATEMENTS[index][0]
    var TYPE = STATEMENTS[index][1]
    call(NRQL, TYPE)
  }
})

function call (NRQL, TYPE) {
  // Reset array for each event
  var JSONARR = []

  // Callback
  var callback = function (error, response, body) {
    if (error) {
      console.log(error.stack)
    }
    assert.strictEqual(response.statusCode, 200, 'invalid response from insights')
    // console.log(body)

    // forEach refers to each objects in the facets array
    body.facets.forEach(function (bytecountestimate) {
      JSONARR.push({
        'metrics': [{
          'name': 'ingestMetric', // e.g., bytesEstimate
          'type': 'gauge', // must be count, gauge, or summary
          'value': bytecountestimate.results[0].result, // checking for outcome
          'timestamp': Date.now(),
          'attributes': {
            'appName': bytecountestimate.name, // name of faceted object (e.g., appName)
            'ingestType': TYPE,
          }
        }]
      })
    })
    
    if (!Array.isArray(JSONARR) || !JSONARR.length) {
      console.log('Empty Array!')
    } else {
      console.log('---------------------------------------------------------------------')
      console.log(JSONARR)
      console.log('---------------------------------------------------------------------')
      // eslint-disable-next-line no-unused-vars
      var insertoptions = {
        method: 'POST',
        url: 'https://metric-api.newrelic.com/metric/v1',
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': INSERTAPIKEY,
          'Content-Encoding': 'Identity' // changed from 'gzip, deflate'
        },
        body: JSONARR
      }
      // ---------------------------------------------------------------------GO LIVE UNCOMMENT---------------------------------------------------------------------
       $http.post(insertoptions, function (error, response) {
       if (error) throw new Error(error)
       assert.strictEqual(response.statusCode, 202, 'invalid response from insights')
       })
    }
    return Q.Promise
  }
  var options = {
    url: 'https://insights-api.newrelic.com/v1/accounts/' + ACCOUNTID + '/query',
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'application/json',
      'X-Query-Key': QUERYKEY
    },
    qs: {
      'nrql': NRQL
    }
  }
  $http.get(options, callback)
}