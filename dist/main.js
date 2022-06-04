
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

        require('./src/index.js');
      })({"./src/index.js":{"code":"\"use strict\";\n\nvar _add = _interopRequireDefault(require(\"./add.js\"));\n\nvar _count = _interopRequireDefault(require(\"./count.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log((0, _add[\"default\"])(10, 20));\nconsole.log((0, _count[\"default\"])(10, 20));","deps":{"./add.js":"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\add.js","./count.js":"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\count.js"}},"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\add.js":{"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _sum = _interopRequireDefault(require(\"./sum.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nfunction add(x, y) {\n  return x + y;\n}\n\nconsole.log((0, _sum[\"default\"])(10, 20));\nvar _default = add;\nexports[\"default\"] = _default;","deps":{"./sum.js":"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\sum.js"}},"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\count.js":{"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nfunction count(x, y) {\n  return x - y;\n}\n\nvar _default = count;\nexports[\"default\"] = _default;","deps":{}},"E:\\AAA前端-github仓库项目\\miniWebpack\\miniWebpack\\src\\sum.js":{"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nfunction sum(x, y) {\n  return x * y;\n}\n\nvar _default = sum;\nexports[\"default\"] = _default;","deps":{}}})
    