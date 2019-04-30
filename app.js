const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const routes = require('./routes')
const app = express()

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/ssbrecipes')

app.use(cors())
app.use(bodyParser.json())
app.use(routes)

module.exports = app
