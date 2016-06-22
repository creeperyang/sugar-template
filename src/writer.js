const {
    isFunction,
    isArray,
    isValue,
    escapeHtml,
    getValueFromString
} = require('./utils')
const parseTemplate = require('./parser')
const Context = require('./context')

const noop = () => ''

class Writer {
    constructor() {
        this.cache = {}
        this.helpers = {}
        this.filters = {}
        this.partials = {}
    }
    clearCache() {
        this.cache = {}
    }
    parse(template, tags, parentToken) {
        const cache = this.cache
        let tokens = cache[template]

        if (tokens == null) {
            tokens = cache[template] = parseTemplate(template, tags, parentToken)
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
            symbol = token.type

            if (symbol === '#') {
                value = this.renderSection(token, context, partials, originalTemplate)
            } else if (symbol === '>') {
                value = this.renderPartial(token, context, partials, originalTemplate)
            } else if (symbol === '&') {
                value = this.unescapedValue(token, context)
            } else if (symbol === 'filter') {
                value = this.renderFilter(token, context)
            } else if (symbol === 'inlineHelper') {
                value = this.renderInlineHelper(token, context)
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
        return token.value
    }
    escapedValue(token, context) {
        const value = context.lookup(token.value)
        if (value != null)
            return escapeHtml(value)
    }
    unescapedValue(token, context) {
        const value = context.lookup(token.value)
        if (value != null)
            return value
    }
    renderFilter(token, context) {
        const data = token.context && context.lookup(token.context)
        let value = data
        let filter
        token.filters.forEach((v) => {
            filter = this.filters[v.name]
            if (!filter) {
                throw new Error(`Miss filter#${v.name}, at ${token.loc.start}`)
            }
            value = filter(value, v.hash)
        })
        if (value != null)
            return escapeHtml(value)
    }
    renderPartial(token, context, partials) {
        partials = partials || {}
        let value = isFunction(partials) ? partials(token.value) : partials[token.value]
        if (value == null) {
            value = this.partials[token.value]
        }
        if (value != null)
            return this.renderTokens(
                this.parse(value, undefined, token),
                token.params.context
                    ? context.push(context.lookup(token.params.context))
                    : context,
                partials,
                value
            )
    }
    renderInlineHelper(token, context) {
        const helper = this.helpers[token.value]
        if (!helper) {
            throw new Error(`Miss helper#${token.value}, at ${token.loc.start}`)
        }
        let data = token.params.context
        if (data != null) {
            let value = isValue(data)
            data = value ? getValueFromString(data, value.preferNumber) : context.lookup(data)
        }
        const value = helper.call(
            context,
            data,
            {
                fn() {
                    return ''
                },
                inverse() {
                    return ''
                },
                hash: token.params.hash
            }
        )
        if (value != null)
            return escapeHtml(value)
    }
    renderSection(token, context, partials, originalTemplate) {
        const helper = this.helpers[token.value]
        if (!helper) {
            throw new Error(`Miss helper#${token.value}, at ${token.loc.start}`)
        }
        let data = token.params.context
        if (data != null) {
            let value = isValue(data)
            data = value ? getValueFromString(data, value.preferNumber) : context.lookup(data)
        }
        return helper.call(
            context,
            data,
            {
                fn: this._createRenderer(token.children, context, partials, originalTemplate),
                inverse: token.inversedChildren
                    ? this._createRenderer(token.inversedChildren, context, partials, originalTemplate)
                    : function() {
                        return ''
                    },
                hash: token.params.hash
            }
        )
    }
    _createRenderer(tokens, context, partials, originalTemplate) {
        return (ctx, pluginData) => {
            ctx = ctx || context
            if (!(ctx instanceof Context)) {
                ctx = context.push(ctx, pluginData)
            }
            return this.renderTokens(tokens, ctx, partials, originalTemplate)
        }
    }

    // add helper function
    registerHelper(name, fn) {
        if (!name) return
        if (!isFunction(fn)) {
            fn = noop
        }
        this.helpers[name] = fn
    }
    unregisterHelper(name) {
        delete this.helpers[name]
    }
    // add filter function
    registerFilter(name, fn) {
        if (!name) return
        if (!isFunction(fn)) {
            fn = () => fn
        }
        this.filters[name] = fn
    }
    unregisterFilter(name) {
        delete this.filters[name]
    }
    // add partials
    registerPartial(name, template) {
        if (!name || typeof template !== 'string') return
        this.partials[name] = template
    }
    unregisterPartial(name) {
        delete this.partials[name]
    }
}

module.exports = Writer
