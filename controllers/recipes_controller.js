const Recipe = require('../models/recipe');

module.exports = {

    /**
     * Create recipe using the recipe model
     */
    create(req, res) {
        // TODO: for now assuming that the request is in the same format as the recipe model
        Recipe.create(req.body).then(recipe => res.send(recipe));
    }
}