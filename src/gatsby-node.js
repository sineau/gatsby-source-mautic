//import { fetchMauticData } from './fetch.js'
import checkAuth from './auth.js'
import axios from 'axios'
import colors from 'colors'

var crypto = require('crypto')

import { readToken } from './utils.js'
import { colorsTheme } from './config.js'

colors.setTheme(colorsTheme)

exports.sourceNodes = async (
  { boundActionCreators },
  config
) => {
  const { createNode } = boundActionCreators
  let options
  if (config.auth == 'oauth2') {
    if (config.publicKey && config.secretKey
        && config.state && config.redirectUri) {
      let token = readToken()
      let res = await checkAuth(config, token)
      options = {
        headers: {'Authorization': `Bearer ${res}`}
      }
    } else {
      throw(`You didn't provide me with all the info for oauth2. Please check the documentation`.error)
    }
  } else if (config.auth == 'basic' || !config.auth) {
    if(config.publicKey && config.secretKey) {
      const auth = Buffer.from(`${config.publicKey}:${config.secretKey}`)
                         .toString('base64')
      options = {
        headers: {'Authorization': `Basic ${auth}`}
      }
    } else {
      throw(`You didn't provide me with all the info for basic authentication. Please check the documentation`.error)
    }
  }
  console.log('header in gatsby-node '.verbose, options)
  try {
    const data = await axios.get(`${config.baseUrl}/api/forms`, options)
    data.data.forms.forEach(d => {
      let digest = crypto.createHash('md5').update(JSON.stringify(d)).digest('hex')
      let { id, name, fields, ...rest } = d
      let node = {
        id: `${id}`,
        name,
        ...rest,
        formFields: fields,
        children: [],
        parent: null,
        internal: {
          type: 'MauticForm',
          contentDigest: digest
        }
      }
      createNode(node)
    })
  } catch(err) {
    console.log(`Error caught while creating node: `.error, err)
  }
}
