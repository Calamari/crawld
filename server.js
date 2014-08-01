var express  = require('express'),
    mongoose = require('mongoose'),
    moment   = require('moment'),
    path     = require('path'),
    app      = express(),
    cons     = require('consolidate'),
    config   = require('./config.json'),
    Page     = require('./src/page.js');

Page.downloadPath = path.join(__dirname, config.downloadPath)

mongoose.connect([
  'mongodb://',config.mongodb.url,':',config.mongodb.port,'/',config.mongodb.name
].join(''));

// Page.store("http://page2.com", '<html>My Page Two2</html>', function() {
//   console.log("DONE", arguments);
// });

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'html');
app.engine('html', cons.handlebars);

app.get('/', function(req, res){
  Page.find(function(err, pages) {
    var processedPages = pages.map(function(page) {
      var lastVersion = page.pages[page.pages.length-1];

      return {
        url: page.url,
        // TODO: Stimmt nicht ganz, müsste rückwirkend bis zu einem zeitpunkt checken
        // false has to be done
        changed: page.hasChanged(),
        lastPageVersion: lastVersion && moment(lastVersion.lastChecked).format('DD.MM.YYYY - HH:mm'),
        lastChange: moment(page.lastChange()).format('DD.MM.YYYY - HH:mm')
      };
    });
    res.render('index', {
      pages: processedPages
    });
  });
});

app.get('/checked', function(req, res) {
  Page.findOne({ url: req.query.url}, function(err, page) {
    if (err) { return res.send(404, 'Something bad happened. Page does not exist.'); }

    page.lastProcessed = new Date();
    page.save(function(err) {
      if (err) { return res.send(400, 'Something bad happened. Page could not be saved.'); }

      res.redirect('/');
    });
  });
});

app.get('/last', function(req, res) {
  Page.findOne({ url: req.query.url}, function(err, page) {
    if (err || !page) { return res.json(404, { error: 'Something bad happened. Page does not exist.' }); }

    var before = page.getLastChangedPage(),
        after  = page.getActualPage();

    if (before && after) {
      res.json({
        url: req.query.url,
        before: before.body,
        after:  after.body
      });
    } else {
      res.json(null);
    }
  });
});

app.listen(8128);
