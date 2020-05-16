const Recipe = require('../models/recipe')
const math = require('mathjs')

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
   * Find recipes
   * @param req {request object}
   * @param res {response object}
   */
  find (req, res) {
    if (!req.userId) {
      return res.sendStatus(401) // Not authorized
    }
    if (req.query) {
      if (req.query.url) { // Search to find a single recipe by url
        return Recipe.findOne({ url: req.query.url, userId: req.userId })
          .then(dbRecipe => {
            if (dbRecipe) {
              return res.send({ count: 1, recipes: [dbRecipe] })
            } else {
              return res.sendStatus(404)
            }
          })
          .catch((error) => {
            return res.status(500).send(error.message) // TODO: change for custom error message
          })
      } else if (req.query.searchString) { // Search to find any recipes matching query elements
        const searchWords = req.query.searchString.split(' ')
        let searchString = '"' + searchWords[0]
        let i = 1
        while (i < searchWords.length) {
          searchString += '" "' + searchWords[i]
          i++
        }
        searchString += '"'
        const skip = req.query.skip ? parseInt(req.query.skip) : 0
        const results = { count: 0, recipes: [] }
        return Recipe.find({ $text: { $search: searchString }, userId: req.userId }, { score: { $meta: 'textScore' } }).countDocuments()
          .then(count => {
            results.count = count
            if (count > 0) {
              return Recipe.find({ $text: { $search: searchString }, userId: req.userId }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(40).skip(skip)
            } else {
              return res.send(results)
            }
          })
          .then(dbRecipes => {
            results.recipes = dbRecipes
            return res.send(results)
          })
          .catch(error => {
            return res.status(500).send(error.message) // TODO: change for custom error message
          })
      } else {
        res.sendStatus(501)
      }
    } else {
      return res.sendStatus(501)
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
   * Given a multiline string with a list of ingredients it returns a standardized array of ingredients
   * It standardizes the ingredients units so all ingredients are always stored with same units for easier conversion later on
   * @param ingredientsText {string} - a multiline string with 1 ingredient per line
   * @returns {Array} - array of ingredient objects { quantity (string), unit (string), name (string) }
   */
  parseIngredients (ingredientsText) {
    // separate each ingredient in quantity, unit and name.
    // To find the unit type, using an array of possible units regexes to look for in the ingredients
    // TODO: add pound (lb) to units to look for / add cm to units / balsamic vinegar gets parsed into c (cups) vinegar ?? large cloves garlic also into c (cups)
    const units = [
      { name: 'cup', regex: /cup[s]?/ },
      { name: 'cup', regex: /[cC][s]?[.]?\s/ },
      { name: 'tsp', regex: /tsp[s]?[.]?/ },
      { name: 'tsp', regex: /teaspoon[s]?/ },
      { name: 'tsp', regex: /([0-9]|[\xbc\xbd\xbe])+\s?t[s]?\s/, findUnitRegex: /t[s]?\s/ },
      { name: 'tbsp', regex: /[Tt]bsp[s]?[.]?/ },
      { name: 'tbsp', regex: /([0-9]|[\xbc\xbd\xbe])+\s?T[B]?[s]?[.]?\s/, findUnitRegex: /T[B]?[s]?[.]?\s/ },
      { name: 'tbsp', regex: /[Tt]bl?[s]?[.]?\s/ },
      { name: 'tbsp', regex: /tablespoon[s]*[.]*/ },
      { name: 'kg', regex: /[Kk]g[s]?[.]?\s/ },
      { name: 'kg', regex: /kilogram[s]?/ },
      { name: 'kg', regex: /kilo[s]?/ },
      { name: 'g', regex: /([0-9]|[\xbc\xbd\xbe])+\s?g[r]?[s]?[.]?\s/, findUnitRegex: /g[r]?[s]?[.]?\s/ },
      { name: 'g', regex: /gram[s]?/ },
      { name: 'ml', regex: /m[Ll][s]?[.]?/ },
      { name: 'ml', regex: /milliliter[s]?/ },
      { name: 'ml', regex: /mil[s]?[.]?/ },
      { name: 'oz', regex: /oz[s]?[.]?/ },
      { name: 'oz', regex: /ounce[s]?[.]?/ },
      { name: 'l', regex: /([0-9]|[\xbc\xbd\xbe])+\s?[Ll][s]?[.]?\s/, findUnitRegex: /[Ll][s]?[.]?\s/ },
      { name: 'l', regex: /liter[s]?/ }]

    const formattedIngredients = []
    const ingredientsArray = ingredientsText.split(/\r?\n/) // Split by lines
    let ingredientGroup
    ingredientsArray.forEach((ingredient) => {
      if (ingredient.indexOf('#') > -1) {
        const ingredientHeader = ingredient.split('#')
        ingredientGroup = ingredientHeader[1].trim()
      } else if (ingredient) {
        let unitCount = 0
        let found = false

        while (!found && unitCount < units.length) {
          found = units[unitCount].regex.test(ingredient)
          unitCount++
        }
        let ingredientObject
        if (found) { // This ingredient matches one of the unit regexes
          const unitEntry = units[unitCount - 1]
          const regexForUnit = unitEntry.findUnitRegex || unitEntry.regex

          const splitArray = ingredient.split(regexForUnit)
          const quantity = splitArray[0].trim()

          let numberQuantity
          try {
            numberQuantity = module.exports.parseQuantity(quantity)
          } catch (error) {
            console.log(error)
            throw new Error('Failed to parse quantity for ingredient: ' + ingredient)
          }

          const unit = unitEntry.name
          const name = splitArray[1].trim()
          ingredientObject = { quantity: numberQuantity, unit, name }
        } else { // It does not match any of the unit regex
          // If there is no unit, then this ingredient has the shape <Quantity Name> or just <Name>
          const firstSeparation = ingredient.indexOf(' ')
          const quantity = ingredient.substr(0, firstSeparation).trim() // TODO: handle "1 1/2 name"
          let name = ingredient.substr(firstSeparation + 1, ingredient.length - 1).trim()

          let numberQuantity
          try {
            numberQuantity = module.exports.parseQuantity(quantity)
            ingredientObject = { quantity: numberQuantity, name }
          } catch (error) {
            console.log(error)
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

  /**
   * Parses a string ingredient quantity into a number quantity
   * @param currentQty {string} - current ingredient quantity
   * @returns {number} - ingredient quantity parsed to a number (up to 3 decimals)
   */
  parseQuantity (currentQty) {
    let newQty
    let index
    let firstNumber
    let secondNumber = 0
    if (currentQty.indexOf('½') > -1) {
      index = currentQty.indexOf('½')
      secondNumber = 0.5
    } else if (currentQty.indexOf('¼') > -1) {
      index = currentQty.indexOf('¼')
      secondNumber = 0.25
    } else if (currentQty.indexOf('¾') > -1) {
      index = currentQty.indexOf('¾')
      secondNumber = 0.75
    } else if (currentQty.indexOf('⅔') > -1) {
      index = currentQty.indexOf('⅔')
      secondNumber = 0.666
    } else if (currentQty.indexOf('⅓') > -1) {
      index = currentQty.indexOf('⅓')
      secondNumber = 0.333
    } else if (currentQty.indexOf('⅛') > -1) {
      index = currentQty.indexOf('⅛')
      secondNumber = 0.125
    }

    if (index > -1) {
      firstNumber = index > 0 ? parseFloat(currentQty.substr(0, index).trim()) : 0
      newQty = firstNumber + secondNumber
    } else if (currentQty.indexOf('-') > -1 || currentQty.indexOf('–') > -1) {
      throw new Error('Quantity is a range, not accepted')
    } else {
      try {
        newQty = math.round(math.number(math.fraction(currentQty)) * 1000) / 1000
      } catch (error) {
        throw new Error('Quantity ' + currentQty + ' is not a valid number')
      }
    }

    if (isNaN(newQty)) {
      throw new Error('NAN ----- Quantity ' + currentQty + ' is not a valid number')
    }

    return newQty
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
