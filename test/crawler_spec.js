var fs     = require('fs'),
    chai   = require('chai'),
    nock   = require('nock'),
    sinon  = require('sinon'),
    expect = chai.expect;

var Crawler = require('../src/crawler.js');

// Disable real http requests
nock.disableNetConnect();

describe('Crawler', function() {
  it('does not have a result if crawl is not called', function() {
    expect((new Crawler()).results).to.be.undefined;
  });

  describe('#retrieve', function() {
    var HTML = '<html><title>My Aweome page</title></html>';

    before(function() {
      nock('http://my.awesomne.ss').get('/').reply(200, HTML);
      nock('http://no.awesomne.ss').get('/').reply(404, '404');

      this.crawler = new Crawler();
    });

    it('fetches the wanted page and returns it to callback', function(done) {
      this.crawler.retrieve('http://my.awesomne.ss', function(err, page) {
        expect(page).to.eql(HTML);
        done(err);
      });
    });

    it('returns error if 404 happens', function(done) {
      this.crawler.retrieve('http://no.awesomne.ss', function(err, page) {
        expect(err.message).to.contain('404');
        done();
      });
    });

    it('returns error if request is errornous', function(done) {
      this.crawler.retrieve('http://somewhe.re/else', function(err, page) {
        expect(err.message).to.contain('Nock: Not allow');
        done();
      });
    });
  });

  describe('#crawl', function() {
    var PAGE1 = 'http://my.awesomne.ss';
    var PAGE2 = 'http://dance.me';
    var HTML1 = '<html><title>My Aweome page</title></html>';
    var HTML2 = '<html><title>Dance with somebody</title></html>';
    var results;

    before(function(done) {
      nock(PAGE1).get('/').reply(200, HTML1);
      nock(PAGE2).get('/').reply(200, HTML2);

      this.crawler = new Crawler({
        sites: [ PAGE1, PAGE2 ]
      });
      this.crawler.crawl(function(err, r) {
        results = r;
        done(err);
      });
    });

    it('stores a list of results of each crawling', function() {
      expect(Object.keys(this.crawler.results)).to.have.length(2);
    });

    it('makes HTML of each page available on results', function() {
      expect(this.crawler.results[PAGE1]).to.equal(HTML1);
      expect(this.crawler.results[PAGE2]).to.equal(HTML2);
    });

    it('passes the list of results to callback', function() {
      expect(results).to.have.eql(this.crawler.results);
    });
  });
});
