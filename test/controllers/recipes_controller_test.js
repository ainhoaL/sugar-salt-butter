const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const mongoose = require('mongoose')
const events = require('events')
const httpMocks = require('node-mocks-http')

const recipesController = require('../../controllers/recipes_controller')
const Recipe = mongoose.model('recipe')

describe('Recipes controller', () => {
  describe('Handles requests', () => {
    let req, res
    beforeEach(() => {
      req = httpMocks.createRequest({})
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter })

      // set defaults
      req.userId = 'testUserId'
    })

    describe('create', () => {
      let recipeCreateStub

      beforeEach(() => {
        recipeCreateStub = sinon.stub(Recipe, 'create')
      })

      afterEach(() => {
        recipeCreateStub.restore()
      })

      describe('receives a request without some parameters', () => {
        const testRecipe = {
          userId: 'testUserId',
          title: 'test cake'
        }

        it('does not create a recipe in the database if recipe body has no ingredients', (done) => {
          req.body = testRecipe

          res.on('end', () => {
            expect(recipeCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            done()
          })

          recipesController.create(req, res)
        })

        it('returns an error if request has no userId', (done) => {
          req.body = testRecipe
          req.userId = null

          res.on('end', () => {
            expect(recipeCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          recipesController.create(req, res)
        })
      })

      describe('receives a recipe with ingredients', () => {
        const testRecipe = {
          userId: 'testUserId',
          title: 'test cake',
          ingredients: 'fake ingredient'
        }

        const dbRecipe = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        it('creates a new recipe', (done) => {
          req.body = testRecipe

          recipeCreateStub.resolves(dbRecipe)

          res.on('end', () => {
            expect(recipeCreateStub.callCount).to.equal(1)
            expect(recipeCreateStub).to.have.been.calledWith(testRecipe)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal(dbRecipe)
            done()
          })

          recipesController.create(req, res)
        })
      })
    })

    describe('get', () => {
      let recipeFindOneStub

      beforeEach(() => {
        recipeFindOneStub = sinon.stub(Recipe, 'findOne')
      })

      afterEach(() => {
        recipeFindOneStub.restore()
      })

      describe('receives a request with an id', () => {
        const dbRecipe = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        describe('and the recipe exists', () => {
          it('returns the recipe', (done) => {
            req.params = { id: 'testId' }

            recipeFindOneStub.returns(Promise.resolve(dbRecipe))

            res.on('end', () => {
              expect(recipeFindOneStub.callCount).to.equal(1)
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(dbRecipe)
              done()
            })

            recipesController.get(req, res)
          })
        })

        describe('but the recipe does not exist', () => {
          it('returns a 404 error', (done) => {
            req.params = { id: 'norecipe' }

            recipeFindOneStub.returns(Promise.resolve(null))

            res.on('end', () => {
              expect(recipeFindOneStub.callCount).to.equal(1)
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'norecipe', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(404)
              done()
            })

            recipesController.get(req, res)
          })
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            req.params = { id: 'testId' }

            recipeFindOneStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeFindOneStub.callCount).to.equal(1)
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.get(req, res)
          })
        })
      })

      describe('receives a request without recipe id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID')
            done()
          })

          recipesController.get(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }
          req.userId = null

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          recipesController.get(req, res)
        })
      })
    })

    describe('deleteRecipe', () => {
      let recipeDeleteOneStub

      beforeEach(() => {
        recipeDeleteOneStub = sinon.stub(Recipe, 'deleteOne')
      })

      afterEach(() => {
        recipeDeleteOneStub.restore()
      })

      describe('receives a request with an id', () => {
        describe('and the recipe exists', () => {
          it('returns 204', (done) => {
            req.params = { id: 'testId' }

            recipeDeleteOneStub.resolves()

            res.on('end', () => {
              expect(recipeDeleteOneStub.callCount).to.equal(1)
              expect(recipeDeleteOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(204)
              done()
            })

            recipesController.deleteRecipe(req, res)
          })
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            req.params = { id: 'testId' }

            recipeDeleteOneStub.rejects(new Error('Error deleting'))

            res.on('end', () => {
              expect(recipeDeleteOneStub.callCount).to.equal(1)
              expect(recipeDeleteOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error deleting')
              done()
            })

            recipesController.deleteRecipe(req, res)
          })
        })
      })

      describe('receives a request without recipe id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }

          res.on('end', () => {
            expect(recipeDeleteOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID')
            done()
          })

          recipesController.deleteRecipe(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }
          req.userId = null

          res.on('end', () => {
            expect(recipeDeleteOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          recipesController.deleteRecipe(req, res)
        })
      })
    })

    describe('getAll', () => {
      let recipeFindStub

      beforeEach(() => {
        recipeFindStub = sinon.stub(Recipe, 'find')
      })

      afterEach(() => {
        recipeFindStub.restore()
      })

      describe('receives a request but it has no userId', () => {
        it('does not search for the recipe and returns an error', (done) => {
          req.userId = null

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })
          recipesController.getAll(req, res)
        })
      })

      describe('receives a request without a query', () => {
        it('does not search for the recipe and returns an error', (done) => {
          req.query = null

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            done()
          })
          recipesController.getAll(req, res)
        })
      })

      describe('receives a request get all recipes', () => {
        const query = { userId: 'testUserId', limit: 5, skip: 12, sortBy: 'title', orderBy: 1, title: 'cake', wantToTry: true }
        let expectedQuery
        let expectedSortObj
        const countStub = sinon.stub()
        const skipStub = sinon.stub()

        const dbRecipes = [{
          _id: 'testId1',
          userId: 'testUserId',
          url: 'http://testrecipe.com/blah',
          title: 'vanilla ice cream',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }, {
          _id: 'testId2',
          userId: 'testUserId',
          url: 'http://testrecipe.com/test1',
          title: 'strawberry ice cream',
          ingredients: [{ quantity: '1', unit: 'cup', name: 'cream' }]
        }]

        beforeEach(() => {
          expectedQuery = { userId: 'testUserId', title: 'cake', wantToTry: true }
          expectedSortObj = { title: 1 }
          const findFn = (search, score) => {
            expect(search).to.deep.equal(expectedQuery)
            return {
              countDocuments: countStub,
              sort: (sortObj) => {
                expect(sortObj).to.deep.equal(expectedSortObj)
                return {
                  limit: () => {
                    return { skip: skipStub }
                  }
                }
              }
            }
          }
          recipeFindStub.callsFake(findFn)
        })

        afterEach(() => {
          recipeFindStub.restore()
          countStub.reset()
          skipStub.reset()
        })

        it('returns results when all query parameters are sent', (done) => {
          req.query = query

          countStub.resolves(2)
          skipStub.resolves(dbRecipes)

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(2)
            expect(skipStub.callCount).to.equal(1)
            expect(skipStub).to.have.been.calledWith(12)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({
              count: 2,
              recipes: dbRecipes
            })
            done()
          })

          recipesController.getAll(req, res)
        })

        it('returns results when query has no parameters', (done) => {
          expectedQuery = { userId: 'testUserId' }
          expectedSortObj = { dateCreated: -1 }

          req.query = { userId: 'testUserId' }

          countStub.resolves(2)
          skipStub.resolves(dbRecipes)

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(2)
            expect(skipStub.callCount).to.equal(1)
            expect(skipStub).to.have.been.calledWith(0)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({
              count: 2,
              recipes: dbRecipes
            })
            done()
          })

          recipesController.getAll(req, res)
        })

        context('and getting the number of search results fails', () => {
          it('returns 500 and the error', (done) => {
            req.query = query

            countStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeFindStub.callCount).to.equal(1)
              expect(skipStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })
            recipesController.getAll(req, res)
          })
        })

        context('when there are 0 search results', () => {
          it('returns empty results', (done) => {
            req.query = query

            countStub.resolves(0)

            res.on('end', () => {
              expect(recipeFindStub.callCount).to.equal(1)
              expect(skipStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal({ count: 0, recipes: [] })
              done()
            })

            recipesController.getAll(req, res)
          })
        })

        context('when there are search results', () => {
          beforeEach(() => {
            countStub.resolves(2)
          })

          it('searches the recipes with the right skip value from query and returns the recipes', (done) => {
            req.query = query

            skipStub.resolves(dbRecipes)

            res.on('end', () => {
              expect(recipeFindStub.callCount).to.equal(2)
              expect(skipStub.callCount).to.equal(1)
              expect(skipStub).to.have.been.calledWith(12)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal({
                count: 2,
                recipes: dbRecipes
              })
              done()
            })

            recipesController.getAll(req, res)
          })

          context('and the search fails', () => {
            it('returns 500 and the error', (done) => {
              req.query = query

              skipStub.rejects(new Error('Error searching'))

              res.on('end', () => {
                expect(recipeFindStub.callCount).to.equal(2)
                expect(skipStub.callCount).to.equal(1)
                expect(skipStub).to.have.been.calledWith(12)
                expect(res._getStatusCode()).to.equal(500)
                expect(res._getData()).to.equal('Error searching')
                done()
              })
              recipesController.getAll(req, res)
            })
          })
        })
      })

      describe('receives a request to get recipes by searchString', () => {
        const query = { userId: 'testUserId', limit: 5, skip: 12, sortBy: 'title', orderBy: 1, title: 'cake', wantToTry: true, searchString: 'text search' }
        let expectedQuery
        let expectedSortObj
        const countStub = sinon.stub()
        const skipStub = sinon.stub()

        const dbRecipes = [{
          _id: 'testId1',
          userId: 'testUserId',
          url: 'http://testrecipe.com/blah',
          title: 'vanilla ice cream',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }, {
          _id: 'testId2',
          userId: 'testUserId',
          url: 'http://testrecipe.com/test1',
          title: 'strawberry ice cream',
          ingredients: [{ quantity: '1', unit: 'cup', name: 'cream' }]
        }]

        beforeEach(() => {
          expectedQuery = { userId: 'testUserId', title: 'cake', wantToTry: true, $text: { $search: '"text" "search"' } }
          expectedSortObj = { title: 1, score: { $meta: 'textScore' } }
          const findFn = (search, score) => {
            expect(search).to.deep.equal(expectedQuery)
            expect(score).to.deep.equal({ score: { $meta: 'textScore' } })
            return {
              countDocuments: countStub,
              sort: (sortObj) => {
                expect(sortObj).to.deep.equal(expectedSortObj)
                return {
                  limit: () => {
                    return { skip: skipStub }
                  }
                }
              }
            }
          }
          recipeFindStub.callsFake(findFn)
        })

        afterEach(() => {
          recipeFindStub.restore()
          countStub.reset()
          skipStub.reset()
        })

        it('returns results when all query parameters are sent', (done) => {
          req.query = query

          countStub.resolves(2)
          skipStub.resolves(dbRecipes)

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(2)
            expect(skipStub.callCount).to.equal(1)
            expect(skipStub).to.have.been.calledWith(12)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({
              count: 2,
              recipes: dbRecipes
            })
            done()
          })

          recipesController.getAll(req, res)
        })
      })

      describe('receives a request to find a recipe by url', () => {
        const query = { url: 'http://testrecipe.com/blah', userId: 'testUserId' }
        let expectedQuery
        let expectedSortObj
        const countStub = sinon.stub()
        const skipStub = sinon.stub()
        const dbRecipe = {
          _id: 'testId',
          userId: 'testUserId',
          url: 'http://testrecipe.com/blah',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        beforeEach(() => {
          expectedQuery = { userId: 'testUserId', url: 'http://testrecipe.com/blah' }
          expectedSortObj = { dateCreated: -1 }
          const findFn = (search, score) => {
            expect(search).to.deep.equal(expectedQuery)
            return {
              countDocuments: countStub,
              sort: (sortObj) => {
                expect(sortObj).to.deep.equal(expectedSortObj)
                return {
                  limit: () => {
                    return { skip: skipStub }
                  }
                }
              }
            }
          }
          recipeFindStub.callsFake(findFn)
        })

        afterEach(() => {
          recipeFindStub.restore()
          countStub.reset()
          skipStub.reset()
        })

        it('finds the recipe and returns it', (done) => {
          req.query = query

          countStub.resolves(1)
          skipStub.resolves(dbRecipe)

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(2)
            expect(skipStub.callCount).to.equal(1)
            expect(skipStub).to.have.been.calledWith(0)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({ count: 1, recipes: [dbRecipe] })
            done()
          })

          recipesController.getAll(req, res)
        })

        it('does not find the recipe and returns 404', (done) => {
          req.query = query

          countStub.resolves(0)

          res.on('end', () => {
            expect(recipeFindStub.callCount).to.equal(1)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({ count: 0, recipes: [] })
            done()
          })

          recipesController.getAll(req, res)
        })

        context('and the search fails', () => {
          it('returns 500 and the error', (done) => {
            req.query = query

            countStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeFindStub.callCount).to.equal(1)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.getAll(req, res)
          })
        })
      })

      describe('receives a request to get seasonal recipes', () => {
        let recipeAggregateStub
        let expectedAggregateParams
        const seasonMonth = 5
        const skip = 2
        const limit = 8
        const sortObj = { title: -1 }

        const dbRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        beforeEach(() => {
          expectedAggregateParams = [{ $match: { userId: 'testUserId' } },
            {
              $lookup: {
                from: 'ingredients',
                localField: 'ingredients.ingredientMatch',
                foreignField: '_id',
                as: 'ingredientsInfo'
              }
            },
            {
              $match: { 'ingredientsInfo.months': seasonMonth }
            }, { $skip: skip }, { $limit: limit }, { $sort: sortObj }]
          recipeAggregateStub = sinon.stub(Recipe, 'aggregate')
          req.query = { season: seasonMonth, skip: 2, limit: 8, orderBy: -1, sortBy: 'title' }
        })

        afterEach(() => {
          recipeAggregateStub.restore()
        })

        it('finds the recipe and returns it', (done) => {
          recipeAggregateStub.returns(Promise.resolve([dbRecipe]))

          res.on('end', () => {
            expect(recipeAggregateStub.callCount).to.equal(1)
            expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({ count: 0, recipes: [dbRecipe] })
            done()
          })

          recipesController.getAll(req, res)
        })

        describe('but there are no seasonal recipes', () => {
          it('returns empty array of recipes', (done) => {
            recipeAggregateStub.returns(Promise.resolve([]))

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal({ count: 0, recipes: [] })
              done()
            })

            recipesController.getAll(req, res)
          })
        })

        describe('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            recipeAggregateStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.getAll(req, res)
          })
        })

        describe('but season is not a number', () => {
          it('returns recipes for this current month', (done) => {
            req.query = { season: 'blah', skip: 2, limit: 8, orderBy: -1, sortBy: 'title' }
            recipeAggregateStub.returns(Promise.resolve([]))

            const nowDate = new Date()
            const currentMonth = nowDate.getMonth() + 1

            expectedAggregateParams = [{ $match: { userId: 'testUserId' } },
              {
                $lookup: {
                  from: 'ingredients',
                  localField: 'ingredients.ingredientMatch',
                  foreignField: '_id',
                  as: 'ingredientsInfo'
                }
              },
              {
                $match: { 'ingredientsInfo.months': currentMonth }
              }, { $skip: skip }, { $limit: limit }, { $sort: sortObj }]

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal({ count: 0, recipes: [] })
              done()
            })

            recipesController.getAll(req, res)
          })
        })
      })
    })

    describe('update', () => {
      let recipeReplaceOneStub

      let testRecipe

      beforeEach(() => {
        recipeReplaceOneStub = sinon.stub(Recipe, 'replaceOne')

        testRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake',
          ingredients: '2 cups fake ingredient'
        }
      })

      afterEach(() => {
        recipeReplaceOneStub.restore()
      })

      describe('receives a request with an id and body', () => {
        const dbRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake before editing',
          ingredients: [{ quantity: 1, unit: 'cup', name: 'fake ingredient' }]
        }

        describe('and the recipe exists', () => {
          it('updates the recipe', (done) => {
            req.params = { id: 'testId' }
            req.body = testRecipe

            recipeReplaceOneStub.returns(Promise.resolve(dbRecipe))

            res.on('end', () => {
              expect(recipeReplaceOneStub.callCount).to.equal(1)
              expect(recipeReplaceOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(204)
              done()
            })

            recipesController.update(req, res)
          })
        })

        describe('but the recipe does not exist', () => {
          it('returns a 404 error', (done) => {
            req.params = { id: 'norecipe' }
            req.body = testRecipe

            recipeReplaceOneStub.returns(Promise.resolve(null))

            res.on('end', () => {
              expect(recipeReplaceOneStub.callCount).to.equal(1)
              expect(recipeReplaceOneStub).to.have.been.calledWith({ _id: 'norecipe', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(404)
              done()
            })

            recipesController.update(req, res)
          })
        })

        context('and the call to update the document fails', () => {
          it('returns 500 and the error', (done) => {
            req.params = { id: 'testId' }
            req.body = testRecipe

            recipeReplaceOneStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeReplaceOneStub.callCount).to.equal(1)
              expect(recipeReplaceOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.update(req, res)
          })
        })
      })

      describe('receives a request without id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }
          req.body = testRecipe

          res.on('end', () => {
            expect(recipeReplaceOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID or body')
            done()
          })

          recipesController.update(req, res)
        })
      })

      describe('receives a request without a body', () => {
        it('returns a 400 error', (done) => {
          req.params = { id: 'testId' }
          req.body = null

          res.on('end', () => {
            expect(recipeReplaceOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID or body')
            done()
          })

          recipesController.update(req, res)
        })
      })

      describe('receives a request without a userId', () => {
        it('returns a 400 error', (done) => {
          req.params = { id: 'testId' }
          req.body = testRecipe
          req.userId = null

          res.on('end', () => {
            expect(recipeReplaceOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          recipesController.update(req, res)
        })
      })
    })

    describe('getTags', () => {
      let recipeAggregateStub
      const expectedAggregateParams = [{ $match: { userId: 'testUserId' } }, { $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }]

      beforeEach(() => {
        recipeAggregateStub = sinon.stub(Recipe, 'aggregate')
      })

      afterEach(() => {
        recipeAggregateStub.restore()
      })

      describe('receives a valid request', () => {
        describe('and there are tags', () => {
          it('returns an array of tags', (done) => {
            const tagsArray = [{ _id: 'meat', count: 3 }, { _id: 'vegetarian', count: 20 }]
            recipeAggregateStub.returns(Promise.resolve(tagsArray))

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(tagsArray)
              done()
            })

            recipesController.getTags(req, res)
          })
        })

        describe('but there are no tags', () => {
          it('returns empty array of tags', (done) => {
            recipeAggregateStub.returns(Promise.resolve([]))

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal([])
              done()
            })

            recipesController.getTags(req, res)
          })
        })

        describe('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            recipeAggregateStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeAggregateStub.callCount).to.equal(1)
              expect(recipeAggregateStub).to.have.been.calledWith(expectedAggregateParams)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.getTags(req, res)
          })
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }
          req.userId = null

          res.on('end', () => {
            expect(recipeAggregateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          recipesController.getTags(req, res)
        })
      })
    })
  })

  describe('parseIngredients', () => {
    describe('when the recipe has only one type of unit:', () => {
      describe('grams', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'g', name: 'butter' }, { quantity: 1, unit: 'g', name: 'salt' }, { quantity: 0.5, unit: 'g', name: 'pepper' }, { quantity: 1.75, unit: 'g', name: 'flour' }, { quantity: 20.5, unit: 'g', name: 'icing sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty grams Ingredient"', () => {
          const recipe = '10 grams butter\n1 gram salt\n1/2 gram pepper\n1 3/4 gram flour\n20.5 grams icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty g Ingredient"', () => {
          const recipe = '10 g butter\n1 g salt\n1/2 g pepper\n1 3/4 g flour\n20.5 g icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyg Ingredient"', () => {
          const recipe = '10g butter\n1g salt\n1/2g pepper\n1 3/4g flour\n20.5g icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty g. Ingredient"', () => {
          const recipe = '10 g. butter\n1 g. salt\n1/2 g. pepper\n1 3/4 g. flour\n20.5 g. icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyg. Ingredient"', () => {
          const recipe = '10g. butter\n1g. salt\n1/2g. pepper\n1 3/4g. flour\n20.5g. icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty gr Ingredient"', () => {
          const recipe = '10 gr butter\n1 gr salt\n1/2 gr pepper\n1 3/4 gr flour\n20.5 grs icing sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('cups', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'cup', name: 'butter' }, { quantity: 1, unit: 'cup', name: 'salt' }, { quantity: 0.5, unit: 'cup', name: 'pepper' }, { quantity: 1.75, unit: 'cup', name: 'flour' }, { quantity: 20.5, unit: 'cup', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty cups Ingredient"', () => {
          const recipe = '10 cups butter\n1 cup salt\n1/2 cup pepper\n1 3/4 cups flour\n20.5 cups sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty c Ingredient"', () => {
          const recipe = '10 c butter\n1 c salt\n1/2 c pepper\n1 3/4 c flour\n20.5 c sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtycups Ingredient"', () => {
          const recipe = '10cups butter\n1cup salt\n1/2cup pepper\n1 3/4cup flour\n20.5cups sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty C Ingredient"', () => {
          const recipe = '10 C butter\n1 C salt\n1/2 C pepper\n1 3/4 C flour\n20.5 C sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyc Ingredient"', () => {
          const recipe = '10c butter\n1c salt\n1/2c pepper\n1 3/4c flour\n20.5c sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('tbsp', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'tbsp', name: 'butter' }, { quantity: 1, unit: 'tbsp', name: 'salt' }, { quantity: 0.5, unit: 'tbsp', name: 'pepper' }, { quantity: 1.75, unit: 'tbsp', name: 'flour' }, { quantity: 20.5, unit: 'tbsp', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty tbsp Ingredient"', () => {
          const recipe = '10 tbsps butter\n1 tbsp salt\n1/2 tbsp pepper\n1 3/4 tbsp flour\n20.5 tbsp sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty Tbsp Ingredient"', () => {
          const recipe = '10 Tbsp butter\n1 Tbsp salt\n1/2 Tbsp pepper\n1 3/4 Tbsps flour\n20.5 Tbsps sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtytbsp Ingredient"', () => {
          const recipe = '10tbsps butter\n1tbsp salt\n1/2tbsp pepper\n1 3/4tbsp flour\n20.5tbsp sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty T Ingredient"', () => {
          const recipe = '10 Ts butter\n1 T salt\n1/2 T pepper\n1 3/4 T flour\n20.5 T sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty Tbl Ingredient"', () => {
          const recipe = '10 Tbls butter\n1 Tbl salt\n1/2 Tbl pepper\n1 3/4 Tbl flour\n20.5 Tbl sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty TB Ingredient"', () => {
          const recipe = '10 TBs butter\n1 TB salt\n1/2 TB pepper\n1 3/4 TB flour\n20.5 TBs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty tablespoon Ingredient"', () => {
          const recipe = '10 tablespoons butter\n1 tablespoon salt\n1/2 tablespoon pepper\n1 3/4 tablespoons flour\n20.5 tablespoons sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('tsp', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'tsp', name: 'butter' }, { quantity: 1, unit: 'tsp', name: 'salt' }, { quantity: 0.5, unit: 'tsp', name: 'pepper' }, { quantity: 1.75, unit: 'tsp', name: 'flour' }, { quantity: 20.5, unit: 'tsp', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty tsp Ingredient"', () => {
          const recipe = '10 tsps butter\n1 tsp salt\n1/2 tsp pepper\n1 3/4 tsp flour\n20.5 tsps sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtytsp Ingredient"', () => {
          const recipe = '10tsps butter\n1tsp salt\n1/2tsp pepper\n1 3/4tsp flour\n20.5tsp sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty t Ingredient"', () => {
          const recipe = '10 t butter\n1 t salt\n1/2 t pepper\n1 3/4 t flour\n20.5 t sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyt Ingredient"', () => {
          const recipe = '10t butter\n1t salt\n1/2t pepper\n1 3/4t flour\n20.5t sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty teaspoon Ingredient"', () => {
          const recipe = '10 teaspoons butter\n1 teaspoon salt\n1/2 teaspoon pepper\n1 3/4 teaspoons flour\n20.5 teaspoons sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('ml', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'ml', name: 'butter' }, { quantity: 1, unit: 'ml', name: 'salt' }, { quantity: 0.5, unit: 'ml', name: 'pepper' }, { quantity: 1.75, unit: 'ml', name: 'flour' }, { quantity: 20.5, unit: 'ml', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty ml Ingredient"', () => {
          const recipe = '10 ml butter\n1 ml salt\n1/2 ml pepper\n1 3/4 ml flour\n20.5 mls sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyml Ingredient"', () => {
          const recipe = '10ml butter\n1ml salt\n1/2ml pepper\n1 3/4mls flour\n20.5mls sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty mL Ingredient"', () => {
          const recipe = '10 mL butter\n1 mL salt\n1/2 mL pepper\n1 3/4mLs flour\n20.5 mLs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty milliliter Ingredient"', () => {
          const recipe = '10 milliliters butter\n1 milliliter salt\n1/2 milliliter pepper\n1 3/4 milliliters flour\n20.5 milliliters sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty mil Ingredient"', () => {
          const recipe = '10 mils butter\n1 mil salt\n1/2 mil pepper\n1 3/4 mil flour\n20.5 mils sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('ounce', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'oz', name: 'butter' }, { quantity: 1, unit: 'oz', name: 'salt' }, { quantity: 0.5, unit: 'oz', name: 'pepper' }, { quantity: 1.75, unit: 'oz', name: 'flour' }, { quantity: 20.5, unit: 'oz', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty oz Ingredient"', () => {
          const recipe = '10 oz butter\n1 oz salt\n1/2 oz pepper\n1 3/4 oz flour\n20.5 ozs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyoz Ingredient"', () => {
          const recipe = '10oz butter\n1oz salt\n1/2oz pepper\n1 3/4oz flour\n20.5ozs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty ounce Ingredient"', () => {
          const recipe = '10 ounces butter\n1 ounce salt\n1/2 ounce pepper\n1 3/4 ounces flour\n20.5 ounces sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyounce Ingredient"', () => {
          const recipe = '10ounces butter\n1ounce salt\n1/2ounce pepper\n1 3/4ounces flour\n20.5ounces sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('liter', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'l', name: 'butter' }, { quantity: 1, unit: 'l', name: 'salt' }, { quantity: 0.5, unit: 'l', name: 'pepper' }, { quantity: 1.75, unit: 'l', name: 'flour' }, { quantity: 20.5, unit: 'l', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty l Ingredient"', () => {
          const recipe = '10 l butter\n1 l salt\n1/2 l pepper\n1 3/4 l flour\n20.5 ls sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty L Ingredient"', () => {
          const recipe = '10 Ls butter\n1 L salt\n1/2 L pepper\n1 3/4 L flour\n20.5 Ls sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty liter Ingredient"', () => {
          const recipe = '10 liters butter\n1 liter salt\n1/2 liter pepper\n1 3/4 liters flour\n20.5 liters sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "QtyL Ingredient"', () => {
          const recipe = '10L butter\n1L salt\n1/2L pepper\n1 3/4L flour\n20.5L sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('kg', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'kg', name: 'butter' }, { quantity: 1, unit: 'kg', name: 'salt' }, { quantity: 0.5, unit: 'kg', name: 'pepper' }, { quantity: 1.75, unit: 'kg', name: 'flour' }, { quantity: 20.5, unit: 'kg', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty kg Ingredient"', () => {
          const recipe = '10 kgs butter\n1 kg salt\n1/2 kg pepper\n1 3/4 kg flour\n20.5 kgs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtykg Ingredient"', () => {
          const recipe = '10kgs butter\n1kg salt\n1/2kg pepper\n1 3/4kgs flour\n20.5kgs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty kilogram Ingredient"', () => {
          const recipe = '10 kilograms butter\n1 kilogram salt\n1/2 kilogram pepper\n1 3/4 kilograms flour\n20.5 kilograms sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty kg. Ingredient"', () => {
          const recipe = '10 kg. butter\n1 kg. salt\n1/2 kg. pepper\n1 3/4 kg. flour\n20.5 kg. sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('pound', () => {
        const expectedIngredients = [{ quantity: 10, unit: 'lb', name: 'butter' }, { quantity: 1, unit: 'lb', name: 'salt' }, { quantity: 0.5, unit: 'lb', name: 'pepper' }, { quantity: 1.75, unit: 'lb', name: 'flour' }, { quantity: 20.5, unit: 'lb', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty pounds Ingredient"', () => {
          const recipe = '10 pounds butter\n1 pound salt\n1/2 pound pepper\n1 3/4 pounds flour\n20.5 pounds sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtypounds Ingredient"', () => {
          const recipe = '10pounds butter\n1pound salt\n1/2pound pepper\n1 3/4pound flour\n20.5pounds sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty lb Ingredient"', () => {
          const recipe = '10 lbs butter\n1 lb salt\n1/2 lb pepper\n1 3/4 lbs flour\n20.5 lbs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty Lb Ingredient"', () => {
          const recipe = '10 Lbs butter\n1 Lb salt\n1/2 Lb pepper\n1 3/4 Lbs flour\n20.5 Lbs sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty lb. Ingredient"', () => {
          const recipe = '10 Lbs. butter\n1 lb. salt\n1/2lb. pepper\n1 3/4Lbs. flour\n20.5lbs. sugar'

          const parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })
    })

    describe('when the recipe has ingredients without unit', () => {
      const expectedIngredients = [{ quantity: 10, name: 'almonds' }, { quantity: 2, name: 'sprigs of thyme' }, { quantity: 4, name: 'garlic cloves' }]

      it('returns the correct parsed ingredients when it is formatted "Qty Ingredient"', () => {
        const recipe = '10 almonds\n2 sprigs of thyme\n4 garlic cloves'

        const parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(3)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })

    describe('when the recipe has ingredients without unit or quantity', () => {
      const expectedIngredients = [{ name: 'a handful of almonds' }, { name: 'a few sprigs of thyme' }, { name: 'salt and pepper' }]

      it('returns the correct parsed ingredients when it is formatted "Qty Ingredient"', () => {
        const recipe = 'a handful of almonds\na few sprigs of thyme\nsalt and pepper'

        const parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(3)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })

    describe('when the recipe has ingredient groupings', () => {
      const expectedIngredients = [
        { quantity: 100, unit: 'g', name: 'almonds' },
        { quantity: 2, name: 'sprigs of thyme' },
        { quantity: 2, unit: 'cup', name: 'sugar', group: 'glaze' },
        { quantity: 4, unit: 'tbsp', name: 'butter', group: 'glaze' },
        { quantity: 1, name: 'chocolate bar', group: 'decoration' }
      ]

      it('returns the correct parsed ingredients', () => {
        const recipe = '100 g almonds\n2 sprigs of thyme\n# glaze\n2 cups sugar\n4 tbsp butter\n# decoration\n1 chocolate bar'

        const parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(5)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })

    describe('when the recipe has an ingredient with a quantity that cannot be parsed', () => {
      it('throws an exception', () => {
        const recipe = '10 grams butter\n1 gram salt\nhalf gram pepper\n1 3/4 gram flour\n20.5 grams sugar'
        expect(recipesController.parseIngredients.bind(null, recipe)).to.throw('Failed to parse quantity for ingredient: half gram pepper')
      })
    })

    describe('when the recipe has empty lines', () => {
      const expectedIngredients = [
        { quantity: 100, unit: 'g', name: 'almonds' },
        { quantity: 2, name: 'sprigs of thyme' },
        { quantity: 2, unit: 'cup', name: 'sugar', group: 'glaze' },
        { quantity: 4, unit: 'tbsp', name: 'butter', group: 'glaze' },
        { quantity: 1, name: 'chocolate bar', group: 'decoration' }
      ]
      it('does not save empty ingredients', () => {
        const recipe = ' 100 g almonds\n\n2 sprigs of thyme \n\n # glaze \n2 cups sugar \n \n   \n\n4 tbsp butter\n# decoration\n\n1 chocolate bar'

        const parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(5)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })
  })

  describe('processRecipe', () => {
    describe('receives a recipe with ingredients and tags', () => {
      const testRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: '1 onion\n500g minced beef',
        tags: 'dinner, tasty,good, with space '
      }

      const processedRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: [{ quantity: 1, name: 'onion', ingredientMatch: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef', ingredientMatch: 'beef mince' }],
        tags: ['dinner', 'tasty', 'good', 'with space']
      }

      it('returns a processed recipe with tags', () => {
        const recipe = recipesController.processRecipe(testRecipe)
        expect(recipe).to.deep.equal(processedRecipe)
      })
    })

    describe('receives a recipe with ingredients but no tags', () => {
      const testRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: '1 onion\n500g minced beef'
      }

      const processedRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: [{ quantity: 1, name: 'onion', ingredientMatch: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef', ingredientMatch: 'beef mince' }]
      }

      it('returns a processed recipe without tags', () => {
        const recipe = recipesController.processRecipe(testRecipe)
        expect(recipe).to.deep.equal(processedRecipe)
      })
    })
  })
})
