const Compiler = require('./Compiler.js')

function myWebpack(config) {
  return new Compiler(config)
}

module.exports = myWebpack