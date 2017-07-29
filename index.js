const {ipcRenderer, shell} = require('electron')

const personalAuthForm = document.querySelector('#personal-auth-form')
const accessTokenInput = document.querySelector('#access-token-input')

personalAuthForm.addEventListener('submit', (e) => {
  e.preventDefault()
  ipcRenderer.send('personal-auth', accessTokenInput.value)
})
