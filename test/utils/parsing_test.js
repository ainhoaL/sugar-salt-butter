const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const parsing = require('../../utils/parsing')

describe('parsing', () => {
  describe('numberToFraction', () => {
    describe('when given an invalid value', () => {
      it('returns the same value back if a string', () => {
        expect(parsing.numberToFraction('test')).to.equal('test')
      })
      it('returns the same value back if undefined', () => {
        expect(parsing.numberToFraction()).to.equal(undefined)
      })
      it('returns the same value back if null', () => {
        expect(parsing.numberToFraction(null)).to.equal(null)
      })
    })
    describe('when given a valid value', () => {
      it('returns same value if not a fraction', () => {
        expect(parsing.numberToFraction(10)).to.equal('10')
      })
      it('returns 1/2 if the value is 0.5', () => {
        expect(parsing.numberToFraction(0.5)).to.equal('1/2')
      })
      it('returns 1/3 if the value is 0.333', () => {
        expect(parsing.numberToFraction(0.333)).to.equal('1/3')
      })
      it('returns 1/4 if the value is 0.25', () => {
        expect(parsing.numberToFraction(0.25)).to.equal('1/4')
      })
      it('returns 2/3 if the value is 0.666', () => {
        expect(parsing.numberToFraction(0.666)).to.equal('2/3')
      })
      it('returns 2/3 if the value is 0.667', () => {
        expect(parsing.numberToFraction(0.667)).to.equal('2/3')
      })
      it('returns 5 1/2 if the value is 5.5', () => {
        expect(parsing.numberToFraction(5.5)).to.equal('5 1/2')
      })
    })
  })

  describe('stringToNumber', () => {
    describe('when the quantity only has one number', () => {
      it('returns 0.25 if quantity is ¼', () => {
        const parsedQty = parsing.stringToNumber('¼')
        expect(parsedQty).to.equal(0.25)
      })
      it('returns 0.5 if quantity is ½', () => {
        const parsedQty = parsing.stringToNumber('½')
        expect(parsedQty).to.equal(0.5)
      })
      it('returns 0.75 if quantity is ¾', () => {
        const parsedQty = parsing.stringToNumber('¾')
        expect(parsedQty).to.equal(0.75)
      })
      it('returns 0.667 if quantity is ⅔', () => {
        const parsedQty = parsing.stringToNumber('⅔')
        expect(parsedQty).to.equal(0.666)
      })
      it('returns 0.333 if quantity is ⅓', () => {
        const parsedQty = parsing.stringToNumber('⅓')
        expect(parsedQty).to.equal(0.333)
      })
      it('returns 0.125 if quantity is ⅛', () => {
        const parsedQty = parsing.stringToNumber('⅛')
        expect(parsedQty).to.equal(0.125)
      })
      it('returns 0.125 if quantity is 1/8', () => {
        const parsedQty = parsing.stringToNumber('1/8')
        expect(parsedQty).to.equal(0.125)
      })
      it('returns 0.25 if quantity is 1/4', () => {
        const parsedQty = parsing.stringToNumber('1/4')
        expect(parsedQty).to.equal(0.25)
      })
      it('returns 0.5 if quantity is 1/2', () => {
        const parsedQty = parsing.stringToNumber('1/2')
        expect(parsedQty).to.equal(0.5)
      })
      it('returns 0.75 if quantity is 3/4', () => {
        const parsedQty = parsing.stringToNumber('3/4')
        expect(parsedQty).to.equal(0.75)
      })
      it('returns 0.667 if quantity is 2/3', () => {
        const parsedQty = parsing.stringToNumber('2/3')
        expect(parsedQty).to.equal(0.667)
      })
      it('returns 0.333 if quantity is 1/3', () => {
        const parsedQty = parsing.stringToNumber('1/3')
        expect(parsedQty).to.equal(0.333)
      })
      it('returns 0.125 if quantity is 1/8', () => {
        const parsedQty = parsing.stringToNumber('1/8')
        expect(parsedQty).to.equal(0.125)
      })
      it('returns 0.23 if quantity is 0.23', () => {
        const parsedQty = parsing.stringToNumber('0.23')
        expect(parsedQty).to.equal(0.23)
      })
      it('returns 5.5 if quantity is 5.5', () => {
        const parsedQty = parsing.stringToNumber('5.5')
        expect(parsedQty).to.equal(5.5)
      })
      it('returns 100 if quantity is 100', () => {
        const parsedQty = parsing.stringToNumber('100')
        expect(parsedQty).to.equal(100)
      })
    })
    describe('when the quantity only has two numbers', () => {
      it('returns 1.25 if quantity is 1 ¼', () => {
        const parsedQty = parsing.stringToNumber('1 ¼')
        expect(parsedQty).to.equal(1.25)
      })
      it('returns 2.5 if quantity is 2½', () => {
        const parsedQty = parsing.stringToNumber('2½')
        expect(parsedQty).to.equal(2.5)
      })
      it('returns 3.75 if quantity is 3 ¾', () => {
        const parsedQty = parsing.stringToNumber('3 ¾')
        expect(parsedQty).to.equal(3.75)
      })
      it('returns 4.667 if quantity is 4⅔', () => {
        const parsedQty = parsing.stringToNumber('4⅔')
        expect(parsedQty).to.equal(4.666)
      })
      it('returns 5.333 if quantity is 5 ⅓', () => {
        const parsedQty = parsing.stringToNumber('5 ⅓')
        expect(parsedQty).to.equal(5.333)
      })
      it('returns 10.125 if quantity is 10⅛', () => {
        const parsedQty = parsing.stringToNumber('10⅛')
        expect(parsedQty).to.equal(10.125)
      })
      it('returns 6.125 if quantity is 6 1/8', () => {
        const parsedQty = parsing.stringToNumber('6 1/8')
        expect(parsedQty).to.equal(6.125)
      })
      it('returns 7.25 if quantity is 7 1/4', () => {
        const parsedQty = parsing.stringToNumber('7 1/4')
        expect(parsedQty).to.equal(7.25)
      })
      it('returns 8.5 if quantity is 8 1/2', () => {
        const parsedQty = parsing.stringToNumber('8 1/2')
        expect(parsedQty).to.equal(8.5)
      })
      it('returns 9.75 if quantity is 9 3/4', () => {
        const parsedQty = parsing.stringToNumber('9 3/4')
        expect(parsedQty).to.equal(9.75)
      })
      it('returns 10.667 if quantity is 10 2/3', () => {
        const parsedQty = parsing.stringToNumber('10 2/3')
        expect(parsedQty).to.equal(10.667)
      })
      it('returns 11.333 if quantity is 11 1/3', () => {
        const parsedQty = parsing.stringToNumber('11 1/3')
        expect(parsedQty).to.equal(11.333)
      })
      it('returns 12.125 if quantity is 12 1/8', () => {
        const parsedQty = parsing.stringToNumber('12 1/8')
        expect(parsedQty).to.equal(12.125)
      })
    })
    describe('when the quantity is not valid', () => {
      it('throws error if quantity is not a number', () => {
        expect(parsing.stringToNumber.bind(null, 'two')).to.throw('Quantity two is not a valid number')
      })
      it('throws error if quantity is a range', () => {
        expect(parsing.stringToNumber.bind(null, '3-4')).to.throw('Quantity is a range, not accepted')
      })
    })
  })

  describe('parseMetricToNonMetric', () => {
    it('changes number to fraction if unit = cups', () => {
      expect(parsing.parseMetricToNonMetric('cup', 0.25)).to.equal('1/4')
    })
    it('changes number to fraction if unit = tbsp', () => {
      expect(parsing.parseMetricToNonMetric('tbsp', 0.5)).to.equal('1/2')
    })
    it('changes number to fraction if unit = tsp', () => {
      expect(parsing.parseMetricToNonMetric('tsp', 0.75)).to.equal('3/4')
    })
    it('dows not change number to fraction if unit = kg', () => {
      expect(parsing.parseMetricToNonMetric('kg', 0.5)).to.equal(0.5)
    })
  })
})
