#!/usr/bin/env node

const fs = require('fs')
const ejs = require('gulp-ejs')
const rename = require('gulp-rename')
const through = require('through2')
const path = require('path')
const vfs = require('vinyl-fs')
const chokidar = require('chokidar')
const condense = require('condense-newlines')
const beautify = require('js-beautify').html
const log = console.log.bind(console)

class compiler {

  constructor() {
    this.input = this.argv('input')
    this.data = this.argv('data')
    this.output = this.argv('output')
    this.watch = this.argv('watch')
    this.delay = this.argv('delay') || 200
    this.target = `${this.input}/**/!(_*).ejs`
  }

  argv(key) {
    const arg = process.argv.filter(val => val.startsWith('--' + key))
    return arg.length ? arg.pop().split('=').pop() : null
  }

  async run() {
    this.watch ? await this.watcher() : await this.render()
  }

  async render() {
    const start = performance.now()
    return await new Promise(resolve => {
      vfs.src(this.target)
        .on('data', (chunk) => log(`Processing ${chunk.path}`))
        .pipe(ejs(JSON.parse(fs.readFileSync(this.data, 'utf-8'))))
        .pipe(through.obj(function (file, _, cb) {
          let content = file.contents.toString()
          content = condense(content) // replace extraneous newlines with a single newline
          content = beautify(content, {
            indent_size: 2,
            unformatted: ['pre', 'code'],
          })
          file.contents = Buffer.from(content)
          cb(null, file)
        }))
        .pipe(rename({ extname: '.html' }))
        .pipe(vfs.dest(this.output))
        .on('end', () => {
          log(`Done in ${Math.round(performance.now() - start)} ms`)
          resolve()
        })
    })
  }

  async watcher() {
    chokidar.watch(this.input, {
      ignoreInitial: true,
    })
      .on('all', async (event, target) => {
        setTimeout(async () => {
          if ((event === 'add' || event === 'change') && target !== this.data) {
            const filename = path.basename(target)
            if (filename.startsWith('_')) {
              await this.setTarget(filename)
            }
            else {
              this.target = target
            }
          }
          else {
            this.target = `${this.input}/**/!(_*).ejs`
          }
          await this.render()
        }, this.delay)
      })
      .on('ready', () => log('Waiting for file changes...'))
  }

  async setTarget(target) {
    return await new Promise(async resolve => {
      const partial = path.parse(target).name
      let targets = []
      await new Promise(resolve => {
        vfs.src(`${this.input}/**/!(_*).ejs`)
          .pipe(through.obj(function (file, _, cb) {
            let content = file.contents.toString().match(/include\(\s*(['"])(.+?)\1\s*(,\s*({.+?})\s*)?\)/g)
            content = content ? content.join('') : ''
            if (content.includes(partial + "'") || content.includes(partial + '"')) {
              targets.push(file.path)
            }
            cb(null, file)
          }))
          .on('finish', () => resolve())
      })
      this.target = targets
      resolve()
    })
  }
}

(async function () {
  await new compiler().run()
})()