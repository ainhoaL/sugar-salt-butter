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
    let recipesGetAllStub
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
      recipesGetAllStub = sinon.stub(recipesController, 'getAll')
      recipesGetAllStub.callsFake((req, res) => {
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
      recipesGetAllStub.restore()
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

      describe('GET', (done) => {
        it('GET finds a recipe', (done) => {
          request(app)
            .get('/api/v1/recipes')
            .expect(200)
            .end((error, response) => {
              expect(response.body).to.deep.equal(dbRecipe)
              done(error)
            })
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
  })

  describe('lists', () => {
    let listsGetStub
    let listsCreateStub
    let listsGetAllStub
    let addRecipeToListStub
    let deleteRecipeFromListStub
    let verifyStub

    const userId = 'user1'

    const testList = {
      title: 'test shopping list'
    }

    const dbTestLists = [
      { _id: 'list1', title: 'test shopping list', items: [{ name: 'first item' }] },
      { _id: 'list2', title: 'test shopping list 2', items: [{ quantity: 1, name: 'second item' }] }
    ]

    const testListRecipe = {
      recipeId: 'recipe1',
      recipeServings: '4'
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
      listsGetAllStub = sinon.stub(listsController, 'getAll')
      listsGetAllStub.callsFake((req, res) => {
        return res.send(dbTestLists)
      })
      addRecipeToListStub = sinon.stub(listsController, 'addRecipeToList')
      addRecipeToListStub.callsFake((req, res) => {
        return res.sendStatus(204)
      })
      deleteRecipeFromListStub = sinon.stub(listsController, 'deleteRecipeFromList')
      deleteRecipeFromListStub.callsFake((req, res) => {
        return res.sendStatus(204)
      })

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
      listsGetAllStub.restore()
      addRecipeToListStub.restore()
      deleteRecipeFromListStub.restore()
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

      it('GET', (done) => {
        request(app)
          .get('/api/v1/lists')
          .expect(200)
          .end((error, response) => {
            expect(response.body).to.deep.equal(dbTestLists)
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
    })

    describe('/api/v1/lists/:id/recipes', () => {
      it('POST adds a recipe to a list', (done) => {
        request(app)
          .post('/api/v1/lists/list1/recipes')
          .send(testListRecipe)
          .expect(204)
          .end((error, response) => {
            done(error)
          })
      })

      it('DELETE removes a recipe from a list', (done) => {
        request(app)
          .delete('/api/v1/lists/list1/recipes/recipe1')
          .expect(204)
          .end((error, response) => {
            done(error)
          })
      })
    })
  })
})
