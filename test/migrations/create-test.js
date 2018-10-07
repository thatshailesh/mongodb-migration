
const Bluebird = require('bluebird')
const { spawn } = require('child_process')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

const path = require('path')
const fs = Bluebird.promisifyAll(require('fs'))

describe('[Migrations]', () => {

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
  const TMP_DIR = path.join(__dirname, '..', '..', 'tmp')
  const INIT = path.join(__dirname, '..', '..', 'node_modules/migrate/bin', 'migrate-init')
  const init = run.bind(null, INIT)


  const reset = () => {
    rimraf.sync(TMP_DIR)
    rimraf.sync(path.join(__dirname, '..', '..', '.migrate'))
  }

  beforeEach(reset)
  afterEach(reset)

  describe('init', () => {
    beforeEach(mkdirp.bind(mkdirp, TMP_DIR))

    it('should create a migrations directory', done => {
      init()
        .then(() => fs.accessSync(path.join(TMP_DIR, '..', 'migrations')))
        .then(() => done())
        .catch(done)
    })
  })


})