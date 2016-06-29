const fs = require('fs')
const path = require('path')
const should = require('should') // eslint-disable-line
const parseTemplate = require('../lib/parser')
const parseArguments = parseTemplate.parseArguments

describe('sugar-template#parseArguments', function() {
    const defaultRes = {
        hash: {}
    }
    it('should handle empty string, spaces, other invalid values successfully!', function() {
        let res = parseArguments('')
        res.should.deepEqual(defaultRes)

        res = parseArguments('  ')
        res.should.deepEqual(defaultRes)

        res = parseArguments({})
        res.should.deepEqual(defaultRes)

        res = parseArguments(null)
        res.should.deepEqual(defaultRes)

        res = parseArguments(undefined)
        res.should.deepEqual(defaultRes)

        res = parseArguments(false)
        res.should.deepEqual(defaultRes)

        res = parseArguments(true)
        res.should.deepEqual(defaultRes)

        res = parseArguments(0)
        res.should.deepEqual(defaultRes)
    })
    it('should get only context successfully!', function() {
        let res = parseArguments(`context`)
        res.should.deepEqual({
            context: 'context',
            hash: {}
        })

        res = parseArguments(`  context  `)
        res.should.deepEqual({
            context: 'context',
            hash: {}
        })
    })
    it('should get only hash successfully!', function() {
        let res = parseArguments(`key1=true key2=2 key3="" key4=false key5='hi' `)
        res.should.deepEqual({
            hash: {
                key1: true,
                key2: 2,
                key3: '',
                key4: false,
                key5: 'hi'
            }
        })

        // complex string, has "|' inside string value
        res = parseArguments(`key1="=\"" key2='he\'s' key3="a\"\"b'\"c'"`)
        res.should.deepEqual({
            hash: {
                key1: '="',
                key2: 'he\'s',
                key3: `a""b'"c'`
            }
        })

        // cannot handle this kind string: `key="h\" i"`
        // res = parseArguments(`key="h\" i"`) --> will result in error
    })
    it('should parse context and hash successfully!', function() {
        let res = parseArguments(` context id="1" class='nice' isActive=true count=3`)
        res.should.deepEqual({
            context: 'context',
            hash: {
                id: '1',
                class: 'nice',
                isActive: true,
                count: 3
            }
        })
    })
})
