var Crawler = require('./crawler.js'),
    Page    = require('./page.js'),
    async   = require('async');

function Crawld(config) {
  this._config = { pages: {} };
  config.pages.forEach(function(conf) {
    if (typeof conf === 'string') {
      this._config.pages[conf] = {};
    } else {
      this._config.pages[conf.url] = conf;
    }
  }, this);
}

Crawld.prototype.run = function run(cb) {
  var config = this._config;
  console.log("RUN", config);
  (new Crawler({ sites: Object.keys(config.pages) })).crawl(function(err, results) {
    console.log("results", results);
    if (err) { return cb(err); }
    var count = 0;
    var resultKeys = Object.keys(results);
    resultKeys.forEach(function(url) {
      function storeIt() {
        Page.store(url, results[url], function(err) {
          if (++count === resultKeys.length) {
            cb(err);
          }
        });
      }

      Page.findOne({ url: url }, function(err, page) {
        if (!page) {
          var page = new Page({ url: url, config: config.pages[url] });
          page.save(function() {
            storeIt();
          });
        } else {
          storeIt();
        }
      });
    });
  });
};
module.exports = Crawld;
