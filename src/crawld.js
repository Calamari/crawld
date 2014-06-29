var Crawler = require('./crawler.js'),
    Page    = require('./page.js');


function Crawld(config) {
  this._config = config;
}

Crawld.prototype.run = function run(cb) {
  (new Crawler(this._config.pages)).crawl(function(err, results) {
    Object.keys(results).forEach(function(page) {
      Page.store(page, results[page]);
    });
    cb(err);
  });
};
module.exports = Crawld;
