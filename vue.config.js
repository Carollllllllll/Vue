const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://jsonplaceholder.typicode.com/posts/',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
        onProxyRes: function(proxyRes, req, res) {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // 设置 CORS 头部
        }
      }
    }
  }
})
