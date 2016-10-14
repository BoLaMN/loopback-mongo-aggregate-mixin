'use strict';
var aggregate;

aggregate = require('./aggregate');

module.exports = function(app) {
  app.loopback.modelBuilder.mixins.define('Aggregate', aggregate);
};
