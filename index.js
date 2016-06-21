const sugar = require('./src/sugar')
const Writer = require('./src/writer')
const {
    typeStr,
    escapeHtml
} = require('./src/utils')

const defaultWriter = new Writer()

// register built-in helpers
require('./src/helpers/if')(defaultWriter)
require('./src/helpers/each')(defaultWriter)
require('./src/helpers/resource')(defaultWriter)
// register built-in filters
require('./src/filters/stringTransform')(defaultWriter)

sugar.clearCache = function clearCache() {
    return defaultWriter.clearCache()
}

sugar.parse = function parse(template, tags) {
    return defaultWriter.parse(template, tags)
}

sugar.render = function render(template, view, partials) {
    if (typeof template !== 'string') {
        throw new TypeError('Invalid template! Template should be a "string" ' +
            'but "' + typeStr(template) + '" was given as the first ' +
            'argument for sugar#render(template, view, partials)')
    }

    return defaultWriter.render(template, view, partials)
}

sugar.escape = escapeHtml

module.exports = sugar
