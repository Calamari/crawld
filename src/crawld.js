var Crawler = require('./crawler.js'),
    Page    = require('./page.js');


function Crawld(config) {
  this._config = {};
  config.pages.forEach(function(conf) {
    if (typeof conf === 'string') {
      this._config[conf] = {};
    } else {
      this._config[conf.url] = conf;
    }
  }, this);
}

Crawld.prototype.run = function run(cb) {
  var config = this._config;
  (new Crawler(Object.keys(config))).crawl(function(err, results) {
    Object.keys(results).forEach(function(url) {
      (new Page(url, config[url])).store(results[url]);
    });
    cb(err);
  });
};
module.exports = Crawld;
