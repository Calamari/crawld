var fs         = require('fs');

var Crawler = require('../src/crawler.js'),
    Crawld  = require('../src/crawld.js'),
    Page    = require('../src/page.js');


describe('Crawld', function() {
  describe('#run', function() {
    var config = { pages: ['http://page2'] };

    beforeEach(function() {
      sinon.stub(Crawler.prototype, 'crawl');
      this.crawld = new Crawld(config);

      sinon.stub(Page.prototype, 'store');
    });

    afterEach(function() {
      Crawler.prototype.crawl.restore();
      Page.prototype.store.restore();
    });

    it('calls crawler with a list of pages', function() {
      Page.prototype.store.restore();
      sinon.stub(Page.prototype, 'store', function(content, cb) {
        expect(this.config).to.eql(null);
        expect(this.url).to.eql(config.pages[0]);
        done();
      });

      this.crawld.run(function(err) {
        if (err) { done(err); }
      });
    });

    it('calls crawl on crawler instance', function() {
      this.crawld.run(function() {});
      expect(Crawler.prototype.crawl).to.have.been.calledOnce;
    });

    it('calls Page.store with every page', function(done) {
      var page1 = { store: sinon.spy() },
          page2 = { store: sinon.spy() };
      Crawler.prototype.crawl.yieldsAsync(null, {
        'http://page1': 'Page1 content',
        'http://page2': 'Page2 content'
      });

      this.crawld.run(function(err) {
        expect(Page.prototype.store).to.have.been.calledWith('Page1 content');
        expect(Page.prototype.store).to.have.been.calledWith('Page2 content');
        done(err);
      });
    });

    it('can have more extensive config for pages', function(done) {
      var config = { pages: [{ url: 'http://page2', within: 'body div' }] },
          crawld = new Crawld(config);

      Page.prototype.store.restore();
      sinon.stub(Page.prototype, 'store', function(content, cb) {
        expect(this.config).to.eql(config.pages[0]);
        expect(this.url).to.eql(config.pages[0].url);
        done();
      });

      Crawler.prototype.crawl.yieldsAsync(null, {
        'http://page2': 'Page2 content'
      });

      crawld.run(function(err) {
        if (err) { done(err); }
      });
    });
  });
});
