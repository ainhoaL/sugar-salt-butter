const Recipe = require('../models/recipe')
const List = require('../models/list')

const baseUrl = '/api/v1/'
const baseUrlLists = baseUrl + 'lists/'
module.exports = {

  /**
   * get a recipe from database
   * @param recipeId {string}
   * @param userId {string}
   * @returns {Promise} - Promise to return recipe from database
   */
  getRecipe (recipeId, userId) {
    return Recipe.findOne({ _id: recipeId, userId: userId })
      .then((dbRecipe) => {
        return dbRecipe
      })
  },

  /**
   * Creates an array with the current list items and the ones from a recipe based on the servings of the recipe and the servings to add to list
   * @param listItems {Array} - items currently in the list
   * @param recipeIngredients {Array} - ingredients in a recipe
   * @param recipeId {string}
   * @param recipeServings {number} - number of servings in the original recipe
   * @param servingsToAddToList {number} - number of servings of the recipe to add to the list
   * @returns {Array} - new list of items for the shopping list
   */
  updateListItems (listItems, recipeIngredients, recipeId, recipeServings, servingsToAddToList) {
    const newListItems = [...listItems]
    recipeIngredients.forEach((ingredient) => {
      const newItem = { name: ingredient.name }
      if (ingredient.quantity) {
        if (recipeServings && !isNaN(recipeServings) && servingsToAddToList && !isNaN(servingsToAddToList)) {
          const newQty = ingredient.quantity * servingsToAddToList / recipeServings
          newItem.quantity = parseFloat(newQty.toFixed(2))
          newItem.servings = servingsToAddToList
        } else {
          newItem.quantity = ingredient.quantity
        }
      }
      if (ingredient.unit) {
        newItem.unit = ingredient.unit
      }
      newItem.recipeId = recipeId

      newListItems.push(newItem)
    })
    return newListItems
  },

  /**
   * creates a list object with recipe link
   * @param dbList {Object} - list object
   * @returns {Object} - list object with recipes property and recipes link
   */
  buildListObject (dbList) {
    const recipeBaseUrl = baseUrlLists + dbList._id + '/recipes'
    const listWithLinks = {
      _id: dbList._id,
      userId: dbList.userId,
      title: dbList.title,
      dateCreated: dbList.dateCreated,
      dateLastEdited: dbList.dateLastEdited,
      items: dbList.items,
      recipes: {
        href: recipeBaseUrl
      }
    }

    return listWithLinks
  },

  /**
   * creates an array with all the recipes that are in a shopping list (including title, image, servings and API link)
   * @param listId {string}
   * @param items {Array} - items in the list
   * @param userId {string}
   * @returns {Promise} - array with recipes data
   */
  buildRecipesArray (listId, items, userId) {
    const recipeBaseUrl = baseUrlLists + listId + '/recipes'
    const recipesData = []
    const recipesList = {}
    const recipePromises = []
    items.forEach((item) => {
      if (!recipesList[item.recipeId]) {
        recipesList[item.recipeId] = { recipe: item.recipeId, servings: item.servings }
        const recipePromise = module.exports.getRecipe(item.recipeId, userId)
        recipePromises.push(recipePromise)
      }
    })
    return Promise.all(recipePromises)
      .then((recipes) => {
        recipes.forEach((recipe) => {
          if (recipe) {
            recipesData.push({
              _id: recipe._id,
              title: recipe.title,
              image: recipe.image,
              servings: recipesList[recipe._id].servings,
              href: recipeBaseUrl + '/' + recipe._id
            })
          }
        })
        return recipesData
      })
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
            const listWithLinks = module.exports.buildListObject(dbList)
            if (dbList.items) {
              return module.exports.buildRecipesArray(listWithLinks._id, listWithLinks.items, req.userId)
                .then((recipesData) => {
                  listWithLinks.recipes.recipesData = recipesData
                  res.send(listWithLinks)
                })
                .catch(() => {
                  res.send(listWithLinks) // Send list without recipes
                })
            } else {
              res.send(listWithLinks)
            }
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
   * Create a list using the list model
   * @param req {request object}
   * @param res {response object}
   */
  create (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.body && req.body.title) {
      const newList = {}
      newList.userId = req.userId
      newList.title = req.body.title
      // Create list
      return List.create(newList)
        .then((dbList) => {
          const listWithLinks = module.exports.buildListObject(dbList)
          res.send(listWithLinks)
        })
        .catch((error) => {
          return res.status(500).send(error.message)
        })
    } else {
      res.status(400).send('missing list title')
    }
  },

  /**
   * Delete a list using the list model
   * @param req {request object}
   * @param res {response object}
   */
  deleteList (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id) {
      return List.deleteOne({ _id: req.params.id, userId: req.userId })
        .then((dbList) => {
          return res.sendStatus(204)
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      res.status(400).send('missing list ID')
    }
  },

  /**
   * Get all lists
   * @param req {request object}
   * @param res {response object}
   */
  getAll (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    return List.find({ userId: req.userId })
      .then((dbLists) => {
        const listsWithLinks = []
        dbLists.forEach((dbList) => {
          const listWithLinks = {
            _id: dbList._id,
            title: dbList.title,
            dateCreated: dbList.dateCreated,
            dateLastEdited: dbList.dateLastEdited,
            items: dbList.items,
            recipes: {
              href: baseUrlLists + dbList._id + '/recipes'
            }
          }
          listsWithLinks.push(listWithLinks)
        })

        return res.send(listsWithLinks)
      })
      .catch((error) => {
        return res.status(500).send(error.message)
      })
  },

  /**
   * Delete recipe ingredients from list
   * @param req {request object}
   * @param res {response object}
   */
  deleteRecipeFromList (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id && req.params.recipeId) {
      List.update({ _id: req.params.id, userId: req.userId }, { $pull: { items: { recipeId: req.params.recipeId } } })
        .then((dbList) => {
          return res.sendStatus(204)
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      return res.status(400).send('missing list ID or recipe ID')
    }
  },

  /**
   * Add recipe ingredients to list
   * @param req {request object}
   * @param res {response object}
   */
  addRecipeToList (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id && req.body && req.body.recipeId) {
      const recipeId = req.body.recipeId
      const listServings = req.body.recipeServings
      let recipeIngredients
      let recipeServings
      return module.exports.getRecipe(recipeId, req.userId)
        .then((recipe) => {
          if (!recipe) {
            return res.status(404).send('recipe does not exist')
          }
          recipeIngredients = recipe.ingredients
          recipeServings = recipe.servings
          return List.findOne({ _id: req.params.id, userId: req.userId })
        })
        .then((dbList) => {
          if (!dbList) {
            return res.status(404).send('list does not exist')
          }
          const items = module.exports.updateListItems(dbList.items, recipeIngredients, recipeId, recipeServings, parseInt(listServings))
          dbList.set('items', items)
          // Save list
          return dbList.save()
        })
        .then(() => {
          return res.sendStatus(204)
        })
        .catch((error) => {
          return res.status(500).send(error.message)
        })
    } else {
      res.status(400).send('missing list ID or recipe ID')
    }
  },

  /**
   * Delete one item from list
   * @param req {request object}
   * @param res {response object}
   */
  deleteItemFromList (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id && req.params.itemId) {
      List.update({ _id: req.params.id, userId: req.userId }, { $pull: { items: { _id: req.params.itemId } } })
        .then(() => {
          return res.sendStatus(204)
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      return res.status(400).send('missing list ID or item ID')
    }
  }
}
