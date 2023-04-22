## 代码分析器

用于分析得到某些类库的方法在代码中被调用的信息

在项目根目录新建`analysis.config.mjs`，配置参考如下
```javascript
export default {
  extensions: ["ts", "tsx"], // 可选，extension支持:ts、tsx、vue
  blackApis: ["getUserInfo", "getDepartmentInfo"], // 可选，用于分析黑名单api
  browserApis: ["history", "location"], // 可选，全局用于进行提示
  browserApiPlugins: [], // 可选，type:PluginGenerator，浏览器API使用情况分析插件
  importApiPlugins: [], // 可选，type:PluginGenerator，分析类库API使用情况分析插件
  entry: [ // 必填，用于分析的入口列表
    {
      name: "test_project", // 必填，输出名
      path: ["src"], // 必填，用于分析的目录
      libs: ["@mockjs/request"], // 必填，用于分析API使用情况的类库列表
    },
  ],
  scorePlugin: null // 可选，type:ScorePlugin，自定义评分插件
}
```

全局安装脚手架
```
npm install @ainuo-utils/code-analysiser -g
```

在项目中使用
```
ana analysis
```