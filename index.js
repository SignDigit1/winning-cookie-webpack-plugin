/*
 * @descrption: 发起请求获取token和userInfo写入cookie中，仅限开发模式
 * @Author: qiangfeng@wining.com.cn
 * @Date: 2019-11-21 14:07:13
 * @Last Modified by: qiangfeng@wining.com.cn
 * @Last Modified time: 2020-10-21 10:35:50
 */

const axios = require('axios')
const chalk = require('chalk')
const prefix = '【WinningCookieWebpackPlugin】'

module.exports = class WinningCookieWebpackPlugin {
  constructor (options = {}) {
    this.extraCookies = options.extraCookies || {}
    this.userInfoParams = options.userInfoParams || {}
    this.token = ''
    this.userInfo = {}
  }
  async getCookies () {
    const { loginURL, userInfoURL, username, password } = this.userInfoParams
    const { data } = await axios.post(loginURL, { username, password })
    if (data.success && data.data && data.data.access_token) {
      const token = data.data.access_token
      const { data: userData } = await axios.post(userInfoURL, { token }, { headers: { Authorization: 'Bearer ' + token } })
      if (userData.success && userData.data) {
        return { token: 'Bearer ' + token, userInfo: userData.data }
      }
    }
    return null
  }

  renderScript (token, userInfo) {
    let cookiesStr = ''
    Object.prototype.toString.call(this.extraCookies) === '[object Object]' && Object.keys(this.extraCookies).forEach(key => {
      cookiesStr += `document.cookie='${key}=${this.extraCookies[key]}';`
    })
    return `
    document.cookie='BEARER_TOKEN=${token};'
    document.cookie='userInfo=${JSON.stringify(userInfo)};'
    ${cookiesStr}
    `
  }
  apply (compiler) {
    if (compiler.hooks) { // webpack v4+
      compiler.hooks.afterPlugins.tap('WinningCookieWebpackPlugin', async (compilation) => {
        if (this.userInfoParams.loginURL && this.userInfoParams.userInfoURL && process.env.NODE_ENV === 'development') {
          this.getCookies().then(res => {
            if (res) {
              this.token = res.token
              this.userInfo = res.userInfo
              // console.log(chalk.green(`\n${prefix}获取token和userinfo成功`))
            }
          }).catch(err => {
            console.log(chalk.red(`\n${prefix}获取token和userinfo失败  ${err}`))
          })
        }
      })
      compiler.hooks.compilation.tap('WinningCookieWebpackPlugin', compilation => {
        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('WinningCookieWebpackPlugin', (data, callback) => {
          if (data.outputName === 'index.html' && this.token && this.userInfo && process.env.NODE_ENV === 'development') { // 由于现在是多页面结构故只写入主页
            const file = this.renderScript(this.token, this.userInfo)
            compilation.assets['cookie.js'] = {
              source: () => file,
              size: () => file.length
            }
            data.assets.js = ['/cookie.js', ...data.assets.js]
            // console.log(chalk.green(`\n${prefix}token和userinfo已写入cookie`))
          }
          callback(null, data)
        })
      })
    }
  }
}
