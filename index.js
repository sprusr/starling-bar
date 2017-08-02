const $ = window.jQuery = window.$ = require('jquery')
require('bootstrap')

const {ipcRenderer, shell} = require('electron')

const personalAuthForm = document.querySelector('#personal-auth-form')
const accessTokenInput = document.querySelector('#access-token-input')

$('#personal-auth-form').on('submit', (event) => {
  event.preventDefault()
  ipcRenderer.send('personal-auth-token', $('#access-token-input').val() || ' ')
})

$(document).on('click', 'a[href^="http"]', (event) => {
  event.preventDefault()
  shell.openExternal(event.target.href)
})

ipcRenderer.on('personal-auth-error', (event, error) => {
  $('#error').html(`
    <div class="alert alert-warning alert-dismissible" role="alert">
      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      <strong>Error</strong>: ${error}
    </div>`)
})
