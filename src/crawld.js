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
  console.log("do", Object.keys(config.pages));
  (new Crawler({ sites: Object.keys(config.pages) })).crawl(function(err, results) {
    if (err) { return cb(err); }
    var count = 0;
    var resultKeys = Object.keys(results);
    resultKeys.forEach(function(url) {
      console.log(url, count, resultKeys.length);
      function storeIt() {
        Page.store(url, results[url], function(err) {
          console.log("page stored", url, err);
          if (++count === resultKeys.length) {
            cb(err);
          }
        });
      }

      console.log("about to save", { url: url });
      Page.findOne({ url: url }, function(err, page) {
        console.log("found?", err, page);
        if (!page) {
          console.log("save page", { url: url, config: config.pages[url] });
          var page = new Page({ url: url, config: config.pages[url] });
          page.save(function(err) {
            console.log("saved", err);
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
