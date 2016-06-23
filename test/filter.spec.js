const fs = require('fs')
const path = require('path')
const should = require('should') // eslint-disable-line
const sugar = require('../')

describe('sugar-template#filter', function() {
    it('should parse `uppercase` filter and generate code successfully!', function() {
        let text = sugar.render(`{{title | uppercase}}`, { title: 'test' })
        text.should.be.exactly('TEST')

        // should not work with non-string data default
        text = sugar.render(`{{ok | uppercase}}`, { ok: false })
        text.should.be.exactly('false')

        // should work with non-string data if set `force` to true
        text = sugar.render(`{{ok | uppercase force=true}}`, { ok: false })
        text.should.be.exactly('FALSE')
    })
    it('should parse `lowercase` filter and generate code successfully!', function() {
        const data = { title: 'TEST' }
        let text = sugar.render(`{{title | lowercase}}`, data)
        text.should.be.exactly('test')

        // should not work with non-string data default
        text = sugar.render(`{{. | lowercase}}`, data)
        text.should.be.exactly('[object Object]')

        // should work with non-string data if set `force` to true
        text = sugar.render(`{{. | lowercase force=true}}`, data)
        text.should.be.exactly('[object object]')
    })
    it('should parse `capitalize` filter and generate code successfully!', function() {
        const data = { title: 'test' }
        data.toString = function() {
            return 'toString'
        }
        let text = sugar.render(`{{title | capitalize}}`, data)
        text.should.be.exactly('Test')

        // should not work with non-string data default
        text = sugar.render(`{{. | capitalize}}`, data)
        text.should.be.exactly('toString')

        // should work with non-string data if set `force` to true
        text = sugar.render(`{{. | capitalize force=true}}`, data)
        text.should.be.exactly('ToString')
    })
    it('should parse `json` filter and generate code successfully!', function() {
        const data = { title: 'test' }
        let text = sugar.render(`{{. | json}}`, data)
        text.should.be.exactly('{\n    &quot;title&quot;: &quot;test&quot;\n}')

        text = sugar.render(`{{. | json space="\t"}}`, data)
        text.should.be.exactly('{\n\t&quot;title&quot;: &quot;test&quot;\n}')
    })
})
