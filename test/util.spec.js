const should = require('should')
const {
    isFunction,
    isArray,
    isWhitespace,
    isEmpty,
    escapeHtml,
    hasProperty,
    getPrimitiveValue,
    SafeString
} = require('../lib/utils')

describe('sugar-template#utils', function() {
    it('`isArray` should check array correctly!', function() {
        isArray().should.be.exactly(false)
        isArray(null).should.be.exactly(false)
        isArray({ length: 0 }).should.be.exactly(false)
        isArray('').should.be.exactly(false)
        isArray(1).should.be.exactly(false)
        isArray(true).should.be.exactly(false)

        isArray([]).should.be.exactly(true)
        isArray([1, 2, 3]).should.be.exactly(true)
    })
    it('`isFunction` should check function correctly!', function() {
        isFunction().should.be.exactly(false)
        isFunction(null).should.be.exactly(false)
        isFunction({ length: 0 }).should.be.exactly(false)
        isFunction('').should.be.exactly(false)
        isFunction(1).should.be.exactly(false)
        isFunction(true).should.be.exactly(false)

        isFunction(console.log).should.be.exactly(true)
        isFunction(function() {}).should.be.exactly(true)
    })
    it('`isWhitespace` should check white space correctly!', function() {
        isWhitespace().should.be.exactly(false)
        isWhitespace(null).should.be.exactly(false)
        isWhitespace({ length: 0 }).should.be.exactly(false)
        isWhitespace('').should.be.exactly(false)
        isWhitespace(1).should.be.exactly(false)
        isWhitespace(true).should.be.exactly(false)

        isWhitespace(' ').should.be.exactly(true)
        isWhitespace('\n').should.be.exactly(true)
        isWhitespace('\t').should.be.exactly(true)
        isWhitespace('\r').should.be.exactly(true)
    })
    // Determine which value is empty (all falsy value except 0 + empty array)
    it('`isEmpty` should check empty value correctly!', function() {
        isEmpty().should.be.exactly(true)
        isEmpty(null).should.be.exactly(true)
        isEmpty('').should.be.exactly(true)
        isEmpty(false).should.be.exactly(true)
        isEmpty([]).should.be.exactly(true)

        isEmpty(0).should.be.exactly(false)
        isEmpty(true).should.be.exactly(false)
    })
    it('`escapeHtml` should escape html correctly!', function() {
        escapeHtml().should.be.exactly('undefined')
        escapeHtml(null).should.be.exactly('null')
        escapeHtml('').should.be.exactly('')
        escapeHtml(false).should.be.exactly('false')
        escapeHtml([]).should.be.exactly('')
        escapeHtml({}).should.be.exactly('[object Object]')

        escapeHtml('<h1 id="x"></h1>').should.be
            .exactly('&lt;h1 id&#x3D;&quot;x&quot;&gt;&lt;&#x2F;h1&gt;')
        escapeHtml(`id='\`&\`'`).should.be
            .exactly('id&#x3D;&#39;&#x60;&amp;&#x60;&#39;')
        escapeHtml(new SafeString('<h1 id="x"></h1>')).should.be
            .exactly('<h1 id="x"></h1>')
    })
    it('`hasProperty` should check object property correctly!', function() {
        hasProperty(undefined, 'toString').should.be.exactly(false)
        hasProperty(null, 'toString').should.be.exactly(false)
        hasProperty('', 'toString').should.be.exactly(false)
        hasProperty(true, 'toString').should.be.exactly(false)
        hasProperty(0, 'toString').should.be.exactly(false)

        hasProperty({}, 'toString').should.be.exactly(true)
        hasProperty({ x: 0 }, 'x').should.be.exactly(true)
    })
    it('`getPrimitiveValue` should get primitive from string correctly!', function() {
        should(getPrimitiveValue('undefined')).be.exactly()
        should(getPrimitiveValue('null')).be.exactly(null)
        should(getPrimitiveValue('false')).be.exactly(false)
        should(getPrimitiveValue('true')).be.exactly(true)

        getPrimitiveValue('0').should.be.exactly(0)
        getPrimitiveValue('3.14').should.be.exactly(3.14)
        getPrimitiveValue('str').should.be.NaN
    })
})
