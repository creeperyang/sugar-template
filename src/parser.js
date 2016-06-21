const Scanner = require('./scanner')
const Node = require('./node')
const {
    isFunction,
    isArray,
    isWhitespace,
    escapeRegExp,
    escapeHtml,
    parseParams,
    parseFilters
} = require('./utils')
const sugar = require('./sugar')

const whiteRe = /\s*/
const filterRe = /\s+\|\s+/
const spaceRe = /\s+/
const equalsRe = /\s*=/
const curlyRe = /\s*\}/
const tagRe = /#|\/|>|\{|&|=|!/

// core function
function parseTemplate(template, tags = sugar.tags) {
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
                if (section && section.value === 'if') {
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

    return makeTokenTree(squashTokens(tokens))

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

function handleHelperToken(token, value) {
    value = value || token.value
    token.originalValue = value
    value = value.split(spaceRe)
    token.value = token.helper = value[0]
    token.params = parseParams(value.slice(1))
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
 * @param  {Array} tokens token list
 * @return {Array}        token tree
 */
function makeTokenTree(tokens) {
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
                section = token
                break
            case '/':
                section = sections.pop()
                section.sectionEndLoc = token.loc
                collector = sections.length > 0 ? sections[sections.length - 1].children : nestedTokens
                if (section.elseTokenPos != null) {
                    section.inversedChildren = section.children.slice(section.elseTokenPos)
                    section.children = section.children.slice(0, section.elseTokenPos)
                }
                break
            case 'name':
                handleSpecialNameToken(token, i)
                if (!token.isElseBlock) {
                    // ignore/remove `{{else}}` token
                    collector.push(token)
                    token.parent = section
                }
                break
            default:
                collector.push(token)
                token.parent = section
        }
    }

    return nestedTokens

    function handleSpecialNameToken(token, index) {
        if (token.isElseBlock) {
            const ifToken = sections[sections.length - 1]
            if (!ifToken || ifToken.helper !== 'if') {
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
        token.filters = parseFilters(value.slice(1))
        token.type = 'filter'
    }
}

module.exports = parseTemplate
