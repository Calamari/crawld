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
  });
});
