const fs = require('fs')
const path = require('path')
const should = require('should') // eslint-disable-line
const sugar = require('../')

describe('sugar-template#helper', function() {
    it('should parse `if` helpers and generate code successfully!', function() {
        // simple if
        let text = sugar.render(`{{#if title}}{{title}}{{/if}}`, { title: 'test' })
        text.should.be.exactly('test')

        // with else
        text = sugar.render(`{{#if ok}}yes{{else}}no{{/if}}`, { ok: false })
        text.should.be.exactly('no')

        // support direct value other than access property
        text = sugar.render(`{{#if true}}yes{{else}}no{{/if}}`)
        text.should.be.exactly('yes')
    })
    it('should parse `unless` helpers and generate code successfully!', function() {
        // simple if
        let text = sugar.render(`{{#unless title}}{{title}}{{/unless}}`, { title: 'test' })
        text.should.be.exactly('')

        // with else
        text = sugar.render(`{{#unless ok}}yes{{else}}no{{/unless}}`, { ok: false })
        text.should.be.exactly('yes')

        // support direct value other than access property
        text = sugar.render(`{{#unless "t"}}yes{{else}}no{{/unless}}`)
        text.should.be.exactly('no')
    })
    it('should parse `each` helpers and generate code successfully!', function() {
        // simple array, output array item directly
        let text = sugar.render(`{{#each nums}}{{.}} {{/each}}`, { nums: [0, 1, 2] })
        text.should.be.exactly('0 1 2 ')

        // access useful property within each
        text = sugar.render(`Users are:${
            '\n'
        }{{#each users}}{{$$index}}. {{name}}; {{/each}}`, {
            users: [{ name: 'Jack' }, { name: 'Kate' }]
        })
        text.should.be.exactly('Users are:\n0. Jack; 1. Kate; ')

        // support each object
        text = sugar.render(`{{#each user}}{{.}} {{/each}}`, {
            user: {
                name: 'Mike',
                age: 18,
                gender: 'M'
            }
        })
        text.should.be.exactly('Mike 18 M ')
    })
    it('should parse multiple and nested helpers and generate code successfully!', function() {
        let text = sugar.render(`{{#each user}}${
            '\n'
        }{{$$key}}: {{.}}{{#unless $$last}}\n{{/unless}}${
            '\n'
        }{{/each}}`, {
            user: {
                name: 'Mike',
                age: 18,
                gender: 'M'
            }
        })
        text.should.be.exactly(`name: Mike\nage: 18\ngender: M`)
    })
})
