const Scanner = require('./scanner')
const Exception = require('./exception')
const Token = require('./token')
const {
    isFunction,
    isArray,
    isWhitespace,
    getPrimitiveValue
} = require('./utils')

const whiteRe = /\s*/
const spaceRe = /\s+/
const tagRe = /#|\/|>|\{|&|=|!/

/**
 * Take string of template and break it down into array of tokens
 * @param  {String} input template string
 * @return {Array}        tokens
 */
function tokenizer(input) {
    if (!input) return []

    // regexp
    const openingTagRe = /\{\{\s*/
    const closingTagRe = /\s*\}\}/
    const closingCurlyRe = /\s*\}\}\}/
    const closingEqualRe = /\s*=\}\}/
    const equalsRe = /\s*=/
    const curlyRe = /\s*\}/

    let sections = [] // Stack to hold section tokens
    let tokens = [] // Buffer to hold the tokens
    let spaces = [] // Indices of whitespace tokens on the current line
    let hasTag = false // Is there a {{tag}} on the current line?
    let nonSpace = false // Is there a non-space char on the current line?

    const scanner = new Scanner(input)

    let lineNumber = 0
    let start, type, value, chr, token, openSection
    // Currently only used by IgnoreCompile type
    let valueStartIndex, valueEndIndex
    while (!scanner.eos()) {
        start = scanner.pos

        // Match any text between tags.
        value = scanner.scanUntil(openingTagRe)

        if (value) {
            for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
                chr = value.charAt(i)

                if (isWhitespace(chr)) {
                    spaces.push(tokens.length)
                } else {
                    nonSpace = true // this line has non-space char
                }

                tokens.push({
                    type: 'text',
                    value: chr,
                    loc: { start, end: ++start }
                })
                // when encounter line ending, strip space of this line.
                if (chr === '\n') stripSpace()
            }
        }

        // Match the opening tag.
        // strip open tag from scanner.tail
        if (!scanner.scan(openingTagRe)) {
            break
        }

        hasTag = true

        // Get the tag type.
        type = scanner.scan(tagRe) || 'name'
        valueStartIndex = scanner.pos
        scanner.scan(whiteRe)

        // Get the tag value.
        // type: non-compile tag
        if (type === '=') {
            value = scanner.scanUntil(closingEqualRe)
            scanner.scan(equalsRe)
            valueEndIndex = scanner.pos - 1
        }
        // type: raw html
        else if (type === '{') {
            value = scanner.scanUntil(closingCurlyRe)
            type = '&'
            scanner.scan(curlyRe)
        }
        // otherwise extract text until closeTag
        else {
            value = scanner.scanUntil(closingTagRe)
        }

        // Match the closing tag.
        if (!scanner.scan(closingTagRe)) {
            throw new Exception('Miss close flag `}}`', scanner.pos - 1, input)
        }

        token = {
            type,
            value,
            loc: { start, end: scanner.pos }
        }
        tokens.push(token)

        //
        // check syntax and handle token
        //
        if (type === '#') {
            if (spaceRe.test(value)) {
                token.value = value.split(spaceRe)[0]
                token.paramsValue = value.slice(token.value.length).trim()
            }
            token.type = 'helper:start'
            sections.push(token)
        }
        // raw html
        else if (type === '&') {
            nonSpace = true
            token.type = 'raw'
        }
        // type: name, but could be {{else}} {{css "url"}} {{str | uppercase}}
        else if (type === 'name') {
            nonSpace = true

            /**
             * Identify special cases
             * 1. identify filter, {{name | filter}}
             * 2. identify inline helper, {{code name key=value}}
             * 3. identify else block, {{else}}
             */
            if (value === 'else') {
                let section = sections[sections.length - 1]
                if (section && (
                    section.value === 'if' || section.value === 'unless'
                )) {
                    nonSpace = false
                    token.type = 'helper:elseBlock'
                }
            }
            // Because {{" x y "}} is not allowed, normal case for `name` type
            // is always {{name opt-extra-text}}, and name should have no space.
            else if (spaceRe.test(value)) {
                token.value = value.split(spaceRe)[0]
                token.paramsValue = value.slice(token.value.length).trim()
                if (token.paramsValue[0] === '|') {
                    token.type = 'filter'
                } else {
                    token.type = 'helper:inline'
                }
            }
        }
        // stop compile text inside
        else if (type === '=') {
            token.type = 'compile:ignore'
            token.value = scanner.text.slice(valueStartIndex, valueEndIndex)
        }
        // type: end block
        else if (type === '/') {
            openSection = sections.pop()
            if (!openSection) {
                throw new Exception('Extra helper close tag', token.loc.start, input)
            } else if (openSection.value !== token.value) {
                throw new Exception(`Helper close incorrectly`, token.loc.start, input)
            }
            token.type = 'helper:end'
        }
        // type: partial block
        else if (type === '>') {
            token.type = 'partial'
        }
        // type: comment block
        else if (type === '!') {
            token.type = 'comment'
        }
        // only support types above, others will be treated as `name`
        // and `helper/filter`
        // {{* }} --> name (*)
        // {{* x}} --> inline helper (*)
    }

    return squashTokens(tokens)

    // Strips all whitespace tokens array for the current line
    // if the line is combined only with a tag (like {{#tag}}) and space.
    // Because we don't want to add these space to outputed text
    function stripSpace() {
        if (hasTag && !nonSpace) {
            while (spaces.length) {
                tokens[spaces.pop()] = null
            }
        } else {
            spaces = []
        }

        hasTag = false
        nonSpace = false
    }
}

