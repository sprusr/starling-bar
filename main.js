const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require('path')
const Starling = require('starling-developer-sdk')

const assetsDirectory = path.join(__dirname, 'assets')

let starling = undefined
let tray = undefined
let trayMenu = undefined
let authWindow = undefined
let displayInStatusbar = false

// Don't show the app in the doc
app.dock.hide()

app.on('ready', () => {
  createTray()
})

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit()
})

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'sbTemplate.png'))
  trayMenu = Menu.buildFromTemplate([
    {label: 'Enter Personal Auth Token...', click: doPersonalAuth},
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
    if (displayInStatusbar) {
      tray.setTitle(`£${data.effectiveBalance}`)
    } else {
      tray.setTitle('')
    }

    trayMenu = Menu.buildFromTemplate([
      {type: 'checkbox', label: 'Display in statusbar', click: setDisplayInStatusbar, checked: displayInStatusbar},
      {type: 'separator'},
      {label: `Balance`, enabled: false},
      {label: `  - £${data.effectiveBalance}`, enabled: false},
      {type: 'separator'},
      {label: 'Quit', role: 'quit'}
    ])
    tray.setContextMenu(trayMenu)
  });
}

const setDisplayInStatusbar = (item) => {
  displayInStatusbar = item.checked
  updateTray()
}

const createAuthWindow = () => {
  if (authWindow) {
    authWindow.close()
  }

  return new BrowserWindow({})
}

const doPersonalAuth = () => {
  authWindow = createAuthWindow()
  authWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
}

ipcMain.on('personal-auth', (event, token) => {
  starling = new Starling({accessToken: token})
  authWindow.hide()
  loadTray()
})
