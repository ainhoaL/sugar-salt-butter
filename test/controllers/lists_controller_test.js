const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const mongoose = require('mongoose')
const events = require('events')
const httpMocks = require('node-mocks-http')

const listsController = require('../../controllers/lists_controller')
const Recipe = mongoose.model('recipe')
const List = mongoose.model('list')

describe('Lists controller', () => {
  describe('Handles requests', () => {
    let req, res
    beforeEach(() => {
      req = httpMocks.createRequest({})
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter })

      // set defaults
      req.userId = 'testUserId'
    })

    describe('create', () => {
      let getRecipeIngredientsStub
      let listCreateStub

      beforeEach(() => {
        getRecipeIngredientsStub = sinon.stub(listsController, 'getRecipeIngredients')
        listCreateStub = sinon.stub(List, 'create')
      })

      afterEach(() => {
        getRecipeIngredientsStub.restore()
        listCreateStub.restore()
      })

      describe('receives a request without some parameters', () => {
        const testList = {
          title: 'test shopping list'
        }

        it('does not create a list in the database if request has no recipeId', (done) => {
          req.body = testList

          res.on('end', () => {
            expect(getRecipeIngredientsStub.callCount).to.equal(0)
            expect(listCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID')
            done()
          })

          listsController.create(req, res)
        })

        it('returns an error if request has no userId', (done) => {
          req.body = testList
          req.userId = null

          res.on('end', () => {
            expect(getRecipeIngredientsStub.callCount).to.equal(0)
            expect(listCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.create(req, res)
        })
      })

      describe('receives a valid request', () => {
        const testList = {
          title: 'test shopping list',
          recipeId: 'testRecipeId'
        }

        describe('getRecipeIngredients fails', () => {
          it('returns a 404 error if getRecipeIngredients does not find a recipe', (done) => {
            req.body = testList
            const notFoundError = new Error('no recipe')
            notFoundError.statusCode = 404

            getRecipeIngredientsStub.rejects(notFoundError)

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listCreateStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(404)
              expect(res._getData()).to.deep.equal('recipe does not exist')
              done()
            })

            listsController.create(req, res)
          })

          it('returns an error if getRecipeIngredients fails', (done) => {
            req.body = testList

            getRecipeIngredientsStub.rejects(new Error('failed to get recipe'))

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listCreateStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.deep.equal('failed to get recipe')
              done()
            })

            listsController.create(req, res)
          })
        })

        describe('getRecipeIngredients succeeds', () => {
          const expectedList = {
            userId: 'testUserId',
            title: 'test shopping list',
            items: [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }]
          }

          const dbList = {
            _id: 'testListId',
            userId: 'testUserId',
            title: 'test shopping list',
            items: [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }]
          }

          it('returns an error if it fails to create list', (done) => {
            req.body = testList

            getRecipeIngredientsStub.resolves([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }])
            listCreateStub.rejects(new Error('failed to create list'))

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listCreateStub.callCount).to.equal(1)
              expect(listCreateStub).to.have.been.calledWith(expectedList)
              expect(res._getStatusCode()).to.equal(500)
              done()
            })

            listsController.create(req, res)
          })

          it('creates a new list', (done) => {
            req.body = testList

            getRecipeIngredientsStub.resolves([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }])
            listCreateStub.resolves(dbList)

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listCreateStub.callCount).to.equal(1)
              expect(listCreateStub).to.have.been.calledWith(expectedList)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(dbList)
              done()
            })

            listsController.create(req, res)
          })
        })
      })
    })

    describe('get', () => {
      let listFindOneStub

      beforeEach(() => {
        listFindOneStub = sinon.stub(List, 'findOne')
      })

      afterEach(() => {
        listFindOneStub.restore()
      })

      describe('receives a request with an id', () => {
        const dbList = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test shopping list',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        describe('and the list exists', () => {
          it('returns the list', (done) => {
            req.params = { id: 'testId' }

            listFindOneStub.returns(Promise.resolve(dbList))

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(dbList)
              done()
            })

            listsController.get(req, res)
          })
        })

        describe('but the recipe does not exist', () => {
          it('returns a 404 error', (done) => {
            req.params = { id: 'nolist' }

            listFindOneStub.returns(Promise.resolve(null))

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'nolist', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(404)
              done()
            })

            listsController.get(req, res)
          })
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            req.params = { id: 'testId' }

            listFindOneStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            listsController.get(req, res)
          })
        })
      })

      describe('receives a request without list id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }

          res.on('end', () => {
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID')
            done()
          })

          listsController.get(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }
          req.userId = null

          res.on('end', () => {
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.get(req, res)
        })
      })
    })

    describe('update', () => {
      let getRecipeIngredientsStub
      let listFindOneStub

      let testList
      let testListSaveStub

      beforeEach(() => {
        getRecipeIngredientsStub = sinon.stub(listsController, 'getRecipeIngredients')
        listFindOneStub = sinon.stub(List, 'findOne')
        testListSaveStub = sinon.stub()

        testList = {
          title: 'new test shopping list title',
          recipeId: 'testRecipeId'
        }
        req.params = { id: 'testListId' }
      })

      afterEach(() => {
        getRecipeIngredientsStub.restore()
        listFindOneStub.restore()
      })

      describe('receives a request without some parameters', () => {
        it('does not update the list in the database if request has no recipeId', (done) => {
          req.body = {
            title: 'test shopping list'
          }

          res.on('end', () => {
            expect(getRecipeIngredientsStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID or body')
            done()
          })

          listsController.update(req, res)
        })

        it('returns an error if request has no userId', (done) => {
          req.body = {
            title: 'test shopping list',
            recipeId: 'testRecipeId'
          }
          req.userId = null

          res.on('end', () => {
            expect(getRecipeIngredientsStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.update(req, res)
        })

        it('returns an error if request has no list id', (done) => {
          req.body = {
            title: 'test shopping list',
            recipeId: 'testRecipeId'
          }
          req.params = {}

          res.on('end', () => {
            expect(getRecipeIngredientsStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe ID or body')
            done()
          })

          listsController.update(req, res)
        })
      })

      describe('receives a valid request', () => {
        describe('getRecipeIngredients fails', () => {
          it('returns a 404 error if getRecipeIngredients does not find a recipe', (done) => {
            req.body = testList
            const notFoundError = new Error('no recipe')
            notFoundError.statusCode = 404

            getRecipeIngredientsStub.rejects(notFoundError)

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(404)
              expect(res._getData()).to.deep.equal('recipe does not exist')
              done()
            })

            listsController.update(req, res)
          })

          it('returns an error if getRecipeIngredients fails', (done) => {
            req.body = testList

            getRecipeIngredientsStub.rejects(new Error('failed to get recipe'))

            res.on('end', () => {
              expect(getRecipeIngredientsStub.callCount).to.equal(1)
              expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.deep.equal('failed to get recipe')
              done()
            })

            listsController.update(req, res)
          })
        })

        describe('getRecipeIngredients succeeds', () => {
          beforeEach(() => {
            getRecipeIngredientsStub.resolves([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }])
          })

          describe('find List fails', () => {
            it('returns a 404 error if it does not find a list that matches the id', (done) => {
              req.body = testList

              listFindOneStub.resolves(null)

              res.on('end', () => {
                expect(getRecipeIngredientsStub.callCount).to.equal(1)
                expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
                expect(listFindOneStub.callCount).to.equal(1)
                expect(listFindOneStub).to.have.been.calledWith({ _id: 'testListId', userId: 'testUserId' })
                expect(testListSaveStub.callCount).to.equal(0)
                expect(res._getStatusCode()).to.equal(404)
                done()
              })

              listsController.update(req, res)
            })

            it('returns an error if find list fails', (done) => {
              req.body = testList

              listFindOneStub.rejects(new Error('failed to get list'))

              res.on('end', () => {
                expect(getRecipeIngredientsStub.callCount).to.equal(1)
                expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
                expect(listFindOneStub.callCount).to.equal(1)
                expect(listFindOneStub).to.have.been.calledWith({ _id: 'testListId', userId: 'testUserId' })
                expect(testListSaveStub.callCount).to.equal(0)
                expect(res._getStatusCode()).to.equal(500)
                expect(res._getData()).to.deep.equal('failed to get list')
                done()
              })

              listsController.update(req, res)
            })
          })

          describe('find List succeeds', () => {
            const expectedList = {
              title: 'new test shopping list title',
              items: [{ quantity: 1, name: 'garlic clove' }, { quantity: 30, unit: 'g', name: 'flour' }, { name: 'rosemary' }, { quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }]
            }

            let dbList
            beforeEach(() => {
              dbList = {
                _id: 'testListId',
                userId: 'testUserId',
                title: 'test shopping list',
                items: [{ quantity: 1, name: 'garlic clove' }, { quantity: 30, unit: 'g', name: 'flour' }, { name: 'rosemary' }],
                save: testListSaveStub
              }
              listFindOneStub.resolves(dbList)
            })

            it('returns an error if it fails to update list', (done) => {
              req.body = testList

              testListSaveStub.rejects(new Error('failed to update list'))

              res.on('end', () => {
                expect(getRecipeIngredientsStub.callCount).to.equal(1)
                expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
                expect(listFindOneStub.callCount).to.equal(1)
                expect(listFindOneStub).to.have.been.calledWith({ _id: 'testListId', userId: 'testUserId' })
                expect(testListSaveStub.callCount).to.equal(1)
                expect(testListSaveStub).to.have.been.calledWith(expectedList)
                expect(res._getStatusCode()).to.equal(500)
                done()
              })

              listsController.update(req, res)
            })

            it('creates a new list', (done) => {
              req.body = testList

              testListSaveStub.resolves(dbList)

              res.on('end', () => {
                expect(getRecipeIngredientsStub.callCount).to.equal(1)
                expect(getRecipeIngredientsStub).to.have.been.calledWith('testRecipeId', 'testUserId')
                expect(listFindOneStub.callCount).to.equal(1)
                expect(listFindOneStub).to.have.been.calledWith({ _id: 'testListId', userId: 'testUserId' })
                expect(testListSaveStub.callCount).to.equal(1)
                expect(testListSaveStub).to.have.been.calledWith(expectedList)
                expect(res._getStatusCode()).to.equal(204)
                done()
              })

              listsController.update(req, res)
            })
          })
        })
      })
    })
  })

  describe('updateListItems', () => {
    describe('receives an empty list of items and a list of ingredients', () => {
      const listItems = []

      const recipeIngredients = [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef', group: 'filling' }, { name: 'pinch of salt' }]

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients)
        expect(newItems).to.deep.equal([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }])
      })
    })

    describe('receives a list of items and an empty list of ingredients', () => {
      const listItems = [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }]

      const recipeIngredients = []

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients)
        expect(newItems).to.deep.equal(listItems)
      })
    })

    describe('receives a list of items and an empty list of ingredients', () => {
      const listItems = [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }]

      const recipeIngredients = [{ quantity: 1, name: 'potato' }, { quantity: 200, unit: 'g', name: 'minced pork', group: 'filling' }, { name: 'pinch of salt' }]

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients)
        expect(newItems).to.deep.equal([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { quantity: 1, name: 'potato' }, { quantity: 200, unit: 'g', name: 'minced pork' }, { name: 'pinch of salt' }])
      })
    })
  })

  describe('getRecipeIngredients', () => {
    let recipeFindOneStub

    beforeEach(() => {
      recipeFindOneStub = sinon.stub(Recipe, 'findOne')
    })

    afterEach(() => {
      recipeFindOneStub.restore()
    })

    describe('when there is a recipe that matches the recipeId', () => {
      const dbRecipe = {
        _id: 'testId',
        userId: 'user1',
        title: 'test cake',
        ingredients: [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }]
      }
      it('returns the recipe ingredients', () => {
        recipeFindOneStub.resolves(dbRecipe)
        return expect(listsController.getRecipeIngredients('fakeRecipeId')).to.not.be.rejected
          .then((ingredients) => {
            expect(ingredients).to.deep.equal([{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef' }, { name: 'pinch of salt' }])
          })
      })
    })

    describe('when there is no recipe that matches the recipeId', () => {
      it('returns a rejected promise', () => {
        recipeFindOneStub.resolves(null)
        return expect(listsController.getRecipeIngredients('fakeRecipeId')).to.be.rejected
          .then((error) => {
            expect(error.statusCode).to.equal(404)
            expect(error.message).to.equal('recipe not found')
          })
      })
    })

    describe('when finding the recipe fails', () => {
      it('returns a rejected promise', () => {
        recipeFindOneStub.rejects(new Error('Error searching'))
        return expect(listsController.getRecipeIngredients('fakeRecipeId')).to.be.rejected
          .then((error) => {
            expect(error.message).to.equal('Error searching')
          })
      })
    })
  })
})
