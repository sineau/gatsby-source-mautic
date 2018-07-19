const globalConst = {}
  globalConst.expressPort = "3000"
  globalConst.tokenPath = 'oauth/v2/token'
  globalConst.authPath = 'oauth/v2/authorize'
  globalConst.redirectUri = `http://localhost:${globalConst.expressPort}/callback`

const colorsTheme = {
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
}
export default { globalConst, colorsTheme }
