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
  })

  afterEach(() => {
    recipeCreateStub.restore()
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
  })
})
