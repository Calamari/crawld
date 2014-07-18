var fs     = require('fs'),
    async  = require('async'),
    path   = require('path'),
    rimraf = require('rimraf'),
    moment = require('moment');

var Page = require('../src/page.js'),
    testDownloadPath = path.join(__dirname, 'downloaded-files');

describe('Page', function() {
  before(function() {
    Page.downloadPath = testDownloadPath;
  });

  describe('#getLastChangedPage', function() {
    var url1 = 'http://page1.com',
        url2 = 'http://page2.com',
        page;

    beforeEach(function(done) {
      Page.remove(done);
    });
    beforeEach(function(done) {
      Page.remove(done);
    });
    beforeEach(function(done) {
      page = new Page({
        url: url1,
        lastProcessed: new Date(2001,2),
        pages: [
          {
            body: 'one',
            createdAt: new Date(2000,1),
            changed: false
          },
          {
            body: 'two',
            createdAt: new Date(2001,1),
            changed: true
          },
          {
            body: 'three',
            createdAt: new Date(2002,1),
            changed: true
          },
          {
            body: 'four',
            createdAt: new Date(2003,1),
            changed: true
          },
          {
            body: 'four',
            createdAt: new Date(2004,1),
            changed: false
          }
        ]
      });
      page.save(done);
    });
    beforeEach(function(done) {
      page2 = new Page({
        url: url2,
        lastProcessed: new Date(2002,2),
        pages: [
          {
            body: 'one',
            createdAt: new Date(2000,1),
            changed: false
          },
          {
            body: 'two',
            createdAt: new Date(2001,1),
            changed: true
          },
          {
            body: 'three',
            createdAt: new Date(2002,1),
            changed: true
          },
          {
            body: 'three',
            createdAt: new Date(2003,1),
            changed: false
          },
          {
            body: 'three',
            createdAt: new Date(2004,1),
            changed: false
          }
        ]
      });
      page.save(done);
    });

    it('returns the page that was lastProcessed', function() {
      var foundVersion = page.getLastChangedPage();
      expect(foundVersion.body).to.eql('three');
    });

    it('returns null if there is no unprocessed change', function() {
      var foundVersion = page2.getLastChangedPage();
      expect(foundVersion).to.eql(null);
    });
  });

  describe('#store', function() {
    var url1 = 'http://page1.com';
    var url2 = 'http://page2.com';

    // Delete all keys from database
    beforeEach(function(done) {
      Page.remove(done);
    });
    beforeEach(function(done) {
      page = new Page({ url: url1 });
      page.save(done);
    });
    beforeEach(function(done) {
      page = new Page({ url: url2 });
      page.save(done);
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
      var html = '<html>My Page One</html>';

      Page.store(url1, html, function() {
        Page.findOne({ url: url1 }, function(err, page) {
          expect(page.pages).to.have.length(1);

          expect(page.pages[0].body).to.equal(html);
          expect(page.pages[0].changed).to.equal(false);
          done(err);
        });
      });
    });

    it('saves the content to filesystem as well', function(done) {
      var html = '<html>My Page Two</html>';

      Page.store(url2, html, function() {
        fs.readdir(path.join(testDownloadPath, encodeURIComponent(url2)), function(err, files) {
          expect(files).to.have.length(1);

          var file = fs.readFileSync(path.join(testDownloadPath, encodeURIComponent(url2), files[0])).toString();
          expect(file).to.equal(html);
          done(err);
        });
      });
    });

    describe('having an older version of a page', function() {
      var html = '<html><title>My Page One</title><body>content</body></html>';

      beforeEach(function(done) {
        Page.store(url1, html, done);
      });

      it('saves a flag to database if it has changed to previous version', function(done) {
        Page.store(url1, html+'xxxxx', function() {
          Page.findOne({ url: url1 }, function(err, page) {
            expect(page.pages).to.have.length(2);

            expect(page.pages[1].body).to.equal(html+'xxxxx');
            expect(page.pages[1].changed).to.equal(true);
            done(err);
          });
        });
      });

      it('does not save the changed flag to database if it has NOT changed', function(done) {
        Page.store(url1, html, function() {
          Page.findOne({ url: url1 }, function(err, page) {
            expect(page.pages).to.have.length(2);

            expect(page.pages[1].body).to.equal(html);
            expect(page.pages[1].changed).to.equal(false);
            done(err);
          });
        });
      });

      describe('using a config', function() {
        var url3 = 'http://page3.com';
        var config = { within: ['body'] };

        beforeEach(function(done) {
          page = new Page({ url: url3, config: config });
          page.save(done);
        });
        beforeEach(function(done) {
          Page.store(url3, html, done);
        });

        it('saves a flag to database if it has changed within config', function(done) {
          Page.store(url3, html.replace('content', 'changed content'), function() {
            Page.findOne({ url: url3 }, function(err, page) {
              expect(page.pages).to.have.length(2);

              expect(page.pages[1].changed).to.equal(true);
              done(err);
            });
          });
        });

        it('does not save a changed flag if it has NOT changed within config', function(done) {
          Page.store(url3, html.replace('Page One', 'Page One-Two'), function() {
            Page.findOne({ url: url3 }, function(err, page) {
              expect(page.pages).to.have.length(2);

              expect(page.pages[1].changed).to.equal(false);
              done(err);
            });
          });
        });
      });
    });
  });
});
