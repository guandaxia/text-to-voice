'use strict'
const configuration = require('../../configuration')
const qs = require('querystring')
const axios = require('axios')
const { URL } = require('url')
const pinyin = require('pinyin')

function compose (accessToken, text) {
  let setInfo
  // accessToken = '24.eace2c5a9bcb399ddee3e71e60d4cb8e.2592000.1501407250.282335-4552311'

  // accessToken = getAccessToken()
  console.log(accessToken)
  setInfo = configuration.readSettings('set_info')

  let url = 'http://tsn.baidu.com/text2audio?'
  let param = {
    'tok': accessToken,
    'tex': text,
    'lan': 'zh',
    'ctp': 1,
    'cuid': 1,
    'spd': setInfo.spd,
    'pit': setInfo.pit,
    'vol': setInfo.vol,
    'per': setInfo.per
  }
  url = url + qs.stringify(param)
  return url
}

// 获取accesstoken
function getAccessToken () {
  return new Promise(function (resolve, reject) {
    let accessToken, accessTokenInfo, baiduParam

    let timestamp = Date.parse(new Date())
    console.log(timestamp)
    accessTokenInfo = configuration.readSettings('access_token_info')
    if (accessTokenInfo && accessTokenInfo.timestamp + 86400000 > timestamp) {
      // 未过期
      console.log(accessTokenInfo.access_token)
      resolve(accessTokenInfo.access_token)
      return
    }

    let url = 'https://openapi.baidu.com/oauth/2.0/token?'
    baiduParam = configuration.readSettings('baidu')
    console.log(baiduParam)
    url = url + qs.stringify(baiduParam)
    console.log(url)
    axios.get(url)
      .then(function (res) {
        console.log(res)
        accessToken = res.data.access_token

        accessTokenInfo = {
          'access_token': accessToken,
          'timestamp': timestamp
        }
        configuration.saveSettings('access_token_info', accessTokenInfo)
        resolve(accessToken)
      })
      .catch(function (err) {
        console.log(err)
        reject(err)
      })
  })
}

function getFilename (urlStr) {
  console.log(urlStr)
  const queryUrl = new URL(urlStr)
  let text = queryUrl.searchParams.get('tex')
  console.log(text)
  text = decodeURI(text)

  let filename = pinyin(text, {
    style: pinyin.STYLE_NORMAL
  }).join('') + '.mp3'

  return filename
}

module.exports = {
  'compose': compose,
  'getAccessToken': getAccessToken,
  'getFilename': getFilename
}
