var Aggregate,
  slice = [].slice;

Aggregate = (function() {
  var converQuery, isOperator;

  function Aggregate() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    this.pipeline = [];
    this.options = {};
    this.append.apply(this, args);
  }

  isOperator = function(obj) {
    var k, o;
    if (typeof obj !== 'object') {
      return false;
    }
    k = Object.keys(obj);
    o = {};
    k.forEach(function(key) {
      var item;
      item = obj[key];
      if (key[0] !== '$') {
        key = '$' + key;
      }
      return o[key] = converQuery(item);
    });
    return o;
  };

  converQuery = function(where) {
    var query;
    query = {};
    if (where === null || typeof where !== 'object') {
      return query;
    }
    Object.keys(where).forEach(function(k) {
      var cond;
      cond = where[k];
      if ((k === 'and' || k === 'or' || k === 'nor') && Array.isArray(cond)) {
        cond = cond.map(function(c) {
          return buildWhere(c);
        });
      }
      if (k === 'id') {
        k = '_id';
      }
      return query[k] = cond;
    });
    return query;
  };

  Aggregate.prototype.append = function() {
    var args, keys;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    args = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    keys = args.map(isOperator);
    this.pipeline = this.pipeline.concat(keys);
    return this;
  };

  Aggregate.prototype.project = function(fields) {
    return this.append({
      $project: fields
    });
  };

  Aggregate.prototype.near = function(arg) {
    var op;
    op = {};
    op.$geoNear = arg;
    return this.append(op);
  };

  Aggregate.prototype.unwind = function() {
    var arg, args, i, res;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    res = [];
    i = 0;
    while (i < args.length) {
      arg = args[i];
      if (arg && typeof arg === 'object') {
        res.push({
          $unwind: arg
        });
      } else if (typeof arg === 'string') {
        res.push({
          $unwind: arg && arg.charAt(0) === '$' ? arg : '$' + arg
        });
      } else {
        throw new Error('Invalid arg "' + arg + '" to unwind(), ' + 'must be string or object');
      }
      ++i;
    }
    return this.append.apply(this, res);
  };

  Aggregate.prototype.lookup = function(options) {
    return this.append({
      $lookup: options
    });
  };

  Aggregate.prototype.sample = function(size) {
    return this.append({
      $sample: {
        size: size
      }
    });
  };

  Aggregate.prototype.sort = function(sort) {
    return this.append({
      $sort: sort
    });
  };

  Aggregate.prototype.explain = function(collection, callback) {
    var err;
    if (!this.pipeline.length) {
      err = new Error('Aggregate has empty pipeline');
      return callback(err);
    }
    return collection.aggregate(this.pipeline, this.options).explain(callback);
  };

  Aggregate.prototype.allowDiskUse = function(value) {
    this.options.allowDiskUse = value;
    return this;
  };

  Aggregate.prototype.cursor = function(options) {
    this.options.cursor = options || {};
    return this;
  };

  Aggregate.prototype.addCursorFlag = function(flag, value) {
    this.options[flag] = value;
    return this;
  };

  Aggregate.prototype.exec = function(collection) {
    if (!collection) {
      throw new Error('Aggregate not bound to any Model');
    }
    return collection.aggregate(this.pipeline, this.options);
  };

  return Aggregate;

})();

['group', 'match', 'skip', 'limit', 'out'].forEach(function(operator) {
  return Aggregate.prototype[operator] = function(arg) {
    var op;
    op = {};
    op['$' + operator] = arg;
    return this.append(op);
  };
});

module.exports = Aggregate;