/**
 * Combines the values of consecutive text tokens in the given `tokens` array
 * to a single token, And remove empty tokens.
 * @param  {Array} tokens token list
 * @return {Array}        squashed token list
 */
function squashTokens(tokens) {
    const squashedTokens = []

    let token, lastToken
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
        token = tokens[i]

        if (token) {
            if (token.type === 'text' && lastToken && lastToken.type === 'text') {
                lastToken.value += token.value
                lastToken.loc.end = token.loc.end
            } else {
                squashedTokens.push(token)
                lastToken = token
            }
        }
    }

    return squashedTokens
}

// name/"str"/0/null/undefined/true/false
const quoteRe = /"/
const singleQuoteRe = /'/
const argEqualsRe = /\s*=\s*/
const primitiveValueRe = /true|false|null|undefined|(\d+(\.\d+)?)/

// string already be trimmed
function parseParamsString(string, onlyGetContext) {
    const res = {
        hash: {}
    }
    if (!string || typeof string !== 'string') return res

    const scanner = new Scanner(string)
    scanner.scan(spaceRe)
    // has context
    if (getQuoteRe(scanner.charAt(0)) || !/^[^=\s]+\s*=/.test(string)) {
        res.context = resolveValue()
    }

    // If we just want context, return here.
    // This will help with multiple context.
    if (onlyGetContext) {
        return {
            context: res.context,
            string: scanner.getRawString()
        }
    }

    scanner.scan(spaceRe)
    let name, value
    while (!scanner.eos()) {
        name = scanner.scanUntil(argEqualsRe)
        if (!name) break
        scanner.scan(argEqualsRe)
        pair = resolveValue()
        res.hash[name] = pair
        scanner.scan(spaceRe)
    }
    return res

    function resolveValue() {
        let quoteRe = getQuoteRe(scanner.charAt(0))
        let value, type
        if (quoteRe) {
            scanner.scan(quoteRe)
            value = scanner.scanUntil(quoteRe)
            scanner.scan(quoteRe)
            type = 'primitive'
        } else {
            // not string, so space can be split flag
            value = scanner.scanUntil(spaceRe)
            if (primitiveValueRe.test(value)) {
                type = 'primitive'
                value = getPrimitiveValue(value)
            } else {
                type = 'name'
            }
        }
        return {
            type,
            value
        }
    }
    function getQuoteRe(chr) {
        return chr === '"' ? quoteRe :
            (chr === '\'' ? singleQuoteRe : null)
    }
}

