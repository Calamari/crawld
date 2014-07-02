var fs     = require('fs'),
    async  = require('async'),
    path   = require('path'),
    rimraf = require('rimraf'),
    moment = require('moment');

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
      client.keys('crawld_test:pages:*', function(err, keys) {
        async.parallel(
          keys.map(function(key) {
            return function(cb) { client.del(key, cb); };
          })
        , done);
      });
    });
    afterEach(function(done) {
      client.keys('crawld_test:pages:index:*', done);
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
        client.keys('crawld_test:pages:*', function(err, replies) {
          replies = replies.filter(function(r) { return r.indexOf('currents') === -1; });
          expect(replies).to.have.length(1);
          expect(replies[0]).to.contain(url);

          client.hget(replies[0], 'content', function(err, content) {
            expect(content).to.equal(html);
            done(err);
          });
        });
      });
    });

    it('saves to db which version is the actual one', function(done) {
      var url  = 'http://page1.com',
          html = '<html>My Page One</html>',

          page = new Page(url);

      page.store(html, function() {
        client.keys('crawld_test:pages:*', function(err, replies) {
        client.get('crawld_test:pages:currents:' + url, function(err, value) {
          expect(value).to.contain(moment().format('YYYYMMDD'));
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

    describe('having an older version of a page', function() {
      var url  = 'page1.com',
          html = '<html><title>My Page One</title><body>content</body></html>';

      beforeEach(function(done) {
        client.hset('crawld_test:pages:' + url + ':20140101120000', 'content', html, done);
      });
      beforeEach(function(done) {
        client.set('crawld_test:pages:currents:' + url, '20140101120000', done);
      });
      beforeEach(function(done) {
        client.hget('crawld_test:pages:' + url + ':20140101120000', 'content', function() {
          done();
        });
      });

      it('saves a flag to database if it has changed to previous version', function(done) {
        var page = new Page(url);

        page.store(html+'xxxxx', function() {
          client.keys('crawld_test:pages:' + url + ':*', function(err, replies) {
            replies = replies.sort();
            expect(replies).to.have.length(2);

            client.hget(replies[1], 'changed', function(err, changedTo) {
              expect(changedTo).to.equal('20140101120000');
              done(err);
            });
          });
        });
      });

      it('does not save the changed flag to database if it has NOT changed', function(done) {
        var page = new Page(url);

        page.store(html, function() {
          client.keys('crawld_test:pages:' + url + ':*', function(err, replies) {
            replies = replies.sort();
            expect(replies).to.have.length(2);

            client.hget(replies[1], 'changed', function(err, changedTo) {
              expect(changedTo).to.be.null;
              done(err);
            });
          });
        });
      });

      it('does not save a changed flag if there is no previous version', function(done) {
        var page = new Page('page2.com');

        page.store(html, function() {
          client.keys('crawld_test:pages:' + url + ':*', function(err, replies) {
            replies = replies.sort();
            expect(replies).to.have.length(1);

            client.hget(replies[0], 'changed', function(err, changedTo) {
              expect(changedTo).to.be.null;
              done(err);
            });
          });
        });
      });

      describe('using a config', function() {
        var config = { within: ['body'] };

        it('saves a flag to database if it has changed within config', function(done) {
          var page = new Page(url, config);

          page.store(html.replace('content', 'changed content'), function() {
            client.keys('crawld_test:pages:' + url + ':*', function(err, replies) {
              replies = replies.sort();
              expect(replies).to.have.length(2);

              client.hget(replies[1], 'changed', function(err, changedTo) {
                expect(changedTo).to.equal('20140101120000');
                done(err);
              });
            });
          });
        });

        it('does not save a changed flag if it has NOT changed within config', function(done) {
          var page = new Page(url, config);

          page.store(html.replace('Page One', 'Page One-Two'), function() {
            client.keys('crawld_test:pages:' + url + ':*', function(err, replies) {
              replies = replies.sort();
              expect(replies).to.have.length(2);

              client.hget(replies[1], 'changed', function(err, changedTo) {
                expect(changedTo).to.be.null;
                done(err);
              });
            });
          });
        });
      });
    });
  });
});
