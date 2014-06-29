var http  = require('http'),
    async = require('async');


function Crawler(config) {
  this._config = config;
}

Crawler.prototype.crawl = function crawl(cb) {
  var self  = this,
      calls = {};

  this.results = {};

  this._config.sites.map(function(site) {
    calls[site] = function(cb) { self.retrieve(site, cb) };
  });
  async.parallel(calls, function(err, results) {
    self.results = results;
    cb(err, results);
  });
}

Crawler.prototype.retrieve = function retrieve(url, cb) {
  http.get(url, function(res) {
    var str = '';

    res.on('data', function(chunk) {
      str += chunk;
    });

    res.on('end', function() {
      if (res.statusCode >= 400) {
        cb(new Error('StatusCode ' + res.statusCode + '\nResponse: ' + str));
      } else {
        cb(null, str);
      }
    });
  }).on('error', function(err) {
    cb(err);
  });
};

module.exports = Crawler;
