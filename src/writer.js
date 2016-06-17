const {
    isFunction,
    isArray,
    escapeHtml
} = require('./utils')
const parseTemplate = require('./parser')
const Context = require('./context')

class Writer {
    constructor() {
        this.cache = {}
    }
    clearCache() {
        this.cache = {}
    }
    parse(template, tags) {
        const cache = this.cache
        let tokens = cache[template]

        if (tokens == null) {
            tokens = cache[template] = parseTemplate(template, tags)
        }

        return tokens
    }
    render(template, view, partials) {
        const tokens = this.parse(template)
        const context = (view instanceof Context) ? view : new Context(view)
        return this.renderTokens(tokens, context, partials, template)
    }
    renderTokens(tokens, context, partials, originalTemplate) {
        let buffer = ''

        let token, symbol, value
        for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            value = undefined
            token = tokens[i]
            symbol = token[0]

            if (symbol === '#') {
                value = this.renderSection(token, context, partials, originalTemplate)
            } else if (symbol === '^') {
                value = this.renderInverted(token, context, partials, originalTemplate)
            } else if (symbol === '>') {
                value = this.renderPartial(token, context, partials, originalTemplate)
            } else if (symbol === '&') {
                value = this.unescapedValue(token, context)
            } else if (symbol === 'name') {
                value = this.escapedValue(token, context)
            } else if (symbol === 'text') {
                value = this.rawValue(token)
            }

            if (value !== undefined) {
                buffer += value
            }
        }

        return buffer
    }
    rawValue(token) {
        return token[1]
    }
    escapedValue(token, context) {
        const value = context.lookup(token[1])
        if (value != null)
            return escapeHtml(value)
    }
    unescapedValue(token, context) {
        const value = context.lookup(token[1])
        if (value != null)
            return value
    }
    renderPartial(token, context, partials) {
        if (!partials) return

        const value = isFunction(partials) ? partials(token[1]) : partials[token[1]]
        if (value != null)
            return this.renderTokens(this.parse(value), context, partials, value)
    }
    renderInverted(token, context, partials, originalTemplate) {
        const value = context.lookup(token[1]);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0))
            return this.renderTokens(token[4], context, partials, originalTemplate);
    }
    renderSection(token, context, partials, originalTemplate) {
        let buffer = ''
        const value = context.lookup(token[1])

        // This function is used to render an arbitrary template
        // in the current context by higher-order sections.
        const subRender = (template) => {
            return this.render(template, context, partials)
        }

        if (!value) return

        if (isArray(value)) {
            for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
                buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate)
            }
        } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
            buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate)
        } else if (isFunction(value)) {
            if (typeof originalTemplate !== 'string')
                throw new Error('Cannot use higher-order sections without the original template')

            // Extract the portion of the original template that the section contains.
            value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender)

            if (value != null)
                buffer += value
        } else { // value is `true`
            buffer += this.renderTokens(token[4], context, partials, originalTemplate)
        }
        return buffer
    }
}

module.exports = Writer
