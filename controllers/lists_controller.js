const Recipe = require('../models/recipe')
const List = require('../models/list')

module.exports = {

  /**
   * Create list
   * @param req {request object}
   * @param res {response object}
   */
  create (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.body && req.body.recipeId) {
      // Get recipe
      return module.exports.getRecipeIngredients(req.body.recipeId, req.userId)
        .then((ingredients) => {
          const newList = {}
          newList.userId = req.userId
          newList.items = module.exports.updateListItems([], ingredients)
          newList.title = req.body.title
          // Create list
          return List.create(newList).then(dbList => res.send(dbList))
        })
        .catch((error) => {
          if (error.statusCode === 404) {
            return res.status(404).send('recipe does not exist')
          } else {
            return res.status(500).send(error.message)
          }
        })
    } else {
      return res.status(400).send('missing recipe ID')
    }
  },

  getRecipeIngredients (recipeId, userId) {
    return Recipe.findOne({ _id: recipeId, userId: userId })
      .catch((error) => {
        return Promise.reject(error)
      })
      .then((dbRecipe) => {
        if (dbRecipe) {
          return dbRecipe.ingredients
        } else {
          const notFoundError = new Error('recipe not found')
          notFoundError.statusCode = 404
          return Promise.reject(notFoundError)
        }
      })
  },

  updateListItems (listItems, recipeIngredients) {
    const newListItems = [...listItems]
    recipeIngredients.forEach((ingredient) => {
      const newItem = { name: ingredient.name }
      if (ingredient.quantity) {
        newItem.quantity = ingredient.quantity
      }
      if (ingredient.unit) {
        newItem.unit = ingredient.unit
      }

      newListItems.push(newItem)
    })
    return newListItems
  },

  /**
   * Get a list using the list model
   * @param req {request object}
   * @param res {response object}
   */
  get (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id) {
      return List.findOne({ _id: req.params.id, userId: req.userId })
        .then((dbList) => {
          if (dbList) {
            res.send(dbList)
          } else {
            res.sendStatus(404)
          }
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      res.status(400).send('missing list ID')
    }
  },

  /**
   * Update a list using the list model
   * @param req {request object}
   * @param res {response object}
   */
  update (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.body && req.body.recipeId) {
      let updateOrCreateListPromise
      if (req.body._id) {
        updateOrCreateListPromise = module.exports.updateList(req.body, req.userId)
      } else {
        updateOrCreateListPromise = module.exports.createList(req.body, req.userId)
      }
      updateOrCreateListPromise
        .then((dbList) => {
          res.send(dbList)
        })
        .catch((error) => {
          if (error.statusCode === 404) {
            return res.status(404).send('recipe does not exist')
          } else {
            return res.status(500).send(error.message)
          }
        })
    } else {
      res.status(400).send('missing recipe ID or body')
    }
  },

  createList (list, userId) {
    return module.exports.getRecipeIngredients(list.recipeId, userId)
      .then((ingredients) => {
        const newList = {}
        newList.userId = userId
        newList.items = module.exports.updateListItems([], ingredients)
        newList.title = list.title
        // Create list
        return List.create(newList)
      })
  },

  updateList (list, userId) {
    // Get recipe
    let recipeIngredients
    return module.exports.getRecipeIngredients(list.recipeId, userId)
      .then((ingredients) => {
        recipeIngredients = ingredients
        return List.findOne({ _id: list._id, userId: userId })
      })
      .then((dbList) => {
        if (!dbList) {
          const listNotFoundError = new Error('List not found')
          listNotFoundError.statusCode = 404
          return Promise.reject(listNotFoundError)
        }
        const newList = {}
        const items = module.exports.updateListItems(dbList.items, recipeIngredients)
        newList.items = items
        newList.title = list.title
        // Create list
        return dbList.save(newList)
      })
  }
}
