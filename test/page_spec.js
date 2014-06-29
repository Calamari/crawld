var fs     = require('fs'),
    async  = require('async'),
    chai   = require('chai'),
    sinon  = require('sinon'),
    expect = chai.expect;

var redis  = require('redis'),
    client = redis.createClient();

var Page = require('../src/page.js');

describe('Page', function() {
  describe('#store', function() {
    afterEach(function(done) {
      client.keys('crawld:pages:*', function(err, keys) {
        // Delete all keys
        async.parallel(
          keys.map(function(key) {
            return function(cb) { client.del(key, cb); };
          })
        , done);
      });
    });

    it('saves the content into database', function(done) {
      var url  = 'http://page1.com',
          html = '<html>My Page One</html>';
      Page.store(url, html, function() {
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
  });
});
