var fs     = require('fs'),
    async  = require('async'),
    path   = require('path'),
    rimraf = require('rimraf'),
    chai   = require('chai'),
    sinon  = require('sinon'),
    expect = chai.expect;

var redis  = require('redis'),
    client = redis.createClient();

var Page = require('../src/page.js'),
    testDownloadPath = path.join(__dirname, 'downloaded-files');

describe('Page', function() {
  before(function() {
    Page.downloadPath = testDownloadPath;
  });
  describe('#store', function() {
    // Delete all keys from database
    afterEach(function(done) {
      client.keys('crawld:pages:*', function(err, keys) {
        async.parallel(
          keys.map(function(key) {
            return function(cb) { client.del(key, cb); };
          })
        , done);
      });
    });

    // Delete all files from filesystem
    afterEach(function(done) {
      fs.readdir(testDownloadPath, function(err, files) {
        async.parallel(
          files.map(function(file) {
            return function(cb) { rimraf(path.join(testDownloadPath, file), cb); };
          })
        , done);
      });
    });

    it('saves the content into database', function(done) {
      var url  = 'http://page1.com',
          html = '<html>My Page One</html>',

          page = new Page(url);

      page.store(html, function() {
        client.keys('crawld:pages:*', function(err, replies) {
          expect(replies).to.have.length(1);
          expect(replies[0]).to.contain(url);

          client.hget(replies[0], 'content', function(err, content) {
            expect(content).to.equal(html);
            done(err);
          });
        });
      });
    });

    it('saves the content to filesystem as well', function(done) {
      var url  = 'http://page2.com',
          html = '<html>My Page Two</html>',

          page = new Page(url);

      page.store(html, function() {
        fs.readdir(path.join(testDownloadPath, encodeURIComponent(url)), function(err, files) {
          expect(files).to.have.length(1);

          var file = fs.readFileSync(path.join(testDownloadPath, encodeURIComponent(url), files[0])).toString();
          expect(file).to.equal(html);
          done(err);
        });
      });
    });
  });
});
