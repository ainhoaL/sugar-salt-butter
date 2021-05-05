const { OAuth2Client } = require('google-auth-library')
const CLIENT_ID = process.env.CLIENT_ID
const WEBCLIENT_ID = process.env.WEBCLIENT_ID

module.exports = {
  verify (req, res, next) {
    if (req.headers && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1]
      if (token) {
        return module.exports.internal.verifyToken(token)
          .catch(() => {
            // We probably got an auth token instead of id token, try and get the user id in a different way
            return module.exports.internal.getUserIdFromTokenInfo(token)
          })
          .then((userId) => {
            if (userId) {
              req.userId = userId
              return next()
            } else {
              const err = new Error('Failed to verify oauth2 token')
              err.status = 401
              return next(err)
            }
          })
          .catch(() => {
            const err = new Error('Failed to verify oauth2 token')
            err.status = 401
            return next(err)
          })
      } else {
        const err = new Error('Missing oauth2 token in authorization header')
        err.status = 401
        return next(err)
      }
    } else {
      const err = new Error('Missing authorization header')
      err.status = 401
      return next(err)
    }
  }
}

module.exports.internal = {
  async verifyToken (token) {
    const client = module.exports.internal.getOauthClient(WEBCLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: WEBCLIENT_ID
    })
    const payload = ticket.getPayload(WEBCLIENT_ID)
    const userId = payload.sub
    return Promise.resolve(userId)
  },
  async getUserIdFromTokenInfo (token) {
    const client = module.exports.internal.getOauthClient(CLIENT_ID)
    const tokenInfo = await client.getTokenInfo(token)
    return Promise.resolve(tokenInfo.sub)
  },
  /* istanbul ignore next */
  getOauthClient (clientId) {
    return new OAuth2Client(clientId)
  }
}
