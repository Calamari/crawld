var Crawler = require('./crawler.js'),
    Page    = require('./page.js');


function Crawld(config) {
  this._config = config;
}

Crawld.prototype.run = function run(cb) {
  (new Crawler(this._config.pages)).crawl(function(err, results) {
    Object.keys(results).forEach(function(url) {
      (new Page(url)).store(results[url]);
    });
    cb(err);
  });
};
module.exports = Crawld;
