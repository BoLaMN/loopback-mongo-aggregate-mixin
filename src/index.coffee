'use strict'

aggregate = require './aggregate'

module.exports = (app) ->
  app.loopback.modelBuilder.mixins.define 'Aggregate', aggregate

  return
