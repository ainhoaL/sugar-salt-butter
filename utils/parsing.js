const math = require('mathjs')

module.exports = {

  /**
     * transform a number into a readable fraction as a string
     * @param value - number
     * @returns {string} - fraction
     */
  numberToFraction (value) {
    if (!value || isNaN(parseFloat(value))) {
      return value
    }
    // This is a whole number and doesn't need modification.
    if (parseFloat(value) === parseInt(value)) {
      return value.toString()
    }
    // Next 12 lines are cribbed from https://stackoverflow.com/a/23575406.
    const gcd = (a, b) => {
      if (b < 0.0000001) {
        return a
      }
      return gcd(b, Math.floor(a % b))
    }
    var len = value.toString().length - 2
    var denominator = Math.pow(10, len)
    var numerator = value * denominator
    var divisor = gcd(numerator, denominator)
    numerator /= divisor
    denominator /= divisor
    var base = 0
    // In a scenario like 3/2, convert to 1 1/2
    // by pulling out the base number and reducing the numerator.
    if (numerator > denominator) {
      base = Math.floor(numerator / denominator)
      numerator -= base * denominator
    }
    value = Math.floor(numerator) + '/' + Math.floor(denominator)
    if (value === '333/1000') value = '1/3'
    if (value === '333/500') value = '2/3'
    if (base) {
      value = base + ' ' + value
    }
    return value
  },

  /**
   * Parses a string quantity into a number quantity
   * @param value {string} - string quantity
   * @returns {number} - quantity parsed to a number (up to 3 decimals)
   */
  stringToNumber (value) {
    let newQty
    let index
    let firstNumber
    let secondNumber = 0
    if (value.indexOf('½') > -1) {
      index = value.indexOf('½')
      secondNumber = 0.5
    } else if (value.indexOf('¼') > -1) {
      index = value.indexOf('¼')
      secondNumber = 0.25
    } else if (value.indexOf('¾') > -1) {
      index = value.indexOf('¾')
      secondNumber = 0.75
    } else if (value.indexOf('⅔') > -1) {
      index = value.indexOf('⅔')
      secondNumber = 0.666
    } else if (value.indexOf('⅓') > -1) {
      index = value.indexOf('⅓')
      secondNumber = 0.333
    } else if (value.indexOf('⅛') > -1) {
      index = value.indexOf('⅛')
      secondNumber = 0.125
    }

    if (index > -1) {
      firstNumber = index > 0 ? parseFloat(value.substr(0, index).trim()) : 0
      newQty = firstNumber + secondNumber
    } else if (value.indexOf('-') > -1 || value.indexOf('–') > -1) {
      throw new Error('Quantity is a range, not accepted')
    } else {
      try {
        newQty = math.round(math.number(math.fraction(value)) * 1000) / 1000
      } catch (error) {
        throw new Error('Quantity ' + value + ' is not a valid number')
      }
    }

    // if (isNaN(newQty)) {
    //   throw new Error('NAN ----- Quantity ' + value + ' is not a valid number')
    // }

    return newQty
  },

  parseMetricToNonMetric (unit, quantity) {
    if (unit === 'cup' || unit === 'tbsp' || unit === 'tsp') {
      return module.exports.numberToFraction(quantity)
    } else {
      return quantity
    }
  }

}
