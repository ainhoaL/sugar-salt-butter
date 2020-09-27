const Recipe = require('../models/recipe')
const parsing = require('../utils/parsing')

module.exports = {

  /**
   * Create recipe using the recipe model
   * @param req {request object}
   * @param res {response object}
   */
  create (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.body && req.body.ingredients) {
      let recipe = req.body
      recipe = module.exports.processRecipe(recipe)
      recipe.userId = req.userId

      // TODO: for now assuming that the request is in the same format as the recipe model
      return Recipe.create(recipe).then(dbRecipe => res.send(dbRecipe))
    } else {
      return res.send({}) // TODO: error?
    }
  },

  /**
   * Get an array of recipes
   * accepts query parameters:
   * - recipe property (title, url, ...) value: performs search by property specified (title=cake)
   * - searchString: performs text search in title, ingredients and tags (searchString=chocolate)
   * - sortBy: sorts search results by this property, dateCreated by default (sortBy=title)
   * - orderBy: orders search results in this order, descending by default (orderBy=asc)
   * - limit: number of recipes to return, 40 by default (limit=10)
   * - skip: number of search results to skip, to handle pagination, 0 by default (skip=20)
   * @param req {request object}
   * @param res {response object}
   */
  getAll (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.query) {
      const limit = req.query.limit ? parseInt(req.query.limit) : 40
      const skip = req.query.skip ? parseInt(req.query.skip) : 0
      const sortBy = req.query.sortBy || 'dateCreated'
      const orderBy = req.query.orderBy || 'desc'
      const sortObj = {}
      sortObj[sortBy] = orderBy
      const filterObj = { userId: req.userId }
      Object.keys(req.query).forEach((key) => {
        if ((key !== 'limit') && (key !== 'skip') && (key !== 'sortBy') && (key !== 'orderBy') && (key !== 'searchString')) {
          filterObj[key] = req.query[key]
        }
      })
      let score
      const results = { count: 0, recipes: [] }

      if (req.query.searchString) { // Search to find any recipes matching query elements
        const searchWords = req.query.searchString.split(' ')
        let searchString = '"' + searchWords[0]
        let i = 1
        while (i < searchWords.length) {
          searchString += '" "' + searchWords[i]
          i++
        }
        searchString += '"'
        filterObj.$text = { $search: searchString }
        const textScore = { $meta: 'textScore' }
        score = { score: textScore }
        sortObj.score = textScore
      }

      return Recipe.find(filterObj, score).countDocuments()
        .then(count => {
          results.count = count
          if (count && count > 0) {
            return Recipe.find(filterObj, score).sort(sortObj).limit(limit).skip(skip)
              .then(dbRecipes => {
                results.recipes = results.recipes.concat(dbRecipes)
                return res.send(results)
              })
          } else {
            return res.send(results)
          }
        })
        .catch(error => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      return res.sendStatus(400)
    }
  },

  /**
   * Get a recipe using the recipe model
   * @param req {request object}
   * @param res {response object}
   */
  get (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id) {
      return Recipe.findOne({ _id: req.params.id })
        .then(dbRecipe => {
          if (dbRecipe) {
            res.send(dbRecipe)
          } else {
            res.sendStatus(404)
          }
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      res.status(400).send('missing recipe ID')
    }
  },

  /**
   * Update a recipe using the recipe model
   * @param req {request object}
   * @param res {response object}
   */
  update (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.params.id && req.body) {
      let recipe = req.body
      recipe = module.exports.processRecipe(recipe)
      recipe.userId = req.userId

      return Recipe.replaceOne({ _id: req.params.id }, recipe)
        .then(dbRecipe => {
          if (dbRecipe) {
            return res.sendStatus(204)
          } else {
            return res.sendStatus(404)
          }
        })
        .catch((error) => {
          return res.status(500).send(error.message) // TODO: change for custom error message
        })
    } else {
      res.status(400).send('missing recipe ID or body')
    }
  },

  /**
   * Get list of tags and the number of recipes they appear in
   * @param req {request object}
   * @param res {response object}
   */
  getTags (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    return Recipe.aggregate([{ $match: { userId: req.userId } }, { $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }]) // TODO: get tags per user!!!!
      .then(tags => {
        return res.status(200).send(tags)
      })
      .catch(error => {
        return res.status(500).send(error.message) // TODO: change for custom error message
      })
  },

  /**
   * Given a multiline string with a list of ingredients it returns a standardized array of ingredients
   * It standardizes the ingredients units so all ingredients are always stored with same units for easier conversion later on
   * It also groups ingredients by sections. A group name starts with #. Any ingredient after it will belong to that group
   * @param ingredientsText {string} - a multiline string with 1 ingredient per line
   * @returns {Array} - array of ingredient objects { quantity (string), unit (string), name (string) }
   */
  parseIngredients (ingredientsText) {
    // separate each ingredient in quantity, unit and name.
    // To find the unit type, using an array of possible units regexes to look for in the ingredients
    // TODO: add cm to units
    const units = [
      { name: 'cup', regex: /cup[s]?/ },
      { name: 'cup', regex: /([0-9]|[\xbc\xbd\xbe])+\s?[cC][s]?[.]?\s/, findUnitRegex: /[cC][s]?[.]?\s/ },
      { name: 'kg', regex: /[Kk]g[s]?[.]?\s/ },
      { name: 'kg', regex: /kilogram[s]?/ },
      { name: 'kg', regex: /kilo[s]?/ },
      { name: 'g', regex: /([0-9]|[\xbc\xbd\xbe])+\s?g[r]?[s]?[.]?\s/, findUnitRegex: /g[r]?[s]?[.]?\s/ },
      { name: 'g', regex: /gram[s]?/ },
      { name: 'ml', regex: /m[Ll][s]?[.]?/ },
      { name: 'ml', regex: /milliliter[s]?/ },
      { name: 'ml', regex: /mil[s]?[.]?\s/ },
      { name: 'oz', regex: /([0-9]|[\xbc\xbd\xbe])+\s?oz[s]?[.]?\s/, findUnitRegex: /oz[s]?[.]?\s/ },
      { name: 'oz', regex: /ounce[s]?[.]?/ },
      { name: 'lb', regex: /[Ll]b[s]?[.]?\s/ },
      { name: 'lb', regex: /pound[s]?/ },
      { name: 'l', regex: /([0-9]|[\xbc\xbd\xbe])+\s?[Ll][s]?[.]?\s/, findUnitRegex: /[Ll][s]?[.]?\s/ },
      { name: 'l', regex: /liter[s]?/ },
      { name: 'tsp', regex: /tsp[s]?[.]?/ },
      { name: 'tsp', regex: /teaspoon[s]?/ },
      { name: 'tsp', regex: /([0-9]|[\xbc\xbd\xbe])+\s?t[s]?\s/, findUnitRegex: /t[s]?\s/ },
      { name: 'tbsp', regex: /[Tt]bsp[s]?[.]?/ },
      { name: 'tbsp', regex: /([0-9]|[\xbc\xbd\xbe])+\s?T[B]?[s]?[.]?\s/, findUnitRegex: /T[B]?[s]?[.]?\s/ },
      { name: 'tbsp', regex: /[Tt]bl?[s]?[.]?\s/ },
      { name: 'tbsp', regex: /tablespoon[s]*[.]*/ }]

    const formattedIngredients = []
    const ingredientsArray = ingredientsText.split(/\r?\n/) // Split by lines
    let ingredientGroup
    ingredientsArray.forEach((ingredient) => {
      ingredient = ingredient.trim()
      if (ingredient.indexOf('#') > -1) {
        const ingredientHeader = ingredient.split('#')
        ingredientGroup = ingredientHeader[1].trim()
      } else if (ingredient) {
        let unitCount = 0
        let found = false

        ingredient = ingredient.trim() // Get rid of any spaces before/after ingredient
        while (!found && unitCount < units.length) {
          found = units[unitCount].regex.test(ingredient)
          unitCount++
        }
        let ingredientObject
        if (found) { // This ingredient matches one of the unit regexes
          const unitEntry = units[unitCount - 1]
          const regexForUnit = unitEntry.findUnitRegex || unitEntry.regex

          const regexResults = regexForUnit.exec(ingredient)
          const startIndex = regexResults.index
          const matchString = regexResults[0]

          const quantity = ingredient.substr(0, startIndex).trim()
          const name = ingredient.substr(startIndex + matchString.length, ingredient.length - 1).trim()
          const unit = unitEntry.name

          let numberQuantity
          try {
            numberQuantity = parsing.stringToNumber(quantity)
          } catch (error) {
            throw new Error('Failed to parse quantity for ingredient: ' + ingredient)
          }

          ingredientObject = { quantity: numberQuantity, unit, name }
        } else { // It does not match any of the unit regex
          // If there is no unit, then this ingredient has the shape <Quantity Name> or just <Name>
          const firstSeparation = ingredient.indexOf(' ')
          const quantity = ingredient.substr(0, firstSeparation).trim() // TODO: handle "1 1/2 name"
          let name = ingredient.substr(firstSeparation + 1, ingredient.length - 1).trim()

          let numberQuantity
          try {
            numberQuantity = parsing.stringToNumber(quantity)
            ingredientObject = { quantity: numberQuantity, name }
          } catch (error) {
            console.log('Failed to parse quantity for ingredient: ' + ingredient + ' - it probably does not have a quantity? - storing without quantity')
            name = ingredient
            ingredientObject = { name }
          }
        }
        if (ingredientGroup) {
          ingredientObject.group = ingredientGroup
        }
        formattedIngredients.push(ingredientObject)
      }
    })
    return formattedIngredients
  },

  processRecipe (recipe) {
    const ingredients = module.exports.parseIngredients(recipe.ingredients)
    recipe.ingredients = ingredients

    if (recipe.tags) {
      const tags = recipe.tags.split(',')
      recipe.tags = tags.map(s => s.trim())
    }

    return recipe
  }
}
