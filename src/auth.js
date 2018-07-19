import oauth2 from 'simple-oauth2'
import axios from 'axios'
import express from 'express'
import colors from 'colors'

import { globalConst, colorsTheme } from './config.js'
import { writeToken } from './utils.js'

var os = require('os')

colors.setTheme(colorsTheme)

const initOauth = (config) => {
  const credentials = {
    client: {
      id: config.publicKey,
      secret: config.secretKey,
    },
    auth: {
      tokenHost: config.baseUrl,
      tokenPath: globalConst.tokenPath,
      authorizePath: globalConst.authPath
    }
  }
  return oauth2.create(credentials)
}

const refreshToken = async (config, token) => {
  try {
    let oauth = initOauth(config)
    let accessToken = oauth.accessToken.create(token)
    console.log(`\nRefreshing Token:\n`.info, accessToken)
    token = await accessToken.refresh()
    let chtoken = await checkToken(config, token)
    console.log('chtoken is '.info, chtoken)
    if (chtoken.status === 400) {
      return chtoken
    }
    if (chtoken.token === token) {
      writeToken(token)
      return token
    } else {
      throw "Internal error"
    }
  } catch(err) {
    console.log(`\nError while refreshing token: ${err}`.error)
  }
}

const checkToken = async (config, chToken) => {
  const token = chToken.token || chToken
  console.log(`\nToken in checkToken\n`.info, token)
  let accessToken = token['access_token']
  const options = {
    headers: {'Authorization': `Bearer ${accessToken}`}
  }
  try {
    console.log(`\nCalling axios with token:\n`.info, options)
    const response = await axios
      .get(`${config.baseUrl}/api/contacts`,options)
    console.log(`\nResponse from axios: ${response.status}, errors: ${response.data.errors? response.data.errors[0].type : 'none'}, success: ${response.data.total}`.info)
    if (response.data.errors && response.data.errors[0].code == 401) {
      console.log('checkToken 401'.debug)
      return {status: 400}
    } else if(response.status === 200
              && accessToken && typeof(response.data.total) === 'string') {
      console.log('checkToken 200'.debug)
      return {status: 200, token: chToken}
    } else {
      throw `\nUncaught Error ${response.status},
              ${response.error}, ${response.error_description}`
    }
  } catch(err) {
    console.log(`\nError while checking token: ${err}`.error)
  }
}

const checkAuth = async (config, token) => {
  if(token) {
    let result = await checkToken(config, token)
    if(result.status === 400) {
      console.log(`\nAccess Token invalid, refreshing token\n`.warn, token)
      token = await refreshToken(config, token)
      if (token.status === 400) {
        console.log('\nRefresh Token is expired, refreshing authentication'.warn)
        const result = await authMautic(config)
        return result//.token['access_token']
      }
    } else if(result.status === 200) return result.token['access_token']
  } else {
    console.log('\nToken is not present. Fetching a new one...'.warn)
    const result = await authMautic(config)
    return result//.token['access_token']
  }
}

const authMautic =  (config) => {
  const oauth = initOauth(config)
  const authUri = oauth.authorizationCode.authorizeURL({
    redirect_uri: globalConst.redirectUri,
    state: config.state
  })
  const app = express()
  var server = app.listen(globalConst.expressPort, () => {
    console.log(`listening! please visit ${os.hostname}:${globalConst.expressPort}/auth to start authenticating`.warn)
  })
  return new Promise((resolve) => {
    app.get('/auth',  (req,res) => {
      console.log(`\nAuth hit`.verbose)
      res.redirect(authUri)
    })
    app.get('/callback', (req, res) => {
      if(req.query.state == config.state) {
        console.log(`\nCallback hit`.verbose, req.query)
        const code = req.query.code
        res.send('Authentication code received!')
        resolve({
          redirect_uri: globalConst.redirectUri,
          code
        })
      } else {
        res.send(`ATTENTION!\nSeems like the state is manipulated on the way back. This probably means XSRF!`)
      }
    })
  }).then((res) => {
    const result = oauth.authorizationCode.getToken(res)
    return result
  }).then((res) => {
    const accessToken = oauth.accessToken.create(res)
    console.log(`\nCallback result is\n`.verbose, accessToken)
    //    let chToken = checkToken(config, accessToken)
    //    chToken = chToken
    return Promise.all([checkToken(config, accessToken), res])
  }).then((res) => {
    server.close(() => {
      console.log('\nFetching token done, closing down server'.info)
    })
    const result = res[0]['token']['token']
    const token = result['access_token']
    console.log('resolve is ', res[1]['access_token'], token)
    if(token === res[1]['access_token']) {
      writeToken(result)
      return token
    } else {
      throw 'Internal error'
    }
  }).catch((err) => {
    console.log('\nError while fetching token,', err)
  })
}

export default checkAuth
