var fs         = require('fs'),
    chai       = require('chai'),
    sinon      = require('sinon'),
    proxyquire = require('proxyquire'),
    sinonChai  = require("sinon-chai"),
    expect     = chai.expect;

chai.use(sinonChai);

var CrawlerStub = sinon.stub();
CrawlerStub.prototype.crawl = sinon.stub();

var PageStub = sinon.stub();

var Crawler = proxyquire('../src/crawld', {
  './crawler.js': CrawlerStub,
  './page.js': PageStub
});
var Crawld = require('../src/crawld.js');
var Page   = require('../src/page.js');

describe('Crawld', function() {
  describe('#run', function() {
    var config = { pages: ['http://page2'] };

    beforeEach(function() {
      CrawlerStub.prototype.crawl.reset();
      this.crawld = new Crawld(config);

      sinon.stub(Page.prototype, 'store');
    });

    afterEach(function() {
      Page.prototype.store.restore();
    });

    it('calls crawler with a list of pages', function() {
      this.crawld.run(function() {});
      expect(CrawlerStub).to.have.been.calledWith(config.pages);
    });

    it('calls crawl on crawler instance', function() {
      this.crawld.run(function() {});
      expect(CrawlerStub.prototype.crawl).to.have.been.calledOnce;
    });

    it('calls Page.store with every page', function(done) {
      var page1 = { store: sinon.spy() },
          page2 = { store: sinon.spy() };
      CrawlerStub.prototype.crawl.yieldsAsync(null, {
        'http://page1': 'Page1 content',
        'http://page2': 'Page2 content'
      });
      PageStub.withArgs('http://page1').returns(page1);
      PageStub.withArgs('http://page2').returns(page2);

      this.crawld.run(function(err) {
        expect(PageStub).to.have.been.calledTwice;
        expect(page1.store).to.have.been.calledWith('Page1 content');
        expect(page2.store).to.have.been.calledWith('Page2 content');
        done(err);
      });
    });

    it('can have more extensive config for pages', function(done) {
      var config = { pages: [{ url: 'http://page2', within: 'body div' }] },
          crawld = new Crawld(config),
          page   = { store: sinon.spy() };

      CrawlerStub.prototype.crawl.yieldsAsync(null, {
        'http://page2': 'Page2 content'
      });
      PageStub.returns(page);

      crawld.run(function(err) {
        expect(CrawlerStub).to.have.been.calledWith([config.pages[0].url]);
        expect(PageStub).to.have.been.calledWith(config.pages[0].url, config.pages[0]);
        done(err);
      });
    });
  });
});
