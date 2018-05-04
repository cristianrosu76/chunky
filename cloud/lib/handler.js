'use strict';

var loader = require('./loader');
var firebase = require('./firebase');
var path = require('path');

var now = Date.now();

var _context = {
  start: now,
  lastUpdate: now,
  sinceLastUpdate: 0,
  sinceStart: 0,
  burst: 0
};

function validate(_ref) {
  var event = _ref.event,
      chunk = _ref.chunk,
      config = _ref.config,
      filename = _ref.filename,
      account = _ref.account;

  return new Promise(function (resolve, reject) {
    if (!chunk.service.requiredFields) {
      resolve({ chunk: chunk, config: config });
      return;
    }

    var functionName = path.basename(filename, '.js');
    var fields = chunk.service.requiredFields[functionName] || [];

    fields.forEach(function (field) {
      if (!event.body[field]) {
        reject(new Error('Missing required field: ' + field));
      }
    });

    resolve({ chunk: chunk, config: config, account: account });
  });
}

function authorize(_ref2) {
  var context = _ref2.context,
      auth = _ref2.auth,
      event = _ref2.event;

  return new Promise(function (resolve, reject) {
    var update = Date.now();
    var burstRate = 1000;

    _context.sinceLastUpdate = update - _context.lastUpdate;
    _context.sinceStart = update - _context.start;
    _context.lastUpdate = update;
    _context.burst = _context.sinceLastUpdate < burstRate ? _context.burst + 1 : 0;

    if (auth && auth.limit && _context.burst > auth.limit) {
      reject(new Error('Request limit reached'));
    }

    context.callbackWaitsForEmptyEventLoop = false;

    var chunk = loader.loadChunk();
    var config = loader.loadSecureCloudConfig();

    return firebase.verify(event, config).then(function (account) {
      return resolve({ chunk: chunk, config: config, account: account });
    });
  });
}

function main(_ref3) {
  var executor = _ref3.executor,
      filename = _ref3.filename,
      auth = _ref3.auth;

  return function (event, context) {
    return authorize({ auth: auth, context: context, event: event });
  };
  // .then(({ chunk, config, account }) => validate({ event, chunk, config, account, filename }))
  // .then(({ chunk, config, account }) => executor({ event, chunk, config, account }))
  // .then((data) => {
  //   return Object.assign({}, { data }, {
  //     ok: true,
  //     timestamp: Date.now()
  //   })
  // })
  // .catch(error => ({ error: error.message }))
}

module.exports = main;