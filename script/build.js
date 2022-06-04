// 引入webpack
const myWebpack = require('../lib/myWebpack.js')
// 引入配置
const config = require('../config/webpack.config.js')

const compiler = myWebpack(config)
// 开始打包webpack
compiler.run()