import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import CodeDiff from 'v-code-diff'
// Extend C language
import c from 'highlight.js/lib/languages/c'

CodeDiff.hljs.registerLanguage('c', c)

Vue.use(CodeDiff);

Vue.use(ElementUI)
Vue.prototype.$axios = axios
Vue.config.productionTip = true

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
