const Scanner = require('./scanner')
const Node = require('./node')
const {
    isFunction,
    isArray,
    isWhitespace,
    escapeRegExp,
    escapeHtml,
    getValueFromString
} = require('./utils')
const sugar = require('./sugar')

const whiteRe = /\s*/
const filterRe = /\s+\|\s+/
const spaceRe = /\s+/
const equalsRe = /\s*=/
const curlyRe = /\s*\}/
const tagRe = /#|\/|>|\{|&|=|!/

// core function
function parseTemplate(template, tags = sugar.tags, parentToken) {
    if (!template) return []

    let sections = [] // Stack to hold section tokens
    let tokens = [] // Buffer to hold the tokens
    let spaces = [] // Indices of whitespace tokens on the current line
    let hasTag = false // Is there a {{tag}} on the current line?
    let nonSpace = false // Is there a non-space char on the current line?

    // re used to check open/close/closingCurly tag
    let openingTagRe
    let closingTagRe
    let closingCurlyRe
    // compile tags, assign openingTagRe, closingTagRe, closingCurlyRe
    compileTags(tags)

    const scanner = new Scanner(template)

    let start, type, value, chr, token, openSection
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
                    nonSpace = true
                }

                tokens.push(new Node('text', chr, start, ++start))

                // Check for whitespace on the current line.
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
        scanner.scan(whiteRe)

        // Get the tag value.
        // type: switch tag
        if (type === '=') {
            value = scanner.scanUntil(equalsRe)
            scanner.scan(equalsRe)
            scanner.scanUntil(closingTagRe)
        }
        // type: raw html
        else if (type === '{') {
            value = scanner.scanUntil(closingCurlyRe)
            scanner.scan(curlyRe)
            scanner.scanUntil(closingTagRe)
            type = '&'
        }
        // otherwise extract text until closeTag
        else {
            value = scanner.scanUntil(closingTagRe)
        }

        // Match the closing tag.
        if (!scanner.scan(closingTagRe))
            throw new Error('Unclosed tag at ' + scanner.pos)

        token = new Node(type, value, start, scanner.pos)
        tokens.push(token)

        if (type === '#') {
            token.isHelper = true
            // we need pre handle helper here because we need helper name to
            // check whether helper is correctly closed
            handleHelperToken(token, value)
            sections.push(token)
        }
        // type: end block
        else if (type === '/') {
            // Check section nesting.
            openSection = sections.pop()

            if (!openSection)
                throw new Error('Unopened section "' + value + '" at ' + start)

            if (openSection.value !== value)
                throw new Error('Unclosed section "' + openSection.value + '" at ' + start)
        }
        // type: name, raw html
        else if (type === 'name' || type === '{' || type === '&') {
            nonSpace = true

            /**
             * identify special cases
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
                    token.isElseBlock = true
                }
                // previous token.type  previousToken.elseToken ---> inverse render method
            } else if (spaceRe.test(value)) {
                if (filterRe.test(value)) {
                    token.isFilter = true
                } else {
                    token.isInlineHelper = true
                }
            }
        }
        else if (type === '=') {
            // Set the tags for the next time around.
            compileTags(value)
        }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop()
    if (openSection)
        throw new Error('Unclosed section "' + openSection.value + '" at ' + scanner.pos)

    return makeTokenTree(squashTokens(tokens), (parentToken instanceof Node) && parentToken)

    function compileTags(tagsToCompile) {
        if (typeof tagsToCompile === 'string')
            tagsToCompile = tagsToCompile.split(spaceRe, 2)

        if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
            throw new Error('Invalid tags: ' + tagsToCompile)

        openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*')
        closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]))
        closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]))
    }

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

const quoteRe = /"/
const singleQuoteRe = /'/
const argEqualsRe = /\s*=\s*/
const allowedValueRe = /true|false|null|undefined|(\d+(\.\d+)?)/
function parseArguments(string, onlyHash) {
    const res = {
        hash: {}
    }
    if (!string || typeof string !== 'string') return res
    if (onlyHash === undefined) {
        onlyHash = /^\s*[^=\s]+\s*=/.test(string)
    }
    const scanner = new Scanner(string)
    scanner.scan(spaceRe)
    while (!scanner.eos()) {
        let value, key
        if (onlyHash) {
            value = scanner.scanUntil(argEqualsRe)
            if (!value) break
            let key = value
            scanner.scan(argEqualsRe)
            value = scanner.scan(allowedValueRe)
            if (value) {
                res.hash[key] = getValueFromString(value, !!RegExp.$1)
            } else {
                res.hash[key] = getStringValue()
            }
        } else {
            let re = getQuoteRe(scanner.charAt(0))
            if (re) {
                value = getStringValue(re)
                res.contextIsString = true
            } else {
                value = scanner.scanUntil(spaceRe)
            }
            onlyHash = true
            res.context = value
        }
        scanner.scan(spaceRe)
    }
    return res

    function getStringValue(re) {
        let quote
        if (!re) {
            quote = scanner.charAt(0)
            re = getQuoteRe(quote)
        }
        if (!re) throw new Error(`Expect quote but find ${quote} when parse arguments`)
        // remove left part quote
        scanner.scan(re)
        let value = scanner.scanUntil(re)
        let chr = scanner.charAt(1)
        while (chr && !spaceRe.test(chr)) {
            value += scanner.scan(re) + scanner.scanUntil(re)
            chr = scanner.charAt(1)
        }
        // remove right part quote
        scanner.scan(re)
        return value
    }
    function getQuoteRe(quote) {
        return quote === `"`
            ? quoteRe
            : quote === `'`
            ? singleQuoteRe
            : null
    }
}

function handleHelperToken(token, value) {
    value = value || token.value
    let index = value.search(spaceRe)
    token.originalValue = value
    if (index > 0) {
        token.value = token.helper = value.slice(0, index)
        token.params = parseArguments(value.slice(index))
    } else {
        token.value = token.helper = value
        token.params = {
            hash: {}
        }
    }
    if (token.type === 'name') {
        token.type = 'inlineHelper'
    }
}

/**
 * Combines the values of consecutive text tokens in the given `tokens` array
 * to a single token.
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

/**
 * Forms the given array of `tokens` into a nested tree structure where
 * tokens that represent a section have two additional items: 1) an array of
 * all tokens that appear in that section and 2) the index in the original
 * template that represents the end of that section.
 * @param  {Array} tokens  token list
 * @param  {Object} parent parent token
 * @return {Array}         token tree
 */
function makeTokenTree(tokens, parent) {
    const nestedTokens = []
    let collector = nestedTokens
    const sections = []

    let token, section
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
        token = tokens[i]
        switch (token.type) {
            case '#':
                collector.push(token)
                sections.push(token)
                collector = token.children = []
                token.parent = parent
                parent = token
                break
            case '/':
                section = sections.pop()
                section.sectionEndLoc = token.loc
                collector = sections.length > 0 ? sections[sections.length - 1].children : nestedTokens
                if (section.elseTokenPos != null) {
                    section.inversedChildren = section.children.slice(section.elseTokenPos)
                    section.children = section.children.slice(0, section.elseTokenPos)
                }
                parent = section.parent
                break
            case 'name':
                handleSpecialNameToken(token, i)
                // ignore/remove `{{else}}` token
                if (!token.isElseBlock) {
                    collector.push(token)
                    token.parent = parent
                }
                break
            case '>':
                handlePartialToken(token)
                collector.push(token)
                token.parent = parent
                break
            default:
                collector.push(token)
                token.parent = parent
        }
    }

    return nestedTokens

    function handleSpecialNameToken(token, index) {
        if (token.isElseBlock) {
            const ifToken = sections[sections.length - 1]
            if (!ifToken || !(
                ifToken.helper === 'if' || ifToken.helper === 'unless'
            )) {
                throw new Error('Unexpected else block')
            }
            ifToken.elseTokenPos = collector.length
        } else if (token.isInlineHelper) {
            handleHelperToken(token)
        } else if (token.isFilter) {
            handleFilterToken(token)
        }
    }
    function handleFilterToken(token) {
        let value = token.value
        token.originalValue = value
        value = value.split(filterRe)
        token.context = value[0]
        token.value = null
        token.filters = value.slice(1).map(v => {
            let res = parseArguments(v)
            return {
                name: res.context,
                hash: res.hash
            }
        })
        token.type = 'filter'
    }
    function handlePartialToken(token) {
        let value = token.value
        let index = value.search(spaceRe)
        token.originalValue = value
        if (index > 0) {
            token.value = token.partial = value.slice(0, index)
            token.params = parseArguments(value.slice(index))
        } else {
            token.value = token.partial = value
            token.params = {
                hash: {}
            }
        }
    }
}

exports = module.exports = parseTemplate
// mainly export for test
exports.parseArguments = parseArguments
