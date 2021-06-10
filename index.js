#!/usr/bin/env node

const fs = require('fs-extra')
const glob = require('fast-glob')
const ejs = require('ejs')
const path = require('path')
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

  async compile(file) {
    log(`Processing: ${file}`)
    return await new Promise(async resolve => {
      let content = await ejs.renderFile(file, fs.readJsonSync(this.data))
      content = condense(content)
      content = beautify(content, {
        indent_size: 2,
        unformatted: ['pre', 'code'],
      })
      let dest = file.replace(this.input, this.output).slice(0, -3) + 'html'
      fs.outputFile(dest, content).catch(err => log(err)).finally(resolve)
    })
  }

  async render() {
    const start = performance.now()
    await Promise.all((await glob(this.target)).map(file => this.compile(file)))
    const finish = performance.now()
    log(`Done in ${Math.round(finish - start)} ms`)
  }

  async watcher() {
    chokidar.watch(this.input, {
      ignoreInitial: true,
    })
      .on('all', async (event, filePath) => {
        const target = filePath.replace(/\\/g, '/')
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
      await new Promise(async resolve => {
        const files = await glob(`${this.input}/**/!(_*).ejs`)
        files.forEach(file => {
          let content = fs.readFileSync(file, 'utf-8').match(/include\(\s*(['"])(.+?)\1\s*(,\s*({.+?})\s*)?\)/g)
          content = content ? content.join('') : ''
          if (content.includes(partial + "'") || content.includes(partial + '"')) {
            targets.push(file)
          }
          resolve()
        })
      })
      this.target = targets
      resolve()
    })
  }
}

(async function () {
  await new compiler().run()
})()