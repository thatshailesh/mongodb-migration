const mongodb = require('mongodb')

const MongoClient = mongodb.MongoClient

const Bluebird = require('bluebird')

Bluebird.promisifyAll(MongoClient)

class dbStore {
  constructor() {

    this.url = 'mongodb://localhost/Sample'

    this.db = null
    this.mClient = null
  }

  connect() {
    return MongoClient.connect(this.url)
      .then(client => {
        this.mClient = client
        return client.db()
      })
  }

  load(fn) {
    return this.connect()
      .then(db => db.collection('migrations').find().toArray())
      .then(data => {
        if (!data.length) return fn(null, {})

        const store = data[0]
        // Check if old format and convert if needed
        if (!Object.prototype.hasOwnProperty.call(store, 'lastRun') &&
          Object.prototype.hasOwnProperty.call(store, 'pos')) {
          if (store.pos === 0) {
            store.lastRun = null
          } else {
            if (store.pos > store.migrations.length)
              return fn(new Error('Store file contains invalid pos property'))

            store.lastRun = store.migrations[store.pos - 1].title
          }

          // In-place mutate the migrations in the array
          store.migrations.forEach((migration, index) => {
            if (index < store.pos)
              migration.timestamp = Date.now()
          })
        }

        // Check if does not have required properties
        if (!Object.prototype.hasOwnProperty.call(store, 'lastRun') || !Object.prototype.hasOwnProperty.call(store, 'migrations'))
          return fn(new Error('Invalid store file'))

        return fn(null, store)
      })
      .catch(fn)
  }

  save(set, fn) {
    return this.connect()
      .then(db => db.collection('migrations')
        .update({},
          {
            $set: {
              lastRun: set.lastRun,
            },
            $push: {
              migrations: { $each: set.migrations },
            },
          },
          {
            upsert: true,
            multi: true,
          }
        ))
      .then(result => fn(null, result))
      .catch(fn)
  }
}

module.exports = dbStore