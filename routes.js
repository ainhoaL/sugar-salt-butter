const express = require('express');
const router = express.Router();
const RecipesController = require('./controllers/recipes_controller');


router.put('/api/v1/recipes', RecipesController.create);

module.exports = router;
