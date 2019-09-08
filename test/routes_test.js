const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

let app
let authentication = require('../utils/authentication.js')
let recipesController = require('../controllers/recipes_controller.js')

describe('Routes', () => {
  let recipeCreateStub
  let recipesGetStub
  let recipeSearchStub
  let verifyStub

  let userId = 'user1'

  let testRecipe = {
    userId: userId,
    title: 'test cake'
  }

  let dbRecipe = {
    _id: 'testId',
    userId: userId,
    title: 'test cake'
  }

  beforeEach(() => {
    recipeCreateStub = sinon.stub(recipesController, 'create')
    recipeCreateStub.callsFake((req, res) => {
      return res.send(dbRecipe)
    })
    recipesGetStub = sinon.stub(recipesController, 'getRecipe')
    recipeSearchStub = sinon.stub(recipesController, 'find')
    recipeSearchStub.callsFake((req, res) => {
      return res.send(dbRecipe)
    })

    verifyStub = sinon.stub(authentication, 'verify')
    verifyStub.callsFake((req, res, next) => {
      req.userId = userId
      return next()
    })

    app = require('../app.js')
  })

  afterEach(() => {
    recipeCreateStub.restore()
    recipesGetStub.restore()
    recipeSearchStub.restore()
    verifyStub.restore()
  })

  describe('/api/v1/recipes', () => {
    it('POST creates a new recipe', (done) => {
      request(app)
        .post('/api/v1/recipes')
        .send(testRecipe)
        .expect(200)
        .end((_, response) => {
          expect(response.body).to.deep.equal(dbRecipe)
          done()
        })
    })

    describe('GET /:id', (done) => {
      describe('with an existing id', () => {
        beforeEach(() => {
          recipesGetStub.callsFake((req, res) => {
            return res.send(dbRecipe)
          })
        })

        it('returns a recipe', (done) => {
          request(app)
            .get('/api/v1/recipes/21')
            .expect(200)
            .end((_, response) => {
              expect(response.body).to.deep.equal(dbRecipe)
              done()
            })
        })
      })

      describe('with an id that does not exist', () => {
        beforeEach(() => {
          recipesGetStub.callsFake((req, res) => {
            return res.send(dbRecipe)
          })
        })

        it('returns 404', (done) => {
          request(app)
            .get('/api/v1/recipes/33')
            .expect(404)
            .end(() => {
              done()
            })
        })
      })
    })
  })

  describe('/api/v1/recipes/search', () => {
    it('GET finds a recipe', (done) => {
      request(app)
        .get('/api/v1/recipes/search?url=http://test&userId=me')
        .expect(200)
        .end((_, response) => {
          expect(response.body).to.deep.equal(dbRecipe)
          done()
        })
    })
  })
})
