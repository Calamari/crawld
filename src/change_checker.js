var cheerio = require('cheerio');

function ChangeChecker(website, config) {
  this._config = config;
  this._website = website;
  this.$ = cheerio.load(website);
}

ChangeChecker.prototype.hasChangedTo = function hasChangedTo(website) {
  if (this._website !== website) {
    var $ = cheerio.load(website);

    if (this._config) {
      if (Array.isArray(this._config.within)) {
        return !this._config.within.every(function(within) {
          if ($(within).length === this.$(within).length) {
            for (var l=$(within).length; l--;) {
              if ($(within).eq(l).html() !== this.$(within).eq(l).html()) {
                return false;
              }
            }
            return true;
          } else {
            return false;
          }
                  $(within).every(function(item) {})
        }, this);
      } else {
        return $(this._config.within).html() !== this.$(this._config.within).html();
      }
    } else {
      return true;
    }
  } else {
    return false;
  }
};

module.exports = ChangeChecker;
