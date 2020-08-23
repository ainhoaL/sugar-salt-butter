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

    describe('get', () => {
      let listFindOneStub
      let buildRecipesArrayStub

      beforeEach(() => {
        listFindOneStub = sinon.stub(List, 'findOne')
        buildRecipesArrayStub = sinon.stub(listsController, 'buildRecipesArray')
      })

      afterEach(() => {
        listFindOneStub.restore()
        buildRecipesArrayStub.restore()
      })

      describe('receives a request with an id', () => {
        const dbList = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test shopping list',
          dateCreated: '12/4/20',
          dateLastEdited: '13/06/20',
          items: [
            { quantity: 2, unit: null, name: 'fake ingredient', recipeId: 'recipe1', servings: 1 },
            { quantity: 2, unit: 'cup', name: 'fake ingredient2', recipeId: 'recipe2', servings: 2 }
          ]
        }

        describe('and the list exists', () => {
          it('returns the list with recipes', (done) => {
            const expectedList = {
              _id: 'testId',
              userId: 'testUserId',
              title: 'test shopping list',
              dateCreated: '12/4/20',
              dateLastEdited: '13/06/20',
              items: [
                { quantity: 2, unit: null, name: 'fake ingredient', recipeId: 'recipe1', servings: 1 },
                { quantity: 2, unit: 'cup', name: 'fake ingredient2', recipeId: 'recipe2', servings: 2 }
              ],
              recipes: {
                href: '/api/v1/lists/testId/recipes',
                recipesData: [
                  {
                    _id: 'recipe1',
                    title: 'first recipe',
                    image: '/img.png',
                    servings: 1,
                    href: 'lists/testId/recipes/recipe1'
                  },
                  {
                    _id: 'recipe2',
                    title: 'second recipe',
                    image: '/recipe.jpeg',
                    servings: 2,
                    href: 'lists/testId/recipes/recipe2'
                  }
                ]
              }
            }

            const recipesArray = [
              {
                _id: 'recipe1',
                title: 'first recipe',
                image: '/img.png',
                servings: 1,
                href: 'lists/testId/recipes/recipe1'
              },
              {
                _id: 'recipe2',
                title: 'second recipe',
                image: '/recipe.jpeg',
                servings: 2,
                href: 'lists/testId/recipes/recipe2'
              }
            ]

            req.params = { id: 'testId' }

            listFindOneStub.resolves(dbList)
            buildRecipesArrayStub.resolves(recipesArray)

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(expectedList)
              done()
            })

            listsController.get(req, res)
          })

          it('returns list without recipes if getting recipes fails', (done) => {
            const expectedList2 = {
              _id: 'testId',
              userId: 'testUserId',
              title: 'test shopping list',
              dateCreated: '12/4/20',
              dateLastEdited: '13/06/20',
              items: [
                { quantity: 2, unit: null, name: 'fake ingredient', recipeId: 'recipe1', servings: 1 },
                { quantity: 2, unit: 'cup', name: 'fake ingredient2', recipeId: 'recipe2', servings: 2 }
              ],
              recipes: {
                href: '/api/v1/lists/testId/recipes'
              }
            }

            req.params = { id: 'testId' }

            listFindOneStub.resolves(dbList)
            buildRecipesArrayStub.rejects(new Error('failed to get recipes'))

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(expectedList2)
              done()
            })

            listsController.get(req, res)
          })

          it('returns the list if it has no items', (done) => {
            const dbListNoItems = {
              _id: 'testId',
              userId: 'testUserId',
              title: 'test shopping list',
              dateCreated: '12/4/20',
              dateLastEdited: '13/06/20'
            }

            const expectedList = {
              _id: 'testId',
              userId: 'testUserId',
              title: 'test shopping list',
              dateCreated: '12/4/20',
              dateLastEdited: '13/06/20',
              items: undefined,
              recipes: {
                href: '/api/v1/lists/testId/recipes'
              }
            }

            req.params = { id: 'testId' }

            listFindOneStub.resolves(dbListNoItems)

            res.on('end', () => {
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(buildRecipesArrayStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(200)
              expect(res._getData()).to.deep.equal(expectedList)
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

    describe('create', () => {
      let listCreateStub
      const testList = { title: 'test list' }

      beforeEach(() => {
        listCreateStub = sinon.stub(List, 'create')
      })

      afterEach(() => {
        listCreateStub.restore()
      })

      describe('receives a valid request', () => {
        const dbList = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test shopping list',
          dateCreated: '12/04',
          dateLastEdited: '12/08',
          items: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        const listWithLinks = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test shopping list',
          dateCreated: '12/04',
          dateLastEdited: '12/08',
          items: [{ quantity: null, unit: null, name: 'fake ingredient' }],
          recipes: {
            href: '/api/v1/lists/testId/recipes'
          }
        }

        it('creates a new list', (done) => {
          req.body = testList

          listCreateStub.resolves(dbList)

          res.on('end', () => {
            expect(listCreateStub.callCount).to.equal(1)
            expect(listCreateStub).to.have.been.calledWith({ title: 'test list', userId: 'testUserId' })
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal(listWithLinks)
            done()
          })

          listsController.create(req, res)
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            req.body = testList

            listCreateStub.rejects(new Error('Error creating'))

            res.on('end', () => {
              expect(listCreateStub.callCount).to.equal(1)
              expect(listCreateStub).to.have.been.calledWith({ title: 'test list', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error creating')
              done()
            })

            listsController.create(req, res)
          })
        })
      })

      describe('receives a request without a body', () => {
        it('returns a 400 error', (done) => {
          req.body = null

          res.on('end', () => {
            expect(listCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list title')
            done()
          })

          listsController.create(req, res)
        })
      })

      describe('receives a request without a title', () => {
        it('returns a 400 error', (done) => {
          req.body = { name: 'test' }

          res.on('end', () => {
            expect(listCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list title')
            done()
          })

          listsController.create(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.body = testList
          req.userId = null

          res.on('end', () => {
            expect(listCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.create(req, res)
        })
      })
    })

    describe('getAll', () => {
      let listFindStub

      beforeEach(() => {
        listFindStub = sinon.stub(List, 'find')
      })

      afterEach(() => {
        listFindStub.restore()
      })

      describe('receives a valid request', () => {
        const dbLists = [{
          _id: 'list1',
          userId: 'testUserId',
          title: 'test shopping list',
          dateCreated: '12/04',
          dateLastEdited: '12/08',
          items: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        },
        {
          _id: 'list2',
          userId: 'testUserId',
          title: 'test list',
          dateCreated: '08/04',
          dateLastEdited: '01/08',
          items: [{ quantity: 2, unit: 'cup', name: 'fake ingredient' }]
        }]

        const listsWithLinks = [{
          _id: 'list1',
          title: 'test shopping list',
          dateCreated: '12/04',
          dateLastEdited: '12/08',
          items: [{ quantity: null, unit: null, name: 'fake ingredient' }],
          recipes: {
            href: '/api/v1/lists/list1/recipes'
          }
        }, {
          _id: 'list2',
          title: 'test list',
          dateCreated: '08/04',
          dateLastEdited: '01/08',
          items: [{ quantity: 2, unit: 'cup', name: 'fake ingredient' }],
          recipes: {
            href: '/api/v1/lists/list2/recipes'
          }
        }]

        it('returns all lists for user', (done) => {
          listFindStub.resolves(dbLists)

          res.on('end', () => {
            expect(listFindStub.callCount).to.equal(1)
            expect(listFindStub).to.have.been.calledWith({ userId: 'testUserId' })
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal(listsWithLinks)
            done()
          })

          listsController.getAll(req, res)
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            listFindStub.rejects(new Error('Error finding'))

            res.on('end', () => {
              expect(listFindStub.callCount).to.equal(1)
              expect(listFindStub).to.have.been.calledWith({ userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error finding')
              done()
            })

            listsController.getAll(req, res)
          })
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.userId = null

          res.on('end', () => {
            expect(listFindStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.getAll(req, res)
        })
      })
    })

    describe('deleteRecipeFromList', () => {
      let listUpdateStub

      beforeEach(() => {
        listUpdateStub = sinon.stub(List, 'update')
      })

      afterEach(() => {
        listUpdateStub.restore()
      })

      describe('receives a valid request', () => {
        const dbList = {
          _id: 'testId',
          userId: 'testUserId',
          title: 'test shopping list',
          dateCreated: '12/04',
          dateLastEdited: '12/08',
          items: [
            { quantity: 2, unit: 'cup', name: 'fake ingredient', recipeId: 'recipe2' }
          ]
        }

        it('deletes recipe from list', (done) => {
          listUpdateStub.resolves(dbList)

          res.on('end', () => {
            expect(listUpdateStub.callCount).to.equal(1)
            expect(listUpdateStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' }, { $pull: { items: { recipeId: { $in: ['recipe1'] } } } })
            expect(res._getStatusCode()).to.equal(204)
            done()
          })

          req.params = { id: 'testId', recipeId: 'recipe1' }

          listsController.deleteRecipeFromList(req, res)
        })

        context('and the call to db fails', () => {
          it('returns 500 and the error', (done) => {
            listUpdateStub.rejects(new Error('Error deleting'))

            res.on('end', () => {
              expect(listUpdateStub.callCount).to.equal(1)
              expect(listUpdateStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' }, { $pull: { items: { recipeId: { $in: ['recipe1'] } } } })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error deleting')
              done()
            })

            req.params = { id: 'testId', recipeId: 'recipe1' }

            listsController.deleteRecipeFromList(req, res)
          })
        })
      })

      describe('receives a request without a list id', () => {
        it('returns a 400 error', (done) => {
          res.on('end', () => {
            expect(listUpdateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID or recipe ID')
            done()
          })

          req.params = { recipeId: 'recipe1' }

          listsController.deleteRecipeFromList(req, res)
        })
      })

      describe('receives a request without a list id', () => {
        it('returns a 400 error', (done) => {
          res.on('end', () => {
            expect(listUpdateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID or recipe ID')
            done()
          })

          req.params = { id: 'testId' }

          listsController.deleteRecipeFromList(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.userId = null

          res.on('end', () => {
            expect(listUpdateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.deleteRecipeFromList(req, res)
        })
      })
    })

    describe('addRecipeToList', () => {
      let listFindOneStub
      let getRecipeStub
      let setItemsStub
      let saveListStub

      beforeEach(() => {
        listFindOneStub = sinon.stub(List, 'findOne')
        getRecipeStub = sinon.stub(listsController, 'getRecipe')
        setItemsStub = sinon.stub()
        saveListStub = sinon.stub()
      })

      afterEach(() => {
        listFindOneStub.restore()
        getRecipeStub.restore()
      })

      describe('receives a valid request', () => {
        const recipe = {
          _id: 'recipe1',
          servings: 4,
          ingredients: [
            { quantity: 4, unit: 'tbsp', name: 'fake ingredient2' }
          ]
        }
        let dbList

        beforeEach(() => {
          dbList = {
            _id: 'testId',
            userId: 'testUserId',
            title: 'test shopping list',
            dateCreated: '12/04',
            dateLastEdited: '12/08',
            items: [
              { quantity: 2, unit: 'cup', name: 'fake ingredient', recipeId: 'recipe2' }
            ],
            set: setItemsStub,
            save: saveListStub
          }
        })

        it('adds recipe to list', (done) => {
          listFindOneStub.resolves(dbList)
          getRecipeStub.resolves(recipe)

          res.on('end', () => {
            expect(getRecipeStub.callCount).to.equal(1)
            expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
            expect(listFindOneStub.callCount).to.equal(1)
            expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
            expect(setItemsStub).to.have.been.calledWith('items', [
              { quantity: 2, unit: 'cup', name: 'fake ingredient', recipeId: 'recipe2' },
              { quantity: 2, unit: 'tbsp', name: 'fake ingredient2', recipeId: 'recipe1', servings: 2 }
            ])
            expect(saveListStub.callCount).to.equal(1)
            expect(res._getStatusCode()).to.equal(204)
            done()
          })

          req.body = { recipeId: 'recipe1', recipeServings: 2 }
          req.params = { id: 'testId' }

          listsController.addRecipeToList(req, res)
        })

        context('and the call to get recipe fails', () => {
          it('returns 500 and the error', (done) => {
            getRecipeStub.rejects(new Error('Error getting recipe'))

            res.on('end', () => {
              expect(getRecipeStub.callCount).to.equal(1)
              expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error getting recipe')
              done()
            })

            req.body = { recipeId: 'recipe1', recipeServings: 2 }
            req.params = { id: 'testId' }

            listsController.addRecipeToList(req, res)
          })
        })

        context('and the call to find list fails', () => {
          it('returns 500 and the error', (done) => {
            listFindOneStub.rejects(new Error('Error finding list'))
            getRecipeStub.resolves(recipe)

            res.on('end', () => {
              expect(getRecipeStub.callCount).to.equal(1)
              expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error finding list')
              done()
            })

            req.body = { recipeId: 'recipe1', recipeServings: 2 }
            req.params = { id: 'testId' }

            listsController.addRecipeToList(req, res)
          })
        })

        context('and the call to save list fails', () => {
          it('returns 500 and the error', (done) => {
            saveListStub.rejects(new Error('Error saving list'))
            getRecipeStub.resolves(recipe)
            listFindOneStub.resolves(dbList)

            res.on('end', () => {
              expect(getRecipeStub.callCount).to.equal(1)
              expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(setItemsStub).to.have.been.calledWith('items', [
                { quantity: 2, unit: 'cup', name: 'fake ingredient', recipeId: 'recipe2' },
                { quantity: 2, unit: 'tbsp', name: 'fake ingredient2', recipeId: 'recipe1', servings: 2 }
              ])
              expect(saveListStub.callCount).to.equal(1)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error saving list')
              done()
            })

            req.body = { recipeId: 'recipe1', recipeServings: 2 }
            req.params = { id: 'testId' }

            listsController.addRecipeToList(req, res)
          })
        })

        context('and the list does not exist', () => {
          it('returns 404 and the error', (done) => {
            listFindOneStub.resolves(null)
            getRecipeStub.resolves(recipe)

            res.on('end', () => {
              expect(getRecipeStub.callCount).to.equal(1)
              expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(1)
              expect(listFindOneStub).to.have.been.calledWith({ _id: 'testId', userId: 'testUserId' })
              expect(res._getStatusCode()).to.equal(404)
              expect(res._getData()).to.equal('list does not exist')
              done()
            })

            req.body = { recipeId: 'recipe1', recipeServings: 2 }
            req.params = { id: 'testId' }

            listsController.addRecipeToList(req, res)
          })
        })

        context('and the recipe does not exist', () => {
          it('returns 404 and the error', (done) => {
            getRecipeStub.resolves(null)

            res.on('end', () => {
              expect(getRecipeStub.callCount).to.equal(1)
              expect(getRecipeStub).to.have.been.calledWith('recipe1', 'testUserId')
              expect(listFindOneStub.callCount).to.equal(0)
              expect(res._getStatusCode()).to.equal(404)
              expect(res._getData()).to.equal('recipe does not exist')
              done()
            })

            req.body = { recipeId: 'recipe1', recipeServings: 2 }
            req.params = { id: 'testId' }

            listsController.addRecipeToList(req, res)
          })
        })
      })

      describe('receives a request without a list id', () => {
        it('returns a 400 error', (done) => {
          res.on('end', () => {
            expect(getRecipeStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID or recipe ID')
            done()
          })

          req.body = { recipeId: 'recipe1', recipeServings: 2 }

          listsController.addRecipeToList(req, res)
        })
      })

      describe('receives a request without a recipe id', () => {
        it('returns a 400 error', (done) => {
          res.on('end', () => {
            expect(getRecipeStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID or recipe ID')
            done()
          })

          req.body = { recipeServings: 2 }
          req.params = { id: 'testId' }

          listsController.addRecipeToList(req, res)
        })
      })

      describe('receives a request without a body', () => {
        it('returns a 400 error', (done) => {
          res.on('end', () => {
            expect(getRecipeStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing list ID or recipe ID')
            done()
          })

          req.body = { }
          req.params = { id: 'testId' }

          listsController.addRecipeToList(req, res)
        })
      })

      describe('receives a request without userId id', () => {
        it('returns a 400 error', (done) => {
          req.userId = null

          res.on('end', () => {
            expect(getRecipeStub.callCount).to.equal(0)
            expect(listFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(401)
            done()
          })

          listsController.addRecipeToList(req, res)
        })
      })
    })
  })

  describe('updateListItems', () => {
    const testRecipeId = 'testRecipeId'
    describe('receives an empty list of items and a list of ingredients', () => {
      const listItems = []

      const recipeIngredients = [{ quantity: 1, name: 'onion' }, { quantity: 500, unit: 'g', name: 'minced beef', group: 'filling' }, { name: 'pinch of salt' }]

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients, testRecipeId)
        expect(newItems).to.deep.equal([{ quantity: 1, name: 'onion', recipeId: 'testRecipeId' }, { quantity: 500, unit: 'g', name: 'minced beef', recipeId: 'testRecipeId' }, { name: 'pinch of salt', recipeId: 'testRecipeId' }])
      })
    })

    describe('receives a list of items and an empty list of ingredients', () => {
      const listItems = [{ quantity: 1, name: 'onion', recipeId: 'testRecipeId2' }, { quantity: 500, unit: 'g', name: 'minced beef', recipeId: 'testRecipeId2' }, { name: 'pinch of salt', recipeId: 'testRecipeId2' }]

      const recipeIngredients = []

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients, testRecipeId)
        expect(newItems).to.deep.equal(listItems)
      })
    })

    describe('receives a list of items and an empty list of ingredients', () => {
      const listItems = [{ quantity: 1, name: 'onion', recipeId: 'testRecipeId2' }, { quantity: 500, unit: 'g', name: 'minced beef', recipeId: 'testRecipeId2' }]

      const recipeIngredients = [{ quantity: 1, name: 'potato' }, { quantity: 200, unit: 'g', name: 'minced pork', group: 'filling' }, { name: 'pinch of salt' }]

      it('returns an array of items that combines the list items and the recipe ingredients', () => {
        const newItems = listsController.updateListItems(listItems, recipeIngredients, testRecipeId)
        expect(newItems).to.deep.equal([{ quantity: 1, name: 'onion', recipeId: 'testRecipeId2' }, { quantity: 500, unit: 'g', name: 'minced beef', recipeId: 'testRecipeId2' }, { quantity: 1, name: 'potato', recipeId: 'testRecipeId' }, { quantity: 200, unit: 'g', name: 'minced pork', recipeId: 'testRecipeId' }, { name: 'pinch of salt', recipeId: 'testRecipeId' }])
      })
    })
  })

  describe('getRecipe', () => {
    let recipeFindOneStub
    beforeEach(() => {
      recipeFindOneStub = sinon.stub(Recipe, 'findOne')
    })
    afterEach(() => {
      recipeFindOneStub.restore()
    })
    it('returns recipe when call to db succeeds', () => {
      const recipe = {
        _id: 'recipe1',
        servings: 4,
        ingredients: [
          { quantity: 4, unit: 'tbsp', name: 'fake ingredient2' }
        ]
      }
      recipeFindOneStub.resolves(recipe)
      expect(listsController.getRecipe('recipe1', 'user1')).to.not.be.rejected
        .then((dbRecipe) => {
          expect(dbRecipe).to.deep.equal(recipe)
        })
    })

    it('returns a rejected promise when call to db fails', () => {
      recipeFindOneStub.rejects(new Error('failed to get recipe'))
      expect(listsController.getRecipe('recipe1', 'user1')).to.be.rejectedWith('failed to get recipe')
    })
  })

  describe('buildListObject', () => {
    it('returns a list object with a recipes link', () => {
      const dbList = {
        _id: 'list1',
        userId: 'user1',
        title: 'shopping list',
        dateCreated: '12/04',
        dateLastEdited: '12/05',
        items: [
          { quantity: 2, name: 'fake ingredient 1', recipeId: 'recipe1', servings: 2 },
          { quantity: 14.5, unit: 'tbsp', name: 'fake ingredient 2', recipeId: 'recipe2', servings: 12 },
          { name: 'fake ingredient 3', recipeId: 'recipe3', servings: 4 }
        ]
      }

      const expectedList = {
        _id: 'list1',
        userId: 'user1',
        title: 'shopping list',
        dateCreated: '12/04',
        dateLastEdited: '12/05',
        items: [
          { quantity: 2, name: 'fake ingredient 1', recipeId: 'recipe1', servings: 2 },
          { quantity: 14.5, unit: 'tbsp', name: 'fake ingredient 2', recipeId: 'recipe2', servings: 12 },
          { name: 'fake ingredient 3', recipeId: 'recipe3', servings: 4 }
        ],
        recipes: {
          href: '/api/v1/lists/list1/recipes'
        }
      }

      expect(listsController.buildListObject(dbList)).to.deep.equal(expectedList)
    })
  })

  describe('buildRecipesArray', () => {
    const items = [
      { quantity: 2, name: 'fake ingredient 1', recipeId: 'recipe1', servings: 2 },
      { quantity: 14.5, unit: 'tbsp', name: 'fake ingredient 2', recipeId: 'recipe2', servings: 12 },
      { name: 'fake ingredient 3', recipeId: 'recipe3', servings: 4 },
      { quantity: 2, unit: 'tbsp', name: 'fake ingredient 2', recipeId: 'recipe2', servings: 2 }
    ]
    const expectedRecipes = [
      { _id: 'recipe1', title: 'recipe 1', servings: 2, image: '/img1.png', href: '/api/v1/lists/list1/recipes/recipe1' },
      { _id: 'recipe2', title: 'recipe 2', servings: 12, image: '/img2.png', href: '/api/v1/lists/list1/recipes/recipe2' },
      { _id: 'recipe3', title: 'recipe 3', servings: 4, image: '/img3.png', href: '/api/v1/lists/list1/recipes/recipe3' }
    ]

    let getRecipeStub
    beforeEach(() => {
      getRecipeStub = sinon.stub(listsController, 'getRecipe')
    })
    afterEach(() => {
      getRecipeStub.restore()
    })

    it('returns an array of recipes', () => {
      getRecipeStub.withArgs('recipe1', 'user1').resolves({
        _id: 'recipe1',
        title: 'recipe 1',
        image: '/img1.png',
        servings: 4,
        ingredients: [
          { quantity: 4, unit: 'tbsp', name: 'fake ingredient2' }
        ]
      })

      getRecipeStub.withArgs('recipe2', 'user1').resolves({
        _id: 'recipe2',
        title: 'recipe 2',
        image: '/img2.png',
        servings: 4,
        ingredients: []
      })

      getRecipeStub.withArgs('recipe3', 'user1').resolves({
        _id: 'recipe3',
        title: 'recipe 3',
        image: '/img3.png',
        servings: 2,
        ingredients: [
          { name: 'fake ingredient2' }
        ]
      })

      expect(listsController.buildRecipesArray('list1', items, 'user1')).to.not.be.rejected
        .then((recipesArray) => {
          expect(recipesArray).to.deep.equal(expectedRecipes)
        })
    })

    it('returns an array of recipes even if one of them is missing', () => {
      getRecipeStub.withArgs('recipe1', 'user1').resolves({
        _id: 'recipe1',
        title: 'recipe 1',
        image: '/img1.png',
        servings: 4,
        ingredients: [
          { quantity: 4, unit: 'tbsp', name: 'fake ingredient2' }
        ]
      })

      getRecipeStub.withArgs('recipe2', 'user1').resolves({
        _id: 'recipe2',
        title: 'recipe 2',
        image: '/img2.png',
        servings: 4,
        ingredients: []
      })

      getRecipeStub.withArgs('recipe3', 'user1').resolves(null)

      expect(listsController.buildRecipesArray('list1', items, 'user1')).to.not.be.rejected
        .then((recipesArray) => {
          expect(recipesArray).to.deep.equal([
            { _id: 'recipe1', title: 'recipe 1', servings: 2, image: '/img1.png', href: '/api/v1/lists/list1/recipes/recipe1' },
            { _id: 'recipe2', title: 'recipe 2', servings: 12, image: '/img2.png', href: '/api/v1/lists/list1/recipes/recipe2' }
          ])
        })
    })

    it('returns error if it fails to get any recipe', () => {
      getRecipeStub.withArgs('recipe1', 'user1').resolves({
        _id: 'recipe1',
        title: 'recipe 1',
        image: '/img1.png',
        servings: 4,
        ingredients: [
          { quantity: 4, unit: 'tbsp', name: 'fake ingredient2' }
        ]
      })

      getRecipeStub.withArgs('recipe2', 'user1').rejects(new Error('failed to get recipe2'))

      getRecipeStub.withArgs('recipe3', 'user1').resolves({
        _id: 'recipe3',
        title: 'recipe 3',
        image: '/img3.png',
        servings: 2,
        ingredients: [
          { name: 'fake ingredient2' }
        ]
      })

      expect(listsController.buildRecipesArray('list1', items, 'user1')).to.be.rejectedWith('failed to get recipe2')
    })
  })
})
