var chai      = require('chai'),
    sinon     = require('sinon'),
    sinonChai = require('sinon-chai'),
    nock      = require('nock'),
    expect    = chai.expect;

chai.use(sinonChai);

global.expect = expect;
global.sinon = sinon;

var Page = require('../../src/page.js');

Page.storagePrefix = 'crawld_test';

// Disable real http requests
nock.disableNetConnect();
