const mongoose = require('mongoose')
const Schema = mongoose.Schema
const parsing = require('../utils/parsing')

const ListItemSchema = new Schema({
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
  recipeId: {
    type: String
  },
  servings: {
    type: Number
  }
})

/* istanbul ignore next */
ListItemSchema.virtual('displayQuantity').get(function () {
  return parsing.parseMetricToNonMetric(this.unit, this.quantity)
})

ListItemSchema.set('toJSON', {
  virtuals: true
})

const ListSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateLastEdited: {
    type: Date
  },
  items: [ListItemSchema]
})

const List = mongoose.model('list', ListSchema)

module.exports = List
