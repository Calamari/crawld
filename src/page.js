var fs     = require('fs'),
    path   = require('path'),
    async  = require('async'),
    moment = require('moment'),
    mongoose = require('mongoose'),

    ChangeChecker = require('./change_checker.js');


var PageSchema = new mongoose.Schema({
  config: mongoose.SchemaTypes.Mixed,
  url: { type: String, index: true },
  lastProcessed: Date,
  pages: [{
    body: String,
    createdAt: Date,
    changed: Boolean
  }]
});

PageSchema.methods.lastChange = function lastChange() {
  for (var i=this.pages.length; i--;) {
    if (this.pages[i].changed) {
      return this.pages[i].createdAt;
    }
  }
};

PageSchema.methods.hasChanged = function hasChanged() {
  return !!this.getLastChangedPage();
};

PageSchema.methods.getLastChangedPage = function getLastChangedPage() {
  var changed = null,
      lastProcessed = moment(this.lastProcessed);

  for (var i=this.pages.length; i--;) {
    if (this.lastProcessed && lastProcessed > moment(this.pages[i].createdAt)) {
      break;
    }
    if (this.pages[i].changed) {
      changed = this.pages[i];
    }
  }

  return changed;
};


PageSchema.statics.store = function store(url, content, cb) {
  var Page = this;

  this.findOne({ url: url }, function(err, page) {
    if (err) { return cb(err); }
    if (!page) { return cb(new Error('Page does not exist.')); }

    var self         = page,
        now          = moment(),
        nowFormatted = now.format('YYYYMMDDhhmmss');

    async.parallel([
      function saveToDb(cb) {
        var checker     = new ChangeChecker(content, self.config),
            lastContent = self.pages.length && self.pages[self.pages.length-1].body,
            hasChanged  = lastContent && checker.hasChangedTo(lastContent);

        self.pages.push({
          body: content,
          createdAt: now.toDate(),
          changed: hasChanged
        });
        self.save(cb);
      },
      function(cb) {
        var pageDir = path.join(Page.downloadPath, encodeURIComponent(self.url));
        fs.mkdir(pageDir, function() {
          fs.writeFile(path.join(pageDir, nowFormatted), content, cb);
        });
      }
    ], cb);
  });
};

Page = mongoose.model('Page', PageSchema);

Page.downloadPath = process.env.CRAWLD_PATH;

module.exports = Page;
