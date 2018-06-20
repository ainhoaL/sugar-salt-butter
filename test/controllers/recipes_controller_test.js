const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const mongoose = require('mongoose');

const app = require('../../app');

const Recipe = mongoose.model('recipe');

describe('Recipes controller', () => {

    describe('/api/recipes', () => {
        let recipeCreateStub;
        beforeEach(() => {
            recipeCreateStub = sinon.stub(Recipe, 'create');
        });

        afterEach(() => {
            recipeCreateStub.restore();
        });

        let testRecipe = {
            userId: 'user1',
            title: 'test cake'
        };

        let dbRecipe = {
            _id: 'testId',
            userId: 'user1',
            title: 'test cake'
        };

        it('PUT creates a new recipe', (done) => {
            recipeCreateStub.returns(Promise.resolve(dbRecipe));
            request(app)
                .put('/api/recipes')
                .send(testRecipe)
                .expect(200)
                .end((error, response) => {
                    expect(recipeCreateStub).to.have.been.calledOnce;
                    expect(recipeCreateStub).to.have.been.calledWith(testRecipe);
                    expect(response.body).to.deep.equal(dbRecipe);
                    done();
                });
        });
    });
});