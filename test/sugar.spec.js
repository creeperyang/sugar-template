const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const should = require('should') // eslint-disable-line
const {
    tokenizer,
    parser,
    traverser
} = require('../lib/compiler')
const {
    SafeString
} = require('../lib/utils')
const Context = require('../lib/context')
const Sugar = require('../lib/sugar')

describe('sugar-template#Sugar', function() {
    const sourceContent = fs.readFileSync(
        path.join(__dirname, './res/source.tpl'),
        { encoding: 'utf8' }
    )
    const partialContent = fs.readFileSync(
        path.join(__dirname, './res/partial.tpl'),
        { encoding: 'utf8' }
    )

    describe('register/unregister helpers/partials/filters', function() {
        const sugar = new Sugar()
        const fn = () => ''
        it('`registerPartial` should register partial successfully!', function() {
            sugar.partials.should.deepEqual({})
            sugar.registerPartial('./partial.tpl', partialContent)
            sugar.partials.should.deepEqual({ './partial.tpl': partialContent })
        })
        it('`unregisterPartial` should unregister partial successfully!', function() {
            sugar.unregisterPartial('./partial.tpl')
            sugar.partials.should.deepEqual({})
        })

        it('`registerHelper` should register helper successfully!', function() {
            sugar.helpers.should.deepEqual({})
            sugar.registerHelper('hi', fn)
            sugar.helpers.should.deepEqual({ 'hi': fn })
        })
        it('`unregisterHelper` should unregister helper successfully!', function() {
            sugar.unregisterHelper('hi')
            sugar.helpers.should.deepEqual({})
        })

        it('`registerFilter` should register filter successfully!', function() {
            sugar.filters.should.deepEqual({})
            sugar.registerFilter('hi', fn)
            sugar.filters.should.deepEqual({ 'hi': fn })
        })
        it('`unregisterFilter` should unregister filter successfully!', function() {
            sugar.unregisterFilter('hi')
            sugar.filters.should.deepEqual({})
        })
    })

    describe('built-in helpers if/unless/each', function() {
        const sugar = new Sugar()
        require('../lib/helpers/if')(sugar)
        require('../lib/helpers/each')(sugar)
        it('`if` should work correctly!', function() {
            sugar.render(`{{#if true}}Hi{{/if}}`, {}).should.be.exactly('Hi')
            sugar.render(`{{#if false}}Hi{{/if}}`, {}).should.be.exactly('')

            sugar.render(`{{#if name}}Yes{{else}}No{{/if}}`, {
                name: 'ABC'
            }).should.be.exactly('Yes')
            sugar.render(`{{#if name}}Yes{{else}}No{{/if}}`, {
                name: ''
            }).should.be.exactly('No')
        })
        it('`unless` should work correctly!', function() {
            sugar.render(`{{#unless true}}Hi{{/unless}}`, {}).should.be.exactly('')
            sugar.render(`{{#unless false}}Hi{{/unless}}`, {}).should.be.exactly('Hi')

            sugar.render(`{{#unless name}}Yes{{else}}No{{/unless}}`, {
                name: 'ABC'
            }).should.be.exactly('No')
            sugar.render(`{{#unless name}}Yes{{else}}No{{/unless}}`, {
                name: ''
            }).should.be.exactly('Yes')
        })
        it('`each` should work correctly!', function() {
            sugar.render(`{{#each nums}}{{.}}{{/each}}`, {
                nums: [1, 2, 3]
            }).should.be.exactly('123')
            sugar.render(`{{#each nums}}{{.}}{{/each}}`, {
                nums: []
            }).should.be.exactly('')

            sugar.render(`{{#each nums}}{{.}}{{/each}}`, {
                nums: {
                    x: 1,
                    y: 2
                }
            }).should.be.exactly('12')
            sugar.render(`{{#each nums}}{{.}}{{/each}}`, {
                nums: {}
            }).should.be.exactly('')
        })
    })
    describe('custom helpers', function() {
        const sugar = new Sugar()
        function identity(context, options) {
            return new SafeString(options.fn(this))
        }
        const spy = sinon.spy(identity)
        sugar.registerHelper('identity', spy)
        it('custom helper should work correctly!', function() {
            sugar.render(`{{#identity true}}<{{name}}>{{/identity}}`, {
                name: 'Yes'
            }).should.be.exactly('<Yes>')
            spy.args[0][0].should.be.exactly(true)
            spy.args[0][1].should.have.properties('fn', 'inverse', 'hash')
            spy.calledOnce.should.be.exactly(true)
            spy.thisValues[0].should.be.instanceof(Context)
                .and.have.property('data', { name: 'Yes' })
        })
    })
    describe('built-in filters', function() {
        const sugar = new Sugar()
        require('../lib/filters/string')(sugar)
        it('`uppercase` should work correctly!', function() {
            sugar.render(`{{name | uppercase}}`, {
                name: 'Kate'
            }).should.be.exactly('KATE')
            sugar.render(`{{name | uppercase}}`, {
                name: false
            }).should.be.exactly('false')
            sugar.render(`{{name | uppercase force=true}}`, {
                name: false
            }).should.be.exactly('FALSE')
        })
        it('`lowercase` should work correctly!', function() {
            sugar.render(`{{name | lowercase}}`, {
                name: 'Kate'
            }).should.be.exactly('kate')
            sugar.render(`{{name | lowercase}}`, {
                name: {}
            }).should.be.exactly('[object Object]')
            sugar.render(`{{name | lowercase force=true}}`, {
                name: {}
            }).should.be.exactly('[object object]')
        })
        it('`capitalize` should work correctly!', function() {
            sugar.render(`{{name | capitalize}}`, {
                name: 'kate'
            }).should.be.exactly('Kate')
            sugar.render(`{{name | capitalize}}`, {
                name: false
            }).should.be.exactly('false')
            sugar.render(`{{name | capitalize force=true}}`, {
                name: false
            }).should.be.exactly('False')
        })
        it('`json` should work correctly!', function() {
            sugar.render(`{{. | json}}`, {
                name: 'Kate'
            }).should.be.exactly('{\n    &quot;name&quot;: &quot;Kate&quot;\n}')
            sugar.render(`{{. | json space=2}}`, {
                name: 'Kate'
            }).should.be.exactly('{\n  &quot;name&quot;: &quot;Kate&quot;\n}')
        })
    })
    describe('custom filters', function() {
        const sugar = new Sugar()
        function camel(context, hash) {
            return new SafeString(context.replace(/-\S/g, (match) => {
                return match.slice(1).toUpperCase()
            }))
        }
        const spy = sinon.spy(camel)
        sugar.registerFilter('camel', spy)
        it('custom filter should work correctly!', function() {
            sugar.render(`{{v | camel arg=m}}`, {
                v: 'do-it-now',
                m: '?'
            }).should.be.exactly('doItNow')
            spy.args[0][0].should.be.exactly('do-it-now')
            spy.args[0][1].should.be.deepEqual({ arg: '?' })
            spy.calledOnce.should.be.exactly(true)
        })
    })
    describe('parse and render', function() {
        const sugar = new Sugar()
        const partialContent = fs.readFileSync(
            path.join(__dirname, './res/partial.tpl'),
            { encoding: 'utf8' }
        )
        it('`parse` should generate ast successfully!', function() {
            const ast = sugar.parse(partialContent)
            ast.should.containDeep(JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/partial.ast.json'),
                    { encoding: 'utf8' }
                )
            ))
        })
        it('`render` should handle compile ignore tag correctly!', function() {
            sugar.render(`{{= {{tag}} =}}`, {}).should.be.exactly(` {{tag}} `)
            sugar.render(`{{=
                {{tag}}
                =}}`, {}).should.be.exactly(`
                {{tag}}
                `)
        })
        it('`render` should generate html successfully!', function() {
            const sourceContent = fs.readFileSync(
                path.join(__dirname, './res/source.tpl'),
                { encoding: 'utf8' }
            )
            require('../lib/helpers/if')(sugar)
            require('../lib/helpers/each')(sugar)
            require('../lib/filters/string')(sugar)
            sugar.registerPartial('./partial.tpl', partialContent)
            try {
                sugar.render(sourceContent, {})
            } catch (e) {
                e.message.should.be.exactly('Miss helper#img  2:1')
            }
            sugar.registerHelper('img', () => 'IMG')
            sugar.render(sourceContent, {
                title: 'Hi',
                list: [{ name: 'K1' }, { name: 'K2' }]
            }).should.be.exactly('<h1>Hi</h1>\nIMG\n&lt;ul class&#x3D;&quot;Hi&quot;&gt;\n    &amp;lt;li&amp;gt;0-K1&amp;lt;&amp;#x2F;li&amp;gt;\n    &amp;lt;li&amp;gt;1-K2&amp;lt;&amp;#x2F;li&amp;gt;\n&lt;&#x2F;ul&gt;')
        })
    })
})
