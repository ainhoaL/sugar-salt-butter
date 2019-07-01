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
    })

    describe('create', () => {
      let recipeCreateStub

      beforeEach(() => {
        recipeCreateStub = sinon.stub(Recipe, 'create')
      })

      afterEach(() => {
        recipeCreateStub.restore()
      })

      describe('receives a recipe without ingredients', () => {
        let testRecipe = {
          userId: 'user1',
          title: 'test cake'
        }

        it('does not create a recipe in the database', (done) => {
          req.body = testRecipe

          res.on('end', () => {
            expect(recipeCreateStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal({})
            done()
          })

          recipesController.create(req, res)
        })
      })

      describe('receives a recipe with ingredients', () => {
        let testRecipe = {
          userId: 'user1',
          title: 'test cake',
          ingredients: 'fake ingredient'
        }

        let dbRecipe = {
          _id: 'testId',
          userId: 'user1',
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

    describe('find', () => {
      let recipeFindOneStub

      beforeEach(() => {
        recipeFindOneStub = sinon.stub(Recipe, 'findOne')
      })

      afterEach(() => {
        recipeFindOneStub.restore()
      })

      describe('receives a request to find a recipe by url', () => {
        let query = { url: 'http://testrecipe.com/blah', userId: 'me' }

        let dbRecipe = {
          _id: 'testId',
          userId: 'me',
          url: 'http://testrecipe.com/blah',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        it('finds the recipe and returns it', (done) => {
          req.query = query

          recipeFindOneStub.resolves(dbRecipe)

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(1)
            expect(recipeFindOneStub).to.have.been.calledWith(query)
            expect(res._getStatusCode()).to.equal(200)
            expect(res._getData()).to.deep.equal(dbRecipe)
            done()
          })

          recipesController.find(req, res)
        })

        it('does not find the recipe and returns 404', (done) => {
          req.query = query

          recipeFindOneStub.resolves(null)

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(1)
            expect(recipeFindOneStub).to.have.been.calledWith(query)
            expect(res._getStatusCode()).to.equal(404)
            done()
          })

          recipesController.find(req, res)
        })

        context('and the search fails', () => {
          it('returns 500 and the error', (done) => {
            req.query = query

            recipeFindOneStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeFindOneStub.callCount).to.equal(1)
              expect(recipeFindOneStub).to.have.been.calledWith(query)
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.find(req, res)
          })
        })
      })

      describe('receives a request to find a recipe but it has no url', () => {
        it('does not search for the recipe', (done) => {
          req.query = { userId: 'me' }

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(501)
            done()
          })
          recipesController.find(req, res)
        })
      })

      describe('receives a request to find a recipe by url but it has no userId', () => {
        let query = { url: 'http://testrecipe.com/blah' }

        it('does not search for the recipe and returns an empty object', (done) => {
          req.query = query

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(501)
            done()
          })
          recipesController.find(req, res)
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
        let dbRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake',
          ingredients: [{ quantity: null, unit: null, name: 'fake ingredient' }]
        }

        describe('and the recipe exists', () => {
          it('returns the recipe', (done) => {
            req.params = { id: 'testId' }

            recipeFindOneStub.returns(Promise.resolve(dbRecipe))

            res.on('end', () => {
              expect(recipeFindOneStub.callCount).to.equal(1)
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'testId' })
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
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'norecipe' })
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
              expect(recipeFindOneStub).to.have.been.calledWith({ _id: 'testId' })
              expect(res._getStatusCode()).to.equal(500)
              expect(res._getData()).to.equal('Error searching')
              done()
            })

            recipesController.get(req, res)
          })
        })
      })

      describe('receives a request without id', () => {
        it('returns a 400 error', (done) => {
          req.params = { }

          res.on('end', () => {
            expect(recipeFindOneStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe id')
            done()
          })

          recipesController.get(req, res)
        })
      })
    })

    describe('update', () => {
      let recipeFindOneAndReplaceStub

      let testRecipe

      beforeEach(() => {
        recipeFindOneAndReplaceStub = sinon.stub(Recipe, 'findOneAndReplace')

        testRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake',
          ingredients: '2 cups fake ingredient'
        }
      })

      afterEach(() => {
        recipeFindOneAndReplaceStub.restore()
      })

      describe('receives a request with an id and body', () => {
        let dbRecipe = {
          _id: 'testId',
          userId: 'user1',
          title: 'test cake before editing',
          ingredients: [{ quantity: 1, unit: 'cup', name: 'fake ingredient' }]
        }

        describe('and the recipe exists', () => {
          it('updates the recipe', (done) => {
            req.params = { id: 'testId' }
            req.body = testRecipe

            recipeFindOneAndReplaceStub.returns(Promise.resolve(dbRecipe))

            res.on('end', () => {
              expect(recipeFindOneAndReplaceStub.callCount).to.equal(1)
              expect(recipeFindOneAndReplaceStub).to.have.been.calledWith({ _id: 'testId' })
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

            recipeFindOneAndReplaceStub.returns(Promise.resolve(null))

            res.on('end', () => {
              expect(recipeFindOneAndReplaceStub.callCount).to.equal(1)
              expect(recipeFindOneAndReplaceStub).to.have.been.calledWith({ _id: 'norecipe' })
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

            recipeFindOneAndReplaceStub.rejects(new Error('Error searching'))

            res.on('end', () => {
              expect(recipeFindOneAndReplaceStub.callCount).to.equal(1)
              expect(recipeFindOneAndReplaceStub).to.have.been.calledWith({ _id: 'testId' })
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
            expect(recipeFindOneAndReplaceStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe id or body')
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
            expect(recipeFindOneAndReplaceStub.callCount).to.equal(0)
            expect(res._getStatusCode()).to.equal(400)
            expect(res._getData()).to.deep.equal('missing recipe id or body')
            done()
          })

          recipesController.update(req, res)
        })
      })
    })
  })

  describe('parseIngredients', () => {
    describe('when the recipe has only one type of unit:', () => {
      describe('grams', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'g', name: 'butter' }, { quantity: '1', unit: 'g', name: 'salt' }, { quantity: '1/2', unit: 'g', name: 'pepper' }, { quantity: '1 3/4', unit: 'g', name: 'flour' }, { quantity: '20.5', unit: 'g', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty grams Ingredient"', () => {
          let recipe = '10 grams butter\n1 gram salt\n1/2 gram pepper\n1 3/4 gram flour\n20.5 grams sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty g Ingredient"', () => {
          let recipe = '10 g butter\n1 g salt\n1/2 g pepper\n1 3/4 g flour\n20.5 g sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyg Ingredient"', () => {
          let recipe = '10g butter\n1g salt\n1/2g pepper\n1 3/4g flour\n20.5g sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty g. Ingredient"', () => {
          let recipe = '10 g. butter\n1 g. salt\n1/2 g. pepper\n1 3/4 g. flour\n20.5 g. sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyg. Ingredient"', () => {
          let recipe = '10g. butter\n1g. salt\n1/2g. pepper\n1 3/4g. flour\n20.5g. sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty gr Ingredient"', () => {
          let recipe = '10 gr butter\n1 gr salt\n1/2 gr pepper\n1 3/4 gr flour\n20.5 grs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('cups', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'cup', name: 'butter' }, { quantity: '1', unit: 'cup', name: 'salt' }, { quantity: '1/2', unit: 'cup', name: 'pepper' }, { quantity: '1 3/4', unit: 'cup', name: 'flour' }, { quantity: '20.5', unit: 'cup', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty cups Ingredient"', () => {
          let recipe = '10 cups butter\n1 cup salt\n1/2 cup pepper\n1 3/4 cups flour\n20.5 cups sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty c Ingredient"', () => {
          let recipe = '10 c butter\n1 c salt\n1/2 c pepper\n1 3/4 c flour\n20.5 c sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtycups Ingredient"', () => {
          let recipe = '10cups butter\n1cup salt\n1/2cup pepper\n1 3/4cup flour\n20.5cups sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty C Ingredient"', () => {
          let recipe = '10 C butter\n1 C salt\n1/2 C pepper\n1 3/4 C flour\n20.5 C sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyc Ingredient"', () => {
          let recipe = '10c butter\n1c salt\n1/2c pepper\n1 3/4c flour\n20.5c sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('tbsp', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'tbsp', name: 'butter' }, { quantity: '1', unit: 'tbsp', name: 'salt' }, { quantity: '1/2', unit: 'tbsp', name: 'pepper' }, { quantity: '1 3/4', unit: 'tbsp', name: 'flour' }, { quantity: '20.5', unit: 'tbsp', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty tbsp Ingredient"', () => {
          let recipe = '10 tbsps butter\n1 tbsp salt\n1/2 tbsp pepper\n1 3/4 tbsp flour\n20.5 tbsp sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty Tbsp Ingredient"', () => {
          let recipe = '10 Tbsp butter\n1 Tbsp salt\n1/2 Tbsp pepper\n1 3/4 Tbsps flour\n20.5 Tbsps sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtytbsp Ingredient"', () => {
          let recipe = '10tbsps butter\n1tbsp salt\n1/2tbsp pepper\n1 3/4tbsp flour\n20.5tbsp sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty T Ingredient"', () => {
          let recipe = '10 Ts butter\n1 T salt\n1/2 T pepper\n1 3/4 T flour\n20.5 T sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty Tbl Ingredient"', () => {
          let recipe = '10 Tbls butter\n1 Tbl salt\n1/2 Tbl pepper\n1 3/4 Tbl flour\n20.5 Tbl sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty TB Ingredient"', () => {
          let recipe = '10 TBs butter\n1 TB salt\n1/2 TB pepper\n1 3/4 TB flour\n20.5 TBs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty tablespoon Ingredient"', () => {
          let recipe = '10 tablespoons butter\n1 tablespoon salt\n1/2 tablespoon pepper\n1 3/4 tablespoons flour\n20.5 tablespoons sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('tsp', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'tsp', name: 'butter' }, { quantity: '1', unit: 'tsp', name: 'salt' }, { quantity: '1/2', unit: 'tsp', name: 'pepper' }, { quantity: '1 3/4', unit: 'tsp', name: 'flour' }, { quantity: '20.5', unit: 'tsp', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty tsp Ingredient"', () => {
          let recipe = '10 tsps butter\n1 tsp salt\n1/2 tsp pepper\n1 3/4 tsp flour\n20.5 tsps sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtytsp Ingredient"', () => {
          let recipe = '10tsps butter\n1tsp salt\n1/2tsp pepper\n1 3/4tsp flour\n20.5tsp sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty t Ingredient"', () => {
          let recipe = '10 t butter\n1 t salt\n1/2 t pepper\n1 3/4 t flour\n20.5 t sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyt Ingredient"', () => {
          let recipe = '10t butter\n1t salt\n1/2t pepper\n1 3/4t flour\n20.5t sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty teaspoon Ingredient"', () => {
          let recipe = '10 teaspoons butter\n1 teaspoon salt\n1/2 teaspoon pepper\n1 3/4 teaspoons flour\n20.5 teaspoons sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('ml', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'ml', name: 'butter' }, { quantity: '1', unit: 'ml', name: 'salt' }, { quantity: '1/2', unit: 'ml', name: 'pepper' }, { quantity: '1 3/4', unit: 'ml', name: 'flour' }, { quantity: '20.5', unit: 'ml', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty ml Ingredient"', () => {
          let recipe = '10 ml butter\n1 ml salt\n1/2 ml pepper\n1 3/4 ml flour\n20.5 mls sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyml Ingredient"', () => {
          let recipe = '10ml butter\n1ml salt\n1/2ml pepper\n1 3/4mls flour\n20.5mls sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty mL Ingredient"', () => {
          let recipe = '10 mL butter\n1 mL salt\n1/2 mL pepper\n1 3/4mLs flour\n20.5 mLs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty milliliter Ingredient"', () => {
          let recipe = '10 milliliters butter\n1 milliliter salt\n1/2 milliliter pepper\n1 3/4 milliliters flour\n20.5 milliliters sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty mil Ingredient"', () => {
          let recipe = '10 mils butter\n1 mil salt\n1/2 mil pepper\n1 3/4 mil flour\n20.5 mils sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('ounce', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'oz', name: 'butter' }, { quantity: '1', unit: 'oz', name: 'salt' }, { quantity: '1/2', unit: 'oz', name: 'pepper' }, { quantity: '1 3/4', unit: 'oz', name: 'flour' }, { quantity: '20.5', unit: 'oz', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty oz Ingredient"', () => {
          let recipe = '10 oz butter\n1 oz salt\n1/2 oz pepper\n1 3/4 oz flour\n20.5 ozs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyoz Ingredient"', () => {
          let recipe = '10oz butter\n1oz salt\n1/2oz pepper\n1 3/4oz flour\n20.5ozs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty ounce Ingredient"', () => {
          let recipe = '10 ounces butter\n1 ounce salt\n1/2 ounce pepper\n1 3/4 ounces flour\n20.5 ounces sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtyounce Ingredient"', () => {
          let recipe = '10ounces butter\n1ounce salt\n1/2ounce pepper\n1 3/4ounces flour\n20.5ounces sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('liter', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'l', name: 'butter' }, { quantity: '1', unit: 'l', name: 'salt' }, { quantity: '1/2', unit: 'l', name: 'pepper' }, { quantity: '1 3/4', unit: 'l', name: 'flour' }, { quantity: '20.5', unit: 'l', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty l Ingredient"', () => {
          let recipe = '10 l butter\n1 l salt\n1/2 l pepper\n1 3/4 l flour\n20.5 ls sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty L Ingredient"', () => {
          let recipe = '10 Ls butter\n1 L salt\n1/2 L pepper\n1 3/4 L flour\n20.5 Ls sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty liter Ingredient"', () => {
          let recipe = '10 liters butter\n1 liter salt\n1/2 liter pepper\n1 3/4 liters flour\n20.5 liters sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "QtyL Ingredient"', () => {
          let recipe = '10L butter\n1L salt\n1/2L pepper\n1 3/4L flour\n20.5L sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })

      describe('kg', () => {
        let expectedIngredients = [{ quantity: '10', unit: 'kg', name: 'butter' }, { quantity: '1', unit: 'kg', name: 'salt' }, { quantity: '1/2', unit: 'kg', name: 'pepper' }, { quantity: '1 3/4', unit: 'kg', name: 'flour' }, { quantity: '20.5', unit: 'kg', name: 'sugar' }]

        it('returns the correct parsed ingredients when it is formatted "Qty kg Ingredient"', () => {
          let recipe = '10 kgs butter\n1 kg salt\n1/2 kg pepper\n1 3/4 kg flour\n20.5 kgs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qtykg Ingredient"', () => {
          let recipe = '10kgs butter\n1kg salt\n1/2kg pepper\n1 3/4kgs flour\n20.5kgs sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty kilogram Ingredient"', () => {
          let recipe = '10 kilograms butter\n1 kilogram salt\n1/2 kilogram pepper\n1 3/4 kilograms flour\n20.5 kilograms sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })

        it('returns the correct parsed ingredients when it is formatted "Qty kg. Ingredient"', () => {
          let recipe = '10 kg. butter\n1 kg. salt\n1/2 kg. pepper\n1 3/4 kg. flour\n20.5 kg. sugar'

          let parsedIngredients = recipesController.parseIngredients(recipe)
          expect(parsedIngredients.length).to.equal(5)
          expect(parsedIngredients).to.deep.equal(expectedIngredients)
        })
      })
    })

    describe('when the recipe has ingredients without unit', () => {
      let expectedIngredients = [{ quantity: '10', name: 'almonds' }, { quantity: '2', name: 'sprigs of thyme' }]

      it('returns the correct parsed ingredients when it is formatted "Qty Ingredient"', () => {
        let recipe = '10 almonds\n2 sprigs of thyme'

        let parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(2)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })

    describe('when the recipe has ingredients without unit or quantity', () => {
      let expectedIngredients = [{ name: 'a handful of almonds' }, { name: 'a few sprigs of thyme' }, { name: 'salt and pepper' }]

      it('returns the correct parsed ingredients when it is formatted "Qty Ingredient"', () => {
        let recipe = 'a handful of almonds\na few sprigs of thyme\nsalt and pepper'

        let parsedIngredients = recipesController.parseIngredients(recipe)
        expect(parsedIngredients.length).to.equal(3)
        expect(parsedIngredients).to.deep.equal(expectedIngredients)
      })
    })
  })

  describe('processRecipe', () => {
    describe('receives a recipe with ingredients and tags', () => {
      let testRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: '1 onion\n500g minced beef',
        tags: 'dinner tasty'
      }

      let processedRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: [{ quantity: '1', name: 'onion' }, { quantity: '500', unit: 'g', name: 'minced beef' }],
        tags: ['dinner', 'tasty']
      }

      it('returns a processed recipe with tags', () => {
        let recipe = recipesController.processRecipe(testRecipe)
        expect(recipe).to.deep.equal(processedRecipe)
      })
    })

    describe('receives a recipe with ingredients but no tags', () => {
      let testRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: '1 onion\n500g minced beef'
      }

      let processedRecipe = {
        userId: 'user1',
        title: 'beef pie',
        ingredients: [{ quantity: '1', name: 'onion' }, { quantity: '500', unit: 'g', name: 'minced beef' }]
      }

      it('returns a processed recipe without tags', () => {
        let recipe = recipesController.processRecipe(testRecipe)
        expect(recipe).to.deep.equal(processedRecipe)
      })
    })
  })
})
