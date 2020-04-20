const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const events = require('events')
const httpMocks = require('node-mocks-http')

const authentication = require('../../utils/authentication')

describe('Authentication', () => {
  describe('internal', () => {
    let oauth2clientStub
    const oauthClientInstance = {
      verifyIdToken: () => {},
      getTokenInfo: () => {}
    }
    beforeEach(() => {
      oauth2clientStub = sinon.stub(authentication.internal, 'getOauthClient')
      oauth2clientStub.returns(oauthClientInstance)
    })

    afterEach(() => {
      oauth2clientStub.restore()
    })

    describe('verifyToken', () => {
      let verifyIdTokenStub
      const fakeTicket = {
        getPayload: () => {
          return {
            sub: 'testuserId'
          }
        }
      }

      beforeEach(() => {
        verifyIdTokenStub = sinon.stub(oauthClientInstance, 'verifyIdToken')
      })

      afterEach(() => {
        verifyIdTokenStub.restore()
      })

      it('returns a promise with userId when the token is validated successfully', () => {
        verifyIdTokenStub.resolves(fakeTicket)

        expect(authentication.internal.verifyToken('testToken')).to.not.be.rejected
          .then((userId) => {
            expect(verifyIdTokenStub.callCount).to.equal(1)
            expect(userId).to.equal('testuserId')
          })
      })
      it('returns a rejected promise if validation fails', () => {
        verifyIdTokenStub.rejects(new Error('not validated'))

        expect(authentication.internal.verifyToken('testToken')).to.be.rejectedWith('not validated')
          .then(() => {
            expect(verifyIdTokenStub.callCount).to.equal(1)
          })
      })
    })

    describe('getInfo', () => {
      let getTokenInfoStub

      beforeEach(() => {
        getTokenInfoStub = sinon.stub(oauthClientInstance, 'verifyIdToken')
      })

      afterEach(() => {
        getTokenInfoStub.restore()
      })

      it('returns a promise with userId when the token is validated successfully', () => {
        getTokenInfoStub.resolves({ sub: 'testuserid' })

        expect(authentication.internal.getUserIdFromTokenInfo('testToken')).to.not.be.rejected
          .then((userId) => {
            expect(getTokenInfoStub.callCount).to.equal(1)
            expect(userId).to.equal('testuserId')
          })
      })
      it('returns a rejected promise if validation fails', () => {
        getTokenInfoStub.rejects(new Error('not validated'))

        expect(authentication.internal.getUserIdFromTokenInfo('testToken')).to.be.rejectedWith('not validated')
          .then(() => {
            expect(getTokenInfoStub.callCount).to.equal(1)
          })
      })
    })
  })

  describe('verify', () => {
    let req, res
    let verifyTokenStub, getUserIdFromTokenInfoStub
    let fakeNext

    beforeEach(() => {
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter })

      verifyTokenStub = sinon.stub(authentication.internal, 'verifyToken')
      getUserIdFromTokenInfoStub = sinon.stub(authentication.internal, 'getUserIdFromTokenInfo')
      fakeNext = sinon.stub()
    })

    afterEach(() => {
      verifyTokenStub.restore()
      getUserIdFromTokenInfoStub.restore()
    })

    it('calls next with an error if there is no authorization header', () => {
      req = httpMocks.createRequest({})
      authentication.verify(req, res, fakeNext)
      expect(fakeNext.callCount).to.equal(1)
      const nextArg = fakeNext.getCall(0).args[0]
      expect(nextArg.status).to.equal(401)
      expect(nextArg.message).to.equal('Missing authorization header')
    })

    it('calls next with an error if the authorization header has no oauth2 bearer token', () => {
      req = httpMocks.createRequest({ headers: { Authorization: 'faketoken' } })
      authentication.verify(req, res, fakeNext)
      expect(fakeNext.callCount).to.equal(1)
      const nextArg = fakeNext.getCall(0).args[0]
      expect(nextArg.status).to.equal(401)
      expect(nextArg.message).to.equal('Missing oauth2 token in authorization header')
    })

    context('when the authorization header has a oauth2 token', () => {
      beforeEach(() => {
        req = httpMocks.createRequest({ headers: { Authorization: 'bearer realtoken' } })
      })

      context('when verifyToken succeeds and returns a userId', () => {
        it('sets userId in the request object', () => {
          verifyTokenStub.resolves('verifiedUserId')

          return authentication.verify(req, res, fakeNext).then(() => {
            expect(fakeNext.callCount).to.equal(1)
            const nextArg = fakeNext.getCall(0).args[0]
            expect(nextArg).to.equal(undefined)
            expect(req.userId).to.equal('verifiedUserId')
          })
        })
      })

      context('when verifyToken fails', () => {
        beforeEach(() => {
          verifyTokenStub.rejects('That is not an id token!')
        })

        context('when getUserIdFromTokenInfo succeeds', () => {
          it('sets userId in the request object if there is a userId', () => {
            getUserIdFromTokenInfoStub.resolves('tokenfrominfo')

            return authentication.verify(req, res, fakeNext).then(() => {
              expect(fakeNext.callCount).to.equal(1)
              const nextArg = fakeNext.getCall(0).args[0]
              expect(nextArg).to.equal(undefined)
              expect(req.userId).to.equal('tokenfrominfo')
            })
          })

          it('calls next with an error if there is no userId', () => {
            getUserIdFromTokenInfoStub.resolves()

            return authentication.verify(req, res, fakeNext).then(() => {
              expect(fakeNext.callCount).to.equal(1)
              const nextArg = fakeNext.getCall(0).args[0]
              expect(nextArg.status).to.equal(401)
              expect(nextArg.message).to.equal('Failed to verify oauth2 token')
            })
          })
        })

        context('when getUserIdFromTokenInfo fails', () => {
          it('calls next with an error', () => {
            getUserIdFromTokenInfoStub.rejects('No user with that token!')

            return authentication.verify(req, res, fakeNext).then(() => {
              expect(fakeNext.callCount).to.equal(1)
              const nextArg = fakeNext.getCall(0).args[0]
              expect(nextArg.status).to.equal(401)
              expect(nextArg.message).to.equal('Failed to verify oauth2 token')
            })
          })
        })
      })
    })
  })
})
