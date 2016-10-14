# loopback-mongo-aggregate-mixin

Aggregation Pipeline For MongoDB Loopback Connector
 - mixin to enable the aggregation pipeline

* npm install loopback-mongo-aggregate-mixin --save

example

```
{ "aggregate": { "group": { "id": "$status", "count": { "$sum": 1 } } } }

{
  "where": {
    "name": "bob"
  },
  "aggregate": {
    "group": {
      "id": "$status",
      "count": {
        "$sum": 1
      }
    }
  },
  "sort": "date DESC",
  "limit": 5,
  "skip": 20,
  "fields": {
    "external": false
  }
}
```

License: MIT