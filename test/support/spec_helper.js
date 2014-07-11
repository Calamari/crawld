var chai      = require('chai'),
    sinon     = require('sinon'),
    sinonChai = require('sinon-chai'),
    nock      = require('nock'),
    mongoose  = require('mongoose'),
    config    = require('../../config'),
    expect    = chai.expect;

chai.use(sinonChai);

global.expect = expect;
global.sinon = sinon;

var Page = require('../../src/page.js');

// Disable real http requests
nock.disableNetConnect();

mongoose.connect([
  'mongodb://',config.mongodb.url,':',config.mongodb.port,'/',config.mongodb.name
].join(''));
