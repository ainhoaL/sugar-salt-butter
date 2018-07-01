const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const RecipeIngredientSchema = new Schema({
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String
    },
    name: {
        type: String,
        required: true
    }
});

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
        type: {carbs: Number, protein: Number, fat: Number, calories: Number }
    }
});

const Recipe = mongoose.model('recipe', RecipeSchema);

module.exports = Recipe;