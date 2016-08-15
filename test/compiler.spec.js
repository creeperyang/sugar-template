const fs = require('fs')
const path = require('path')
const should = require('should') // eslint-disable-line
const {
    tokenizer,
    parser,
    traverser
} = require('../lib/compiler')

describe('sugar-template#compiler', function() {
    const sourceContent = fs.readFileSync(
        path.join(__dirname, './res/source.tpl'),
        { encoding: 'utf8' }
    )
    const partialContent = fs.readFileSync(
        path.join(__dirname, './res/partial.tpl'),
        { encoding: 'utf8' }
    )
    describe('tokenizer', function() {
        it('should gen tokens correctly!', function() {
            const partialTokens = tokenizer(partialContent)
            const sourceTokens = tokenizer(sourceContent)
            partialTokens.should.deepEqual(JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/partial.json'),
                    { encoding: 'utf8' }
                )
            ))
            sourceTokens.should.deepEqual(JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/source.json'),
                    { encoding: 'utf8' }
                )
            ))
        })
        it('should give error info and position if template is invalid!', function() {
            try {
                const tpl = `{{#if ok}}\nyes \n{{/i}}`
                tokenizer(tpl)
            } catch (e) {
                e.message.should.be.exactly('Helper close incorrectly  3:1')
            }
            try {
                const tpl = `invalid{{`
                tokenizer(tpl)
            } catch (e) {
                e.message.should.be.exactly('Miss close flag `}}`  1:9')
            }
        })
    })
    describe('parser', function() {
        it('should gen ast correctly!', function() {
            const partialAst = parser(tokenizer(partialContent))
            const sourceAst = parser(tokenizer(sourceContent))
            partialAst.should.containDeep(JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/partial.ast.json'),
                    { encoding: 'utf8' }
                )
            ))
            sourceAst.should.containDeep(JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/source.ast.json'),
                    { encoding: 'utf8' }
                )
            ))
        })
    })
    describe('traverser', function() {
        const addFlag = (ast) => {
            ast.visited = ast.type
            if (ast.type === 'Program') {
                ast.body.forEach(node => addFlag(node))
            } else if (ast.type === 'Helper') {
                ast.block.forEach(node => addFlag(node))
                ast.inverse.forEach(node => addFlag(node))
            }
        }
        const flagVisitor = {
            Program(node) {
                node.visited = 'Program'
            },
            Text(node) {
                node.visited = 'Text'
            },
            IgnoreCompile(node) {
                node.visited = 'IgnoreCompile'
            },
            Value(node) {
                node.visited = 'Value'
            },
            RawValue(node) {
                node.visited = 'RawValue'
            },
            Helper(node) {
                node.visited = 'Helper'
            },
            InlineHelper(node) {
                node.visited = 'InlineHelper'
            },
            Filter(node) {
                node.visited = 'Filter'
            },
            Partial(node) {
                node.visited = 'Partial'
            }
        }
        it('should gen ast correctly!', function() {
            const partialAst = parser(tokenizer(partialContent))
            const sourceAst = parser(tokenizer(sourceContent))

            const partialExpected = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/partial.ast.json'),
                    { encoding: 'utf8' }
                )
            )
            const sourceExpected = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, './res/source.ast.json'),
                    { encoding: 'utf8' }
                )
            )
            traverser(partialAst, flagVisitor)
            traverser(sourceAst, flagVisitor)
            addFlag(partialExpected)
            addFlag(sourceExpected)
            sourceAst.should.containDeep(sourceExpected)
            partialAst.should.containDeep(partialExpected)
        })
    })
})
