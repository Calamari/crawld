var fs     = require('fs'),
    chai   = require('chai'),
    expect = chai.expect;

var ChangeChecker = require('../src/change_checker.js');

var wcsCafe1 = fs.readFileSync('test/fixtures/wcscafe1.html').toString();
var wcsCafe2 = fs.readFileSync('test/fixtures/wcscafe2.html').toString();
var wcsCafe3 = fs.readFileSync('test/fixtures/wcscafe3.html').toString();

describe('ChangeChecker', function() {
  describe('#hasChangedTo', function() {
    describe('without a configuration', function() {
      before(function() {
        this.checker = new ChangeChecker(wcsCafe1);
      });

      it('returns false for exactly the same page', function() {
        expect(this.checker.hasChangedTo(wcsCafe1)).to.false;
      });

      it('returns true for a changed page', function() {
        expect(this.checker.hasChangedTo(wcsCafe2)).to.true;
      });
    });

    describe('given a simple configuration', function() {
      before(function() {
        this.checker = new ChangeChecker(wcsCafe1, {
          within: '#menu-mainmenu'
        });
        this.checker2 = new ChangeChecker(wcsCafe1, {
          within: '.tribe-events-loop'
        });
      });

      it('returns false for exactly the same page', function() {
        expect(this.checker.hasChangedTo(wcsCafe1)).to.false;
      });

      it('returns false if changed page did not change in that part', function() {
        expect(this.checker.hasChangedTo(wcsCafe2)).to.false;
      });

      it('returns true if changed page did change in that part', function() {
        expect(this.checker2.hasChangedTo(wcsCafe2)).to.true;
      });
    });

    describe('given a configuration with multiple areas', function() {
      before(function() {
        this.checker = new ChangeChecker(wcsCafe1, {
          within: ['#menu-mainmenu', '.tribe-events-loop']
        });
      });

      it('returns false if no watched part has changed', function() {
        expect(this.checker.hasChangedTo(wcsCafe1)).to.false;
      });

      it('returns true if changed page did change in one of that parts', function() {
        expect(this.checker.hasChangedTo(wcsCafe2)).to.true;
      });

      it('returns true if every part has changed', function() {
        expect(this.checker.hasChangedTo(wcsCafe3)).to.true;
      });
    });

    describe('given a configuration with multiple areas and broken html', function() {
      var brokenHtml1 = '<html><title>Test</title><body>x</html>';
      var brokenHtml2 = '<html><title>Test</title><body>xy</html>';
      var brokenHtml3 = '<html><title>Test2</title><body>x</html>';
      before(function() {
        this.checker = new ChangeChecker(brokenHtml1, {
          within: ['body']
        });
      });

      it('returns false if no watched part has changed', function() {
        expect(this.checker.hasChangedTo(brokenHtml1)).to.false;
      });

      it('returns true if changed page did change in one of that parts', function() {
        expect(this.checker.hasChangedTo(brokenHtml2)).to.true;
      });

      it('returns false if another part has changed only', function() {
        expect(this.checker.hasChangedTo(brokenHtml3)).to.false;
      });
    });

    describe('given a configuration where area occures multiple times', function() {
      var html1 = '<html><div>Test</div><div>x</div></html>';
      var html2 = '<html><div>Test</div><div>x</div><div>x2</div></html>';
      var html3 = '<html><div>Test</div><div>x2</div></html>';
      before(function() {
        this.checker = new ChangeChecker(html1, {
          within: ['div']
        });
      });

      it('returns false if no watched part has changed', function() {
        expect(this.checker.hasChangedTo(html1)).to.false;
      });

      it('returns true if number of occurances differs between pages', function() {
        expect(this.checker.hasChangedTo(html2)).to.true;
      });

      it('returns true if changed page did change in one of that occurances', function() {
        expect(this.checker.hasChangedTo(html3)).to.true;
      });
    });
  });
});
