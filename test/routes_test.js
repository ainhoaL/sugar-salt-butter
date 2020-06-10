const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

let app
const authentication = require('../utils/authentication.js')
const recipesController = require('../controllers/recipes_controller.js')
const listsController = require('../controllers/lists_controller.js')

describe('Routes', () => {
  describe('recipes', () => {
    let recipeCreateStub
    let recipesGetStub
    let recipesUpdateStub
    let recipeSearchStub
    let verifyStub

    const userId = 'user1'

    const testRecipe = {
      userId: userId,
      title: 'test cake'
    }

    const dbRecipe = {
      _id: 'testId',
      userId: userId,
      title: 'test cake'
    }

    beforeEach(() => {
      recipeCreateStub = sinon.stub(recipesController, 'create')
      recipeCreateStub.callsFake((req, res) => {
        return res.send(dbRecipe)
      })
      recipesGetStub = sinon.stub(recipesController, 'get')
      recipesUpdateStub = sinon.stub(recipesController, 'update')
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
      recipesUpdateStub.restore()
      recipeSearchStub.restore()
      verifyStub.restore()
    })

    describe('/api/v1/recipes', () => {
      it('POST creates a new recipe', (done) => {
        request(app)
          .post('/api/v1/recipes')
          .send(testRecipe)
          .expect(200)
          .end((error, response) => {
            expect(response.body).to.deep.equal(dbRecipe)
            done(error)
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
              .end((error, response) => {
                expect(response.body).to.deep.equal(dbRecipe)
                done(error)
              })
          })
        })

        describe('with an id that does not exist', () => {
          beforeEach(() => {
            recipesGetStub.callsFake((req, res) => {
              return res.sendStatus(404)
            })
          })

          it('returns 404', (done) => {
            request(app)
              .get('/api/v1/recipes/33')
              .expect(404)
              .end((error, response) => {
                done(error)
              })
          })
        })
      })

      describe('PUT /:id', (done) => {
        describe('with an existing id', () => {
          beforeEach(() => {
            recipesUpdateStub.callsFake((req, res) => {
              return res.sendStatus(204)
            })
          })

          it('updates the recipe and returns 204 with no content', (done) => {
            request(app)
              .put('/api/v1/recipes/21')
              .send(testRecipe)
              .expect(204)
              .end((error, response) => {
                expect(response.body).to.deep.equal({})
                done(error)
              })
          })
        })

        describe('with an id that does not exist', () => {
          beforeEach(() => {
            recipesUpdateStub.callsFake((req, res) => {
              return res.sendStatus(404)
            })
          })

          it('returns 404', (done) => {
            request(app)
              .put('/api/v1/recipes/33')
              .send(testRecipe)
              .expect(404)
              .end((error) => {
                done(error)
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
          .end((error, response) => {
            expect(response.body).to.deep.equal(dbRecipe)
            done(error)
          })
      })
    })
  })

  describe('lists', () => {
    let listsCreateStub
    let listsGetStub
    let listsUpdateStub
    let verifyStub

    const userId = 'user1'

    const testList = {
      userId: userId,
      title: 'test shopping list',
      recipeId: 'testRecipeId'
    }

    const dbList = {
      _id: 'testId',
      userId: userId,
      title: 'test shopping list',
      items: [{ name: 'first item' }]
    }

    beforeEach(() => {
      listsCreateStub = sinon.stub(listsController, 'create')
      listsCreateStub.callsFake((req, res) => {
        return res.send(dbList)
      })
      listsGetStub = sinon.stub(listsController, 'get')
      listsUpdateStub = sinon.stub(listsController, 'update')

      verifyStub = sinon.stub(authentication, 'verify')
      verifyStub.callsFake((req, res, next) => {
        req.userId = userId
        return next()
      })

      app = require('../app.js')
    })

    afterEach(() => {
      listsCreateStub.restore()
      listsGetStub.restore()
      listsUpdateStub.restore()
      verifyStub.restore()
    })

    describe('/api/v1/lists', () => {
      it('POST creates a new list', (done) => {
        request(app)
          .post('/api/v1/lists')
          .send(testList)
          .expect(200)
          .end((error, response) => {
            expect(response.body).to.deep.equal(dbList)
            done(error)
          })
      })

      describe('GET /:id', (done) => {
        describe('with an existing id', () => {
          beforeEach(() => {
            listsGetStub.callsFake((req, res) => {
              return res.send(dbList)
            })
          })

          it('returns a recipe', (done) => {
            request(app)
              .get('/api/v1/lists/21')
              .expect(200)
              .end((error, response) => {
                expect(response.body).to.deep.equal(dbList)
                done(error)
              })
          })
        })

        describe('with an id that does not exist', () => {
          beforeEach(() => {
            listsGetStub.callsFake((req, res) => {
              return res.sendStatus(404)
            })
          })

          it('returns 404', (done) => {
            request(app)
              .get('/api/v1/lists/33')
              .expect(404)
              .end((error, response) => {
                done(error)
              })
          })
        })
      })

      describe('PUT /:id', (done) => {
        describe('with an existing id', () => {
          beforeEach(() => {
            listsUpdateStub.callsFake((req, res) => {
              return res.sendStatus(204)
            })
          })

          it('updates the list and returns 204 with no content', (done) => {
            request(app)
              .put('/api/v1/lists/21')
              .send(testList)
              .expect(204)
              .end((error, response) => {
                expect(response.body).to.deep.equal({})
                done(error)
              })
          })
        })

        describe('with an id that does not exist', () => {
          beforeEach(() => {
            listsUpdateStub.callsFake((req, res) => {
              return res.sendStatus(404)
            })
          })

          it('returns 404', (done) => {
            request(app)
              .put('/api/v1/lists/33')
              .send(testList)
              .expect(404)
              .end((error) => {
                done(error)
              })
          })
        })
      })
    })
  })
})
