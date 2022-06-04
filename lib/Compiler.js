const fs = require('fs')
const path = require('path')
const { getAst, getDeps, getCode } = require('./parser.js')

class Compiler {
  constructor(options = {}) {
    // webpack里面的配置webpack.config.js
    this.options = options
    // 所有文件的依赖容器
    this.modules = []
  }

  // 启动webpack打包的方法
  run() {
    // 读取入口文件内容 (filePath："./src/index.js")
    const filePath = this.options.entry
    // 第一次构建，得到入口文件的信息
    const fileInfo = this.build(filePath)
    this.modules.push(fileInfo)

    // 遍历所有的依赖
    for(let i = 0; i < this.modules.length; i++) {
      const fileInfo = this.modules[i]
      // {
      //   './add.js': 'E:\\node\\尚硅谷webpack\\miniWebpack\\src\\add.js',
      //   './count.js': 'E:\\node\\尚硅谷webpack\\miniWebpack\\src\\count.js'
      // }
      // 取出当前文件的所有依赖
      const deps = fileInfo.deps
      // 遍历
      for(const relativePath in deps) {
        // 得到当前文件依赖文件的绝对路径
        const absolutePath = deps[relativePath]
        // 对依赖文件进行处理
        const fileInfo = this.build(absolutePath)
        // 将处理后的结果添加到modules中，后面遍历就会遍历这个新添加入的模块
        this.modules.push(fileInfo)
      }
    }

    // 件依赖整理成更好的依赖关系图，将数组整合成下面结构的对象
    /*
      {
        'index.js': {
          code: 'xxx',
          deps: { 'add.js': 'xxx' }
        },
        'add.js': {
          code: 'xxx',
          deps: { 'sum.js': 'xxx' }
        },
        'count.js': {
          code: 'xxx',
          deps: {}
        }
      }
    ***/
    const depsGraph = this.modules.reduce((graph, module) => {
      return {
        ...graph,
        [module.filePath]: {
          code: module.code,
          deps: module.deps
        }
      }
    }, {})

    // {
    //   './src/index.js': {
    //     code: '"use strict";\n' +
    //       '\n' +
    //       'var _add = _interopRequireDefault(require("./add.js"));\n' +
    //       '\n' +
    //       'var _count = _interopRequireDefault(require("./count.js"));\n' +
    //       '\n' +
    //       'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
    //       '\n' +
    //       'console.log((0, _add["default"])(10, 20));\n' +
    //       'console.log((0, _count["default"])(10, 20));',
    //     deps: {
    //       './add.js': 'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\add.js',
    //       './count.js': 'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\count.js'
    //     }
    //   },
    //   'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\add.js': {
    //     code: '"use strict";\n' +
    //       '\n' +
    //       'Object.defineProperty(exports, "__esModule", {\n' +
    //       '  value: true\n' +
    //       '});\n' +
    //       'exports["default"] = void 0;\n' +
    //       '\n' +
    //       'var _sum = _interopRequireDefault(require("./sum.js"));\n' +
    //       '\n' +
    //       'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
    //       '\n' +
    //       'function add(x, y) {\n' +
    //       '  return x + y;\n' +
    //       '}\n' +
    //       '\n' +
    //       'console.log((0, _sum["default"])(10, 20));\n' +
    //       'var _default = add;\n' +
    //       'exports["default"] = _default;',
    //     deps: {
    //       './sum.js': 'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\sum.js'
    //     }
    //   },
    //   'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\count.js': {
    //     code: '"use strict";\n' +
    //       '\n' +
    //       'Object.defineProperty(exports, "__esModule", {\n' +
    //       '  value: true\n' +
    //       '});\n' +
    //       'exports["default"] = void 0;\n' +
    //       '\n' +
    //       'function count(x, y) {\n' +
    //       '  return x - y;\n' +
    //       '}\n' +
    //       '\n' +
    //       'var _default = count;\n' +
    //       'exports["default"] = _default;',
    //     deps: {}
    //   },
    //   'E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\sum.js': {
    //     code: '"use strict";\n' +
    //       '\n' +
    //       'Object.defineProperty(exports, "__esModule", {\n' +
    //       '  value: true\n' +
    //       '});\n' +
    //       'exports["default"] = void 0;\n' +
    //       '\n' +
    //       'function sum(x, y) {\n' +
    //       '  return x * y;\n' +
    //       '}\n' +
    //       '\n' +
    //       'var _default = sum;\n' +
    //       'exports["default"] = _default;',
    //     deps: {}
    //   }
    // }
    // console.log(depsGraph)

    this.generate(depsGraph)
  }

  // 开始构建
  build(filePath) {
    // 1.将文件解析成ast抽象语法树
    const ast = getAst(filePath)
    // 2.获取ast抽象语法树中的所有依赖
    const deps = getDeps(ast, filePath)
    // 3.将ast抽象语法树解析成浏览器识别的代码
    const code = getCode(ast)
    return {
      // 当前模块的文件路径
      filePath,
      // 当前模块的的所有依赖
      deps,
      // 当前文件解析后的代码
      code
    }
  }

  // 构建输出资源的方法，生成打包之后的bundle文件
  generate(depsGraph) {
    // 整体是一个匿名自调用函数 (使用eval函数去执行字符串代码)
    // 作用：将每个模块里面的代码执行一遍
    /* src -> index.js代码，这个通过babel将ast抽象语法树装换成的代码里面也会去自己调用require方法
      '"use strict";\n' +
      '\n' +
      'var _add = _interopRequireDefault(require("./add.js"));\n' +
      '\n' +
      'var _count = _interopRequireDefault(require("./count.js"));\n' +
      '\n' +
      'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
      '\n' +
      'console.log((0, _add["default"])(10, 20));\n' +
      'console.log((0, _count["default"])(10, 20));',
    */
    const bundle = `
      (function(depsGraph) {
        // require函数目的: 为了加载入口文件
        function require(module) {
          // 定义模块内部的require函数
          function localRequire(relativePath) {
            // 为了找到当前模块的绝对路径，通过require函数加载进来
            return require(depsGraph[module].deps[relativePath])
          };

          // 定义暴露对象 (将来我们模块要暴露的内容)
          // 我们自己写的模块是通过ES Module导出了，但是模板经历了模块 -> ast抽象语法树 -> babel转成代码
          // babel转成的代码里面导出的方式都被转成了 'exports["default"] = _default;', 这种形式
          // 让导出的内容，都放在exports对象里面
          var exports = {};

          (function(require, exports, code) {
            eval(code)
          })(localRequire, exports, depsGraph[module].code)

          // 作为require函数的返回值返回出去，为了后面require函数能得到暴露的内容
          return exports
        }

        require('${this.options.entry}');
      })(${JSON.stringify(depsGraph)})
    `
    
    // 生成输出文件的绝对路径
    const filePath = path.resolve(this.options.output.path, this.options.output.filename)
    // 写入文件 (文件路径的文件夹必须存在)
    // bundle是一个字符串，所以后面要加上'utf-8'
    fs.writeFileSync(filePath, bundle, 'utf-8')
  }
}
module.exports = Compiler