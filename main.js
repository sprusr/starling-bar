const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require('path')
const Starling = require('starling-developer-sdk')
const storage = require('electron-json-storage')

const assetsDirectory = path.join(__dirname, 'assets')

let starling = undefined
let tray = undefined
let trayMenu = undefined
let authWindow = undefined

let config = {
  starling: {}
}

// don't show the app in the dock
app.dock.hide()

app.on('ready', () => {
  createSystemMenu()
  createTray()
  loadConfig()
})

const loadConfig = () => {
  storage.get('starling', function(error, data) {
    config.starling = {
      accessToken: data.accessToken,
      displayInStatusbar: data.displayInStatusbar || true
    }

    if (config.starling.accessToken) {
      starling = new Starling({accessToken: config.starling.accessToken})
      starling.getBalance().catch(() => {
        starling = null
        loadPreAuthTray()
      }).then(() => {
        loadTray()
      })
    } else {
      loadPreAuthTray()
    }
  })
}

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'sbTemplate.png'))
}

const loadPreAuthTray = () => {
  tray.setTitle('')
  trayMenu = Menu.buildFromTemplate([
    {label: 'Enter personal auth token...', click: doPersonalAuth},
    {type: 'separator'},
    {label: 'Quit', role: 'quit'}
  ])
  tray.setContextMenu(trayMenu)
}

const loadTray = () => {
  if (!starling) {
    return
  }

  updateTray()
  setInterval(updateTray, 30000)
}

const updateTray = () => {
  if (!starling) {
    return
  }

  starling.getBalance().then(({data}) => {
    if (config.starling.displayInStatusbar) {
      tray.setTitle(`£${data.effectiveBalance}`)
    } else {
      tray.setTitle('')
    }

    trayMenu = Menu.buildFromTemplate([
      {type: 'checkbox', label: 'Display in statusbar', click: setDisplayInStatusbar, checked: config.starling.displayInStatusbar},
      {type: 'separator'},
      {label: `Balance`, enabled: false},
      {label: `  - £${data.effectiveBalance}`, enabled: false},
      {type: 'separator'},
      {label: 'Log out', click: logOut},
      {label: 'Quit', role: 'quit'}
    ])
    tray.setContextMenu(trayMenu)
  })
}

const setDisplayInStatusbar = (item) => {
  config.starling.displayInStatusbar = item.checked
  updateTray()
  storage.set('starling', config.starling, (error) => {
    //
  })
}

const createAuthWindow = () => {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.close()
  }

  return new BrowserWindow({
    width: 320,
    height: 420,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    alwaysOnTop: true
  })
}

const doPersonalAuth = () => {
  authWindow = createAuthWindow()
  authWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
}

ipcMain.on('personal-auth-token', (event, token) => {
  starling = new Starling({accessToken: token})
  starling.getBalance().then(({data}) => {
    config.starling.accessToken = token
    storage.set('starling', config.starling, function(error) {
      authWindow.hide()
      loadTray()
    })
  }).catch((error) => {
    event.sender.send('personal-auth-error', 'Invalid auth token')
  })
})

const logOut = () => {
  config.starling.accessToken = null
  storage.set('starling', config.starling, function(error) {
    loadPreAuthTray()
  })
}

// required to enable certain system functions such as clipboard
const createSystemMenu = () => {
  var template = [{
    label: "StarlingBar",
    submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit() }}
    ]
  }, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
  }]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
