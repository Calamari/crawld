var redis  = require('redis'),
    fs     = require('fs'),
    path   = require('path'),
    async  = require('async'),
    moment = require('moment'),
    client = redis.createClient();


function Page() {
}

Page.store = function store(page, content, cb) {
  var now = moment().format('YYYYMMDDhhmmss');
  async.parallel([
    function(cb) { client.hset('crawld:pages:' + page + ':' + now, 'content', content, cb); },
    function(cb) {
      var pageDir = path.join(Page.downloadPath, encodeURIComponent(page));
      fs.mkdir(pageDir, function() {
        fs.writeFile(path.join(pageDir, now), content, cb);
      });
    }
  ], cb);
};

module.exports = Page;
