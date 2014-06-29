var fs         = require('fs'),
    chai       = require('chai'),
    sinon      = require('sinon'),
    proxyquire = require('proxyquire'),
    sinonChai  = require("sinon-chai"),
    expect     = chai.expect;

chai.use(sinonChai);

var CrawlerStub = sinon.stub();
CrawlerStub.prototype.crawl = sinon.stub();

var Crawler = proxyquire('../src/crawld', {
  './crawler.js': CrawlerStub
});
var Crawld = require('../src/crawld.js');
var Page   = require('../src/page.js');

describe('Crawld', function() {
  describe('#run', function() {
    var config = { pages: ['http://page1', 'http://page2'] };

    beforeEach(function() {
      CrawlerStub.prototype.crawl.reset();
      this.crawld = new Crawld(config);

      sinon.stub(Page, 'store');
    });

    afterEach(function() {
      Page.store.restore();
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
      CrawlerStub.prototype.crawl.yieldsAsync(null, {
        'http://page1': 'Page1 content',
        'http://page2': 'Page2 content'
      });

      this.crawld.run(function(err) {
        expect(Page.store).to.have.been.calledTwice;
        expect(Page.store).to.have.been.calledWith('http://page1', 'Page1 content');
        expect(Page.store).to.have.been.calledWith('http://page2', 'Page2 content');
        done(err);
      });
    });
  });
});
