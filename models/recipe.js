const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RecipeIngredientSchema = new Schema({
  quantity: {
    type: String // TODO: this should be a Number eventually
  },
  unit: {
    type: String
  },
  name: {
    type: String,
    required: true
  }
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
  freezes: {
    type: Boolean
  },
  equipment: {
    type: String
  },
  macros: {
    type: { carbs: Number, protein: Number, fat: Number, calories: Number }
  }
})

RecipeSchema.index({title: 'text', 'ingredients.name': 'text', tags: 'text'}, {name: 'My text index', weights: {title: 10, 'ingredients.name': 4, tags: 2}})
const Recipe = mongoose.model('recipe', RecipeSchema)

module.exports = Recipe
