var redis  = require('redis'),
    fs     = require('fs'),
    path   = require('path'),
    async  = require('async'),
    moment = require('moment'),
    client = redis.createClient(),

    ChangeChecker = require('./change_checker.js');


function Page(url, config) {
  this.url = url;
  this.config = config;
  this.storageKey = Page.storagePrefix + ':pages:' + url;
  this.storageIndexKey = Page.storagePrefix + ':pages:currents:' + url;
}

Page.storagePrefix = 'crawld';
Page.downloadPath = process.env.CRAWLD_PATH;

Page.prototype.store = function store(content, cb) {
  var now  = moment().format('YYYYMMDDhhmmss'),
      self = this;

  client.get(this.storageIndexKey, function(err, lastVersion) {
    async.parallel([
      function storeChangedFlag(cb) {
        if (lastVersion) {
          client.hget(self.storageKey + ':' + lastVersion, 'content', function(err, lastContent) {
            var checker = new ChangeChecker(content, self.config);
            if (checker.hasChangedTo(lastContent)) {
              client.hset(self.storageKey + ':' + now, 'changed', lastVersion, cb);
            } else {
              cb();
            }
          });
        } else {
          cb();
        }
      },
      function saveToDb(cb) {
        client.hset(self.storageKey + ':' + now, 'content', content, function() {
          client.set(self.storageIndexKey, now, cb);
        });
      },
      function(cb) {
        var pageDir = path.join(Page.downloadPath, encodeURIComponent(self.url));
        fs.mkdir(pageDir, function() {
          fs.writeFile(path.join(pageDir, now), content, cb);
        });
      }
    ], cb);
  });
};

module.exports = Page;
