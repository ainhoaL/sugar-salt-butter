const express = require('express')
const router = express.Router()
const RecipesController = require('./controllers/recipes_controller')

router.post('/api/v1/recipes', (req, res) => RecipesController.create(req, res))

router.get('/api/v1/recipes/:id', (req, res) => RecipesController.getRecipe(req, res))

module.exports = router
