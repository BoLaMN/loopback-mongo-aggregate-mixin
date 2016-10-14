
class Aggregate
  constructor: (args...) ->
    @pipeline = []
    @options = {}

    @append.apply this, args

  isOperator = (obj) ->
    if typeof obj isnt 'object'
      return false

    k = Object.keys(obj)
    o = {}

    k.forEach (key) ->
      item = obj[key]

      if key[0] isnt '$'
        key = '$' + key

      o[key] = converQuery item

    o

  converQuery = (where) ->
    query = {}

    if where is null or typeof where isnt 'object'
      return query

    Object.keys(where).forEach (k) ->
      cond = where[k]

      if k in [ 'and', 'or', 'nor' ] and Array.isArray cond
        cond = cond.map (c) ->
          buildWhere c

      if k is 'id'
        k = '_id'

      query[k] = cond

    query

  append: (args...) ->
    args = if args.length is 1 and Array.isArray(args[0]) then args[0] else args
    keys = args.map isOperator

    @pipeline = @pipeline.concat keys

    this

  project: (fields) ->
    @append $project: fields

  near: (arg) ->
    op = {}
    op.$geoNear = arg

    @append op

  unwind: (args...) ->
    res = []
    i = 0

    while i < args.length
      arg = args[i]

      if arg and typeof arg == 'object'
        res.push $unwind: arg
      else if typeof arg == 'string'
        res.push $unwind: if arg and arg.charAt(0) == '$' then arg else '$' + arg
      else
        throw new Error('Invalid arg "' + arg + '" to unwind(), ' + 'must be string or object')

      ++i

    @append.apply this, res

  lookup: (options) ->
    @append $lookup: options

  sample: (size) ->
    @append $sample: size: size

  sort: (sort) ->
    @append $sort: sort

  explain: (collection, callback) ->
    if not @pipeline.length
      err = new Error('Aggregate has empty pipeline')
      return callback err

    collection.aggregate(@pipeline, @options).explain callback

  allowDiskUse: (value) ->
    @options.allowDiskUse = value
    this

  cursor: (options) ->
    @options.cursor = options or {}
    this

  addCursorFlag: (flag, value) ->
    @options[flag] = value
    this

  exec: (collection) ->
    if not collection
      throw new Error('Aggregate not bound to any Model')

    collection.aggregate @pipeline, @options

[ 'group', 'match', 'skip',
  'limit', 'out' ].forEach (operator) ->
  Aggregate.prototype[operator] = (arg) ->
    op = {}
    op['$' + operator] = arg

    @append op

module.exports = Aggregate