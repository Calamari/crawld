var redis  = require('redis'),
    fs     = require('fs'),
    path   = require('path'),
    async  = require('async'),
    moment = require('moment'),
    client = redis.createClient();


function Page(url) {
  this.url = url;
  this.storageKey = 'crawld:pages:' + url;
}

Page.downloadPath = process.env.CRAWLD_PATH;

Page.prototype.store = function store(content, cb) {
  var now  = moment().format('YYYYMMDDhhmmss'),
      self = this;

  async.parallel([
    function(cb) { client.hset(self.storageKey + ':' + now, 'content', content, cb); },
    function(cb) {
      var pageDir = path.join(Page.downloadPath, encodeURIComponent(self.url));
      fs.mkdir(pageDir, function() {
        fs.writeFile(path.join(pageDir, now), content, cb);
      });
    }
  ], cb);
};

module.exports = Page;
