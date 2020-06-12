const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
  }
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
