#!/usr/local/bin/node

var Crawld   = require('./src/crawld'),
    config   = require('./config.json'),
    path     = require('path'),
    mongoose = require('mongoose'),

    crawld = new Crawld(config);

mongoose.connect([
  'mongodb://',config.mongodb.url,':',config.mongodb.port,'/',config.mongodb.name
].join(''));

Page.downloadPath = path.join(__dirname, config.downloadPath)
console.log(1);
crawld.run(function(err) {
  if (err) {
    console.error("ERRRRRR", err);
    process.exit(1);
  } else {
    console.log("Done. Success.");
    process.exit(0);
  }
});
