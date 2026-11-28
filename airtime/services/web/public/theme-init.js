// Runs before the app: apply the saved theme ("light" | "dark" | "system") without a flash.
;(function () {
  var pref = 'system'
  try {
    pref = localStorage.getItem('airtime.theme') || 'system'
  } catch (e) {
    /* storage may be blocked */
  }
  var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  var root = document.documentElement
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
  root.style.colorScheme = dark ? 'dark' : 'light'
})()
