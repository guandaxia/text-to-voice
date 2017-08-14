const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const Menu = electron.Menu

const path = require('path')
const url = require('url')
const { ipcMain } = require('electron')
const configuration = require('./app/js/configuration')
const utils = require('./app/js/utils')

const config = require('./config/config.json')
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let userHome = app.getPath('home')

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 500, height: 800 })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // menu
  Menu.setApplicationMenu(null)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  let configPath = path.join(userHome, 'text-to-voice-config.json')
  // 检测配置文件是否存在
  fs.access(configPath, fs.constants.F_OK, function (err) {
    if (err) {
      // 文件不存在，创建配置文件
      fs.writeFile(configPath, JSON.stringify(config), function (writeErr) {
        if (writeErr) {
          console.log('写文件操作失败')
        } else {
          console.log('写文件操作成功')
        }
      })
    }
  })

  let child

  ipcMain.on('open-setting', (evt) => {
    child = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      show: false,
      resizable: false,
      fullscreenable: false,
      minimizable: false,
      maximizable: false
    })
    const modalPath = path.join('file://', __dirname, '/app/setting.html')
    console.log(modalPath)
    child.loadURL(modalPath)
    child.once('ready-to-show', () => {
      child.show()
    })
  })

  ipcMain.on('close-setting', (evt) => {
    child.close()
  })

  ipcMain.on('download', (evt, url) => {
    let downloadpath

    downloadpath = url
    evt.sender.send('tips', downloadpath)
    mainWindow.webContents.downloadURL(downloadpath)
  })

  // 下载文件
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // 设置文件存放位置
    console.log('url:' + item.getURL())
    let filename = utils.getFilename(item.getURL())
    let folderpath = configuration.readSettings('path')
    console.log('path:' + folderpath + '/' + filename)
    item.setSavePath(folderpath + '/' + filename)
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        // 给子进程发送消息
        mainWindow.webContents.send('download-state', 'completed')
        console.log('Download successfully')
      } else {
        mainWindow.webContents.send('download-state', `failed:${state}`)
        console.log(`Download failed: ${state}`)
      }
    })
  })
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
