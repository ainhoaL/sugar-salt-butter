const mongoose = require('mongoose')
const Schema = mongoose.Schema
const parsing = require('../utils/parsing')

const RecipeIngredientSchema = new Schema({
  quantity: {
    type: Number
  },
  unit: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  group: {
    type: String
  }
})

/* istanbul ignore next */
RecipeIngredientSchema.virtual('displayQuantity').get(function () {
  if (this.unit === 'cup' || this.unit === 'tbsp' || this.unit === 'tsp') {
    return parsing.numberToFraction(this.quantity)
  } else {
    return this.quantity
  }
})

RecipeIngredientSchema.set('toJSON', {
  virtuals: true
})

const RecipeSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateLastEdited: {
    type: Date
  },
  url: {
    type: String
  },
  source: {
    type: String
  },
  ingredients: [RecipeIngredientSchema],
  instructions: {
    type: String
  },
  tags: {
    type: [String]
  },
  rating: {
    type: Number
  },
  wantToTry: {
    type: Boolean,
    default: false
  },
  done: {
    type: Boolean,
    default: false
  },
  servings: {
    type: Number
  },
  cookingTime: {
    type: String
  },
  prepTime: {
    type: String
  },
  notes: {
    type: String
  },
  author: {
    type: String
  },
  storage: {
    type: String
  },
  freezable: {
    type: Boolean
  },
  equipment: {
    type: String
  },
  nutrition: {
    type: { carbs: Number, protein: Number, fat: Number, calories: Number }
  }
})

RecipeSchema.index({ title: 'text', 'ingredients.name': 'text', tags: 'text' }, { name: 'My text index', weights: { title: 10, 'ingredients.name': 4, tags: 2 } })
const Recipe = mongoose.model('recipe', RecipeSchema)

module.exports = Recipe
