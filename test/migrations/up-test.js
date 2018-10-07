const chance = require('chance')()
const path = require('path')
const { spawn } = require('child_process')
const Bluebird = require('bluebird')
const mongodb = require('mongodb')
const rimraf = require('rimraf')

const MongoClient = mongodb.MongoClient

const url = 'mongodb://localhost/Sample'

const generateUser = () => ({
  email: chance.email(),
  name: `${chance.first()} ${chance.last()}`,
})

const run = (cmd, args = []) => {
  const process = spawn(cmd, args)
  let out = ""

  return new Bluebird((resolve, reject) => {
    process.stdout.on('data', data => {
      out += data.toString('utf8')
    })

    process.stderr.on('data', data => {
      out += data.toString('utf8')
    })

    process.on('error', err => {
      reject(err)
    })

    process.on('close', code => {
      resolve(out, code)
    })
  })
}

const migratePath = path.join(__dirname, '..', '..', 'node_modules/migrate/bin', 'migrate')
const migrate = run.bind(null, migratePath)
describe('[Migration: up]', () => {

  let db = null

  before(done => {
    MongoClient
      .connect(url)
      .then(client => {
        db = client.db()
        return db.collection('users').insert(generateUser())
      })
      .then(result => {
        if (!result) throw new Error('Failed to insert')
        return done()
      }).catch(done)
  })
  it('should run up on specified migration', done => {
    migrate(['up', 'mention here the file name we created above', '--store=./db-migrate-store.js'])
      .then(() => {
        const promises = []
        promises.push(
          db.collection('users').find().toArray()
        )
        Bluebird.all(promises)
          .then(([users]) => {
            users.forEach(elem => {
              expect(elem).to.have.property('lastName')
            })
            done()
          })
      }).catch(done)
  })
  after(done => {
    rimraf.sync(path.join(__dirname, '..', '..', '.migrate'))
    db.collection('users').deleteMany()
      .then(() => {
        rimraf.sync(path.join(__dirname, '..', '..', '.migrate'))
        return done()
      }).catch(done)
  })
})