const express = require('express')
const router = express.Router()
const RecipesController = require('./controllers/recipes_controller')
const ListsController = require('./controllers/lists_controller')

router.post('/api/v1/recipes', (req, res) => RecipesController.create(req, res))
// TODO: maybe move on to GraphQL once we need to do more searches and filtering ?
router.get('/api/v1/recipes', (req, res) => RecipesController.getAll(req, res)) // /recipes?sortBy=dateCreated&orderBy=asc

router.get('/api/v1/recipes/:id', (req, res) => RecipesController.get(req, res))
router.put('/api/v1/recipes/:id', (req, res) => RecipesController.update(req, res))

router.post('/api/v1/lists', (req, res) => ListsController.create(req, res))
router.get('/api/v1/lists/:id', (req, res) => ListsController.get(req, res))
router.get('/api/v1/lists', (req, res) => ListsController.getAll(req, res))
router.post('/api/v1/lists/:id/recipes', (req, res) => ListsController.addRecipeToList(req, res))
router.delete('/api/v1/lists/:id/recipes/:recipeId', (req, res) => ListsController.deleteRecipeFromList(req, res))
// router.delete('/api/v1/lists/:id/items/:itemId', (req, res) => ListsController.deleteItemFromList(req, res))

module.exports = router
