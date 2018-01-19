var Aggregate, debug;

Aggregate = require('./query');

debug = require('debug')('loopback:mixins:aggregate');

module.exports = function(Model) {
  var rewriteId;
  rewriteId = function(doc) {
    if (doc == null) {
      doc = {};
    }
    if (doc._id) {
      doc.id = doc._id;
    }
    delete doc._id;
    return doc;
  };
  Model.aggregate = function(filter, options, callback) {
    var aggregate, collection, connector, cursor, model, where;
    connector = this.getConnector();
    model = Model.modelName;
    debug('aggregate', model);
    if (!filter.aggregate) {
      return callback(new Error('no aggregate filter'));
    }
    aggregate = new Aggregate(filter.aggregate);
    if (filter.where) {
      where = connector.buildWhere(model, filter.where);
      if (filter.aggregate.geoNear) {
        aggregate.pipeline.push({
          $match: where
        });
      } else {
        aggregate.pipeline.unshift({
          $match: where
        });
      }
    }
    debug('all.aggregate', aggregate.pipeline);
    if (filter.fields) {
      aggregate.project(filter.fields);
    }
    if (filter.sort) {
      aggregate.sort(connector.buildSort(filter.sort));
    }
    collection = connector.collection(model);
    cursor = aggregate.exec(collection);
    if (filter.limit) {
      cursor.limit(filter.limit);
    }
    if (filter.skip) {
      cursor.skip(filter.skip);
    } else if (filter.offset) {
      cursor.skip(filter.offset);
    }
    return cursor.toArray(function(err, data) {
      debug('aggregate', model, filter, err, data);
      return callback(err, data.map(rewriteId));
    });
  };
  Model.remoteMethod('aggregate', {
    accepts: [
      {
        arg: "filter",
        description: "Filter defining fields, where, aggregate, order, offset, and limit",
        type: "object"
      }, {
        arg: "options",
        description: "options",
        type: "object"
      }
    ],
    accessType: "READ",
    description: "Find all instances of the model matched by filter from the data source.",
    http: {
      path: "/aggregate",
      verb: "get"
    },
    returns: {
      arg: "data",
      root: true,
      type: 'array'
    }
  });
};