function parseFilter(string) {
    const res = []
    if (!string || typeof string !== 'string') return res

    string = string.trim()
    let index = 1
    let begin = 1
    let len = string.length
    let enterQuote = false
    let prevQuote
    // split to array of filters
    while (index < len) {
        let chr = string[index]
        if (chr === '|' && !enterQuote) {
            res.push(string.slice(begin, index))
            begin = index + 1
        }
        if (chr === '"' || chr === '\'') {
            if (chr === prevQuote) {
                enterQuote = false
            } else {
                enterQuote = true
                prevQuote = chr
            }
        }
        index++
    }
    if (index > begin) {
        res.push(string.slice(begin))
    }
    return res.map(parseParamsString).map(item => {
        item.name = item.context.value
        item.context = undefined
        return item
    })
}

/**
 * Take array of tokens and turn it into an AST
 * @param  {Array} tokens  tokens
 * @return {Object}        ast
 */
function parser(tokens) {
    let current = 0
    let inElseBlock = false
    function walk(parent) {
        let token = tokens[current]

        if (token.type === 'text') {
            current++
            return new Token({
                type: 'Text',
                value: token.value,
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'helper:start') {
            const node = new Token({
                type: 'Helper',
                name: token.value,
                value: token.paramsValue,
                params: parseParamsString(token.paramsValue),
                block: [],
                inverse: [],
                loc: {
                    start: token.loc.start
                },
                parent
            })
            if (token.value === 'if' || token.value === 'unless') {
                inElseBlock = false
            }
            // increment `current` to skip helperStart (#)
            token = tokens[++current]
            while (
                token.type !== 'helper:end'
            ) {
                if (token.type === 'helper:elseBlock') {
                    // increment `current` to skip helper:elseBlock ({{else}})
                    ++current
                    inElseBlock = true
                }
                if (inElseBlock) {
                    node.inverse.push(walk(node))
                } else {
                    node.block.push(walk(node))
                }
                token = tokens[current]
            }
            current++
            inElseBlock = false
            node.loc.end = token.loc.end
            return node
        }
        else if (token.type === 'helper:inline') {
            current++
            return new Token({
                type: 'InlineHelper',
                name: token.value,
                value: token.paramsValue,
                params: parseParamsString(token.paramsValue),
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'filter') {
            current++
            return new Token({
                type: 'Filter',
                name: token.value,
                value: token.paramsValue,
                filters: parseFilter(token.paramsValue),
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'partial') {
            current++
            const res = parseParamsString(token.value, true)
            return new Token({
                type: 'Partial',
                name: res.context,
                params: parseParamsString(res.string),
                value: token.value,
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'name') {
            current++
            return new Token({
                type: 'Value',
                value: token.value,
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'raw') {
            current++
            return new Token({
                type: 'RawValue',
                value: token.value,
                loc: token.loc,
                parent
            })
        }
        else if (token.type === 'compile:ignore') {
            current++
            return new Token({
                type: 'IgnoreCompile',
                value: token.value,
                loc: token.loc,
                parent
            })
        }
        else {
            throw new Exception(`Unsupported token type: ${token.type}`)
        }
    }

    const ast = new Token({
        type: 'Program',
        body: []
    })
    while (current < tokens.length) {
        ast.body.push(walk(ast))
    }
    return ast
}

function traverser(ast, visitor, ...args) {
    function traverseArray(array) {
        array.forEach(child => traverseNode(child))
    }
    function traverseNode(node) {
        if (visitor[node.type]) {
            visitor[node.type](node, ...args)
        }

        if (node.type === 'Program') {
            traverseArray(node.body)
        } else if (node.type === 'Helper') {
            traverseArray(node.block)
            traverseArray(node.inverse)
        }
    }

    traverseNode(ast)
}

module.exports = {
    tokenizer,
    parser,
    traverser
}
