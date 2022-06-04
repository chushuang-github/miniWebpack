const fs = require('fs')
const path = require('path')
// babel里面提供了很多插件供我们去使用
// 下载包：npm install @babel/parser
// 作用：将代码解析成ast抽象语法树
const babelParser = require('@babel/parser')
// 下载包：npm install @babel/traverse
// 作用：分析ast抽象语法树，快速的帮助我们分析ast抽象语法树收集依赖
// @babel/traverse里面可以通过去定义一些想要匹配的语句，去做一些相应的事情
const traverse = require('@babel/traverse').default
// 下载包：npm install @babel/core (babel的核心库，编译代码)
// transformFromAst方法：转化AST抽象语法
const { transformFromAst } = require('@babel/core')

const parser = {
  // 1.获取ast抽象语法树代码 (将文件解析成抽象语法树)
  getAst(filePath) {
    // 读取文件
    // readFileSync文件路径是相对于process.cwd()来的，'utf-8'是读取文件的格式
    const file = fs.readFileSync(filePath, 'utf-8')
    // 将其解析成AST抽象语法树 (package.json里面已经配置了node调试的指令)
    // ast抽象语法树：将每一行代码转成一个对象，以对象的方式来表示代码的解构
    // 对象里面有该行代码的类型、值等一些信息的描述
    const ast = babelParser.parse(file, {
      sourceType: 'module', // 解析文件的模块化是ES Module
    })
    // console.log(ast)
    return ast
  },

  // 2.获取依赖
  getDeps(ast, filePath) {
    // 获取到文件文件夹路径 (dirname："./src")
    const dirname = path.dirname(filePath)
    // 定义一个存储依赖的容器
    const deps = {}
    // 收集依赖：traverse会去遍历ast抽象语法树里面的program.body
    traverse(ast, {
      // 内部会去遍历ast抽象语法树中program.body，并且判断代码语句的类型
      // 如果type为ImportDeclaration，就会去触发ImportDeclaration函数
      ImportDeclaration({ node }) {
        // 文件依赖的相对路径(通过import导入文件的路径)：./add.js and ./count.js
        const relativePath = node.source.value
        // 生成基于入口文件的绝对路径
        const absolutePath = path.resolve(dirname, relativePath)
        // 添加依赖
        deps[relativePath] = absolutePath
      },
    })
    // {
    //   './add.js': 'E:\\node\\尚硅谷webpack\\miniWebpack\\src\\add.js',
    //   './count.js': 'E:\\node\\尚硅谷webpack\\miniWebpack\\src\\count.js'
    // }
    // console.log(deps)
    return deps
  },

  // 3.将ast抽象语法树解析成浏览器能识别的代码code
  getCode(ast) {
    // 编译代码：将代码中浏览器不能识别的语法进行编译
    // 浏览器不能解析ES Module模块化代码
    const { code } = transformFromAst(ast, null, {
      presets: ['@babel/preset-env'],
    })
    // console.log(code)
    return code
  },
}

module.exports = parser
