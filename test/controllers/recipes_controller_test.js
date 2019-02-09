const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const mongoose = require('mongoose');
const events = require('events');
const httpMocks = require('node-mocks-http');

const app = require('../../app');
const recipesController = require('../../controllers/recipes_controller');
const Recipe = mongoose.model('recipe');

describe('Recipes controller', () => {

    describe('Handles requests', () => {
        let req, res;
        beforeEach(() => {
            req = httpMocks.createRequest({});
            res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });
        });

        describe('create', () => {
            let testRecipe = {
                userId: 'user1',
                title: 'test cake'
            };

            let dbRecipe = {
                _id: 'testId',
                userId: 'user1',
                title: 'test cake'
            };

            let recipeCreateStub;

            beforeEach(() => {
                recipeCreateStub = sinon.stub(Recipe, 'create');
            });

            afterEach(() => {
                recipeCreateStub.restore();
            });

            it('creates a new recipe', () => {
                req.body = testRecipe;

                recipeCreateStub.returns(Promise.resolve(dbRecipe));

                recipesController.create(req, res);
                expect(recipeCreateStub).to.have.been.calledOnce;
                expect(recipeCreateStub).to.have.been.calledWith(testRecipe);

                res.on('end', () => {
                    expect(res._getStatusCode()).to.equal(200);
                    expect(res._getData()).to.deep.equal(dbRecipe);
                    done();
                })
            });
        });
    });
});