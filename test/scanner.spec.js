const should = require('should') // eslint-disable-line
const Scanner = require('../lib/scanner')

describe('sugar-template#Scanner', function() {
    it('should handle empty string correctly!', function() {
        const scanner = new Scanner('')
        scanner.getRawString().should.be.exactly('')
        scanner.eos().should.be.exactly(true)
        scanner.scan(/.*/).should.be.exactly('')
    })
    it('should work correctly!', function() {
        const text = `  FLAG \nHi`
        const scanner = new Scanner(text)
        scanner.getRawString().should.be.exactly(text)
        scanner.eos().should.be.exactly(false)
        scanner.scan(/\s+/).should.be.exactly('  ')
        scanner.scan(/\s+/).should.be.exactly('')
        scanner.scanUntil(/\s+/).should.be.exactly('FLAG')
        scanner.charAt(0).should.be.exactly(' ')
        scanner.scan(/\s/).should.be.exactly(' ')
        scanner.scan(/\s/).should.be.exactly('\n')
        scanner.scan(/\S*/).should.be.exactly('Hi')
        scanner.eos().should.be.exactly(true)
    })
})
