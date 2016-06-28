const should = require('should') // eslint-disable-line
const sugar = require('../')

describe('sugar-template#partial', function() {
    it('should parse partials and generate code successfully!', function() {
        let text = sugar.render(`{{> test }}`, {}, {
            test: 'just static text'
        })
        text.should.be.exactly('just static text')

        text = sugar.render(`{{> test }}`, {
            name: 'Jack'
        }, {
            test: '{{name}}'
        })
        text.should.be.exactly('Jack')

        text = sugar.render(`{{> ./dir/sub/test }}`, {
            name: 'Jack'
        }, {
            './dir/sub/test': '{{name}}'
        })
        text.should.be.exactly('Jack')
    })
    it('should parse registered partials and generate code successfully!', function() {
        sugar.registerPartial('test', 'just static text')
        let text = sugar.render(`{{> test }}`, {})
        text.should.be.exactly('just static text')
    })
    it('should generate sub context for partials successfully!', function() {
        sugar.registerPartial('test2', '{{name}}')
        let text = sugar.render(`{{> test2 user }}`, {
            user: {
                name: 'Jack'
            }
        })
        text.should.be.exactly('Jack')

        text = sugar.render(`{{> test2 }}`, {
            user: {
                name: 'Jack'
            }
        })
        text.should.be.exactly('')

        sugar.registerPartial('test3', '{{.}}')
        text = sugar.render(`{{> test3 "a string" }}`)
        text.should.be.exactly('a string')
    })
})
