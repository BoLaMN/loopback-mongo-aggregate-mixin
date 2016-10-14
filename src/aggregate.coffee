Aggregate = require './query'

debug = require('debug')('loopback:mixins:aggregate')

module.exports = (Model) ->

  rewriteId = (doc = {}) ->
    if doc._id
      doc.id = doc._id

    delete doc._id

    doc

  Model.aggregate = (filter, options, callback) ->
    connector = @getConnector()
    model = Model.modelName

    debug 'aggregate', model

    if not filter.aggregate
      return callback new Error 'no aggregate filter'

    aggregate = new Aggregate filter.aggregate

    if filter.where
      where = connector.buildWhere model, filter.where

      aggregate.pipeline.unshift '$match': where

    debug 'all.aggregate', aggregate.pipeline

    if filter.fields
      aggregate.project filter.fields

    if filter.sort
      aggregate.sort connector.buildSort filter.sort

    collection = connector.collection model

    cursor = aggregate.exec collection

    if filter.limit
      cursor.limit filter.limit

    if filter.skip
      cursor.skip filter.skip
    else if filter.offset
      cursor.skip filter.offset

    cursor.toArray (err, data) ->
      debug 'aggregate', model, filter, err, data

      callback err, data.map rewriteId

  Model.remoteMethod 'aggregate',
    accepts: [
      {
        arg: "filter"
        description: "Filter defining fields, where, aggregate, order, offset, and limit"
        type: "object"
      }
      {
        arg: "options"
        description: "options"
        type: "object"
      }
    ]
    accessType: "READ"
    description: "Find all instances of the model matched by filter from the data source."
    http:
      path: "/aggregate"
      verb: "get"
    returns:
      arg: "data"
      root: true
      type: 'array'

  return