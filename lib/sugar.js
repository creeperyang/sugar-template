const { parser, tokenizer } = require('./compiler')
const Context = require('./context')
const Exception = require('./exception')
const {
    isArray,
    isFunction,
    escapeHtml
} = require('./utils')

function transformHash(hash, context) {
    const res = {}
    for (let p in hash) {
        if (hash[p].type === 'name') {
            res[p] = context.lookup(hash[p].value)
        } else {
            res[p] = hash[p].value
        }
    }
    return res
}

class Sugar {
    constructor(cache, helpers, filters, partials) {
        this.cache = cache || {}
        this.helpers = helpers || {}
        this.filters = filters || {}
        this.partials = partials || {}
    }
    parse(template, parentToken) {
        const cache = this.cache
        let ast = cache[template]

        if (ast == null) {
            ast = cache[template] = parser(tokenizer(template))
        }
        // If parentToken exists, set ast.parent.
        // Most cases used by partial
        if (parentToken) {
            ast.parent = parentToken
        }
        return ast
    }
    render(template, view) {
        const ast = this.parse(template)
        const context = (view instanceof Context) ? view : new Context(view)
        return this.renderAst(ast, context, template)
    }
    renderAst(ast, context, template) {
        let buffer = ''
        const tokens = isArray(ast) ? ast : ast.body
        for (let i = 0, len = tokens.length; i < len; i++) {
            let token = tokens[i]
            let value = this[token.type](token, context, template)
            if (value) {
                buffer += value
            }
        }
        return buffer
    }
    Text(token) {
        return token.value
    }
    RawValue(token, context) {
        const value = context.lookup(token.value)
        return value == null ? '' : value
    }
    Value(token, context) {
        const value = context.lookup(token.value)
        return value == null ? '' : escapeHtml(value)
    }
    IgnoreCompile(token) {
        return token.value
    }
    Filter(token, context, template) {
        const data = token.name && context.lookup(token.name)
        let value = data
        let filter
        token.filters.forEach((v) => {
            filter = this.filters[v.name]
            if (!filter) {
                throw new Exception(`Miss filter#${v.name}`, token.loc.start, template || '')
            }
            value = filter(value, transformHash(v.hash, context))
        })
        return value == null ? '' : escapeHtml(value)
    }
    InlineHelper(token, context, template) {
        const helper = this.helpers[token.name]
        if (!helper) {
            throw new Exception(`Miss helper#${token.name}`, token.loc.start, template || '')
        }
        let data = token.params.context
        if (data) {
            data = data.type === 'name' ? context.lookup(data.value) : data.value
        }
        const value = helper.call(
            context,
            data,
            {
                fn() { return '' },
                inverse() { return '' },
                hash: transformHash(token.params.hash, context)
            }
        )
        return value == null ? '' : escapeHtml(value)
    }
    Helper(token, context, template) {
        const helper = this.helpers[token.name]
        if (!helper) {
            throw new Exception(`Miss helper#${token.name}`, token.loc.start, template || '')
        }
        let data = token.params.context
        if (data) {
            data = data.type === 'name' ? context.lookup(data.value) : data.value
        }
        const value = helper.call(
            context,
            data,
            {
                fn: this._createRenderer(token.block, context, template),
                inverse: token.inverse
                    ? this._createRenderer(token.inverse, context, template)
                    : function() { return '' },
                hash: transformHash(token.params.hash, context)
            }
        )
        return value == null ? '' : escapeHtml(value)
    }
    Partial(token, context, template) {
        const partial = token.name.type === 'name'
            ? context.lookup(token.name.value)
            : token.name.value
        let value = partial && this.partials[partial]
        if (value == null) {
            throw new Exception(`Miss partial#${partial || token.name.value}`,
                token.loc.start, template || '')
        }
        let data = token.params.context
        if (data) {
            data = data.type === 'name' ? context.lookup(data.value) : data.value
        }
        return this.renderAst(
            this.parse(value, token),
            token.params.context ? context.push(data) : context,
            value
        )
    }
    _createRenderer(tokens, context, template) {
        return (subContext, pluginData) => {
            if (!(subContext instanceof Context)) {
                subContext = subContext === context.data
                    ? context
                    : context.push(subContext, pluginData)
            }
            return this.renderAst(tokens, subContext, template)
        }
    }
    // add helper function
    registerHelper(name, fn) {
        if (!name) return
        if (!isFunction(fn)) {
            throw new Error('Helper should be function')
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

module.exports = Sugar
