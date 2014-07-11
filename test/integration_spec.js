var fs     = require('fs'),
    async  = require('async'),
    path   = require('path'),
    nock   = require('nock'),
    moment = require('moment'),
    Crawld = require('../src/crawld');

var Crawler = require('../src/crawler.js'),
    Crawld  = require('../src/crawld.js'),
    Page    = require('../src/page.js');

var testDownloadPath = path.join(__dirname, 'downloaded-files');

describe('Integration', function() {
  var URL1 = 'http://page1.com',
      URL2 = 'http://page2.com';

  before(function() {
    console.log(9);
    Page.downloadPath = testDownloadPath;
  });
  before(function(done) {
    console.log(8);
    Page.remove(done);
  });

  before(function() {
    console.log(7);
    this.crawld = new Crawld({
      pages: [
        { url: URL1, within: '.tribe-events-loop' },
        URL2
      ]
    });
  });

  // Delete all "downloaded" files from filesystem
  after(function(done) {
    rimraf(testDownloadPath, function() {
      fs.mkdir(testDownloadPath, function() { done(); });
    });
  });


  describe('on first run', function() {
    var formattedTime = '20140101000000',
        HTML1         = fs.readFileSync('test/fixtures/wcscafe1.html').toString(),
        HTML2         = fs.readFileSync('test/fixtures/wcscafe2.html').toString();

    before(function(done) {
      console.log(6);
      nock(URL1).get('/').reply(200, HTML1);
      nock(URL2).get('/').reply(200, HTML2);
      this.clock = sinon.useFakeTimers(moment('2014-01-01').toDate().getTime());

      this.crawld.run(done);
    });
    after(function() {
      this.clock.restore();
    });

    it.skip('adds first requested pages to database', function(done) {
    });

    it.skip('adds second requested pages to database', function(done) {
    });

    it('saves first page to filesystem', function(done) {
      console.log(1);
      var filename = path.join(testDownloadPath, encodeURIComponent(URL1), formattedTime);
      console.log("filename", filename);
      fs.readFile(filename, function(err, content) {
        console.log("finish", arguments);
        expect(content).to.equal(HTML1);
        done(err);
      });
    });

    it('saves second page to filesystem', function(done) {
      var filename = path.join(testDownloadPath, encodeURIComponent(URL2), formattedTime);
      fs.readFile(filename, function(err, content) {
        console.log(arguments);
        expect(content).to.equal(HTML2);
        done(err);
      });
    });

    it.skip('all pages have changed flag false', function() {

    });
  });

  describe('on second run', function() {
    before(function(done) {
      this.crawld.run(done);
    });

    it.skip('adds new versions of pages to database', function() {

    });

    it.skip('saves new versions of pages to filesystem', function() {

    });

    it.skip('changed pages have changed flag true', function() {

    });
  });
});
