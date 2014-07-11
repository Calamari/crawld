var fs      = require('fs'),
    path    = require('path'),
    mongoose= require('mongoose'),
    rimraf  = require('rimraf');

var Crawler = require('../src/crawler.js'),
    Crawld  = require('../src/crawld.js'),
    Page    = require('../src/page.js');

var testDownloadPath = path.join(__dirname, 'downloaded-files');

describe('Crawld', function() {
  describe('#run', function() {
    var config = { pages: ['http://page1', { url: 'http://page2', within: 'body div' }] };

    before(function() {
      Page.downloadPath = testDownloadPath;
    });
    beforeEach(function(done) {
      Page.remove(done);
    });
    beforeEach(function() {
      sinon.stub(Crawler.prototype, 'crawl');
      Crawler.prototype.crawl.yieldsAsync(null, {
        'http://page1': 'Page1 content',
        'http://page2': 'Page2 content'
      });
      this.crawld = new Crawld(config);

      sinon.stub(Page, 'store').yields();
    });

    afterEach(function() {
      Crawler.prototype.crawl.restore();
      Page.store.restore();
    });

    // Delete all "downloaded" files from filesystem
    afterEach(function(done) {
      rimraf(testDownloadPath, function() {
        fs.mkdir(testDownloadPath, function() { done(); });
      });
    });

    it('calls crawler with a list of pages', function(done) {
      sinon.stub(Page, 'findOne').yields(null, {});
      this.crawld.run(function(err) {
        if (err) { return done(err); }
        expect(Page.store).to.have.been.calledWith(config.pages[0], 'Page1 content');
        expect(Page.store).to.have.been.calledWith(config.pages[1].url, 'Page2 content');

        Page.findOne.restore();
        done(err);
      });
    });

    it('calls crawl on crawler instance', function(done) {
      this.crawld.run(function(err) {
        expect(Crawler.prototype.crawl).to.have.been.calledOnce;
        done(err);
      });
    });

    it('calls Page.store with every page', function(done) {
      this.crawld.run(function(err) {
        expect(Page.store).to.have.been.calledWith('http://page1', 'Page1 content');
        expect(Page.store).to.have.been.calledWith('http://page2', 'Page2 content');
        done(err);
      });
    });

    it('creates pages that do not exist yet', function(done) {
      this.crawld.run(function(err) {
        Page.find(function(err, docs) {
          expect(docs).to.have.length(2);
          done(err);
        });
      });
    });
  });
});
