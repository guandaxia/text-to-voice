'use strict'

let path = require('path')

let userHome = getUserHome()

let nconf = require('nconf').file({
  file: path.join(userHome, 'text-to-voice-config.json')
})

function saveSettings (settingKey, settingValue) {
  nconf.set(settingKey, settingValue)
  nconf.save()
}

function readSettings (settingKey) {
  nconf.load()
  return nconf.get(settingKey)
}

function getUserHome () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
}

module.exports = {
  saveSettings: saveSettings,
  readSettings: readSettings
}
