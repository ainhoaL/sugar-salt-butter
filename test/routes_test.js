const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

let app = require('../app.js')
let recipesController = require('../controllers/recipes_controller.js')

describe('Routes', () => {
  let recipeCreateStub
  let recipesGetStub

  let testRecipe = {
    userId: 'user1',
    title: 'test cake'
  }

  let dbRecipe = {
    _id: 'testId',
    userId: 'user1',
    title: 'test cake'
  }

  beforeEach(() => {
    recipeCreateStub = sinon.stub(recipesController, 'create')
    recipeCreateStub.callsFake((req, res) => {
      return res.send(dbRecipe)
    })
    recipesGetStub = sinon.stub(recipesController, 'getRecipe')
  })

  afterEach(() => {
    recipeCreateStub.restore()
    recipesGetStub.restore()
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
})
