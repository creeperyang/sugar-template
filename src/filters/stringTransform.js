const {
    isEmpty,
    isFunction
} = require('../utils')

module.exports = function(instance) {
    instance.registerFilter('uppercase', function(data, options) {
        if (typeof data === 'string' || options.force) {
            return String(data).toUpperCase()
        }
        return data
    })
    instance.registerFilter('lowercase', function(data, options) {
        if (typeof data === 'string' || options.force) {
            return String(data).toLowerCase()
        }
        return data
    })
    instance.registerFilter('capitalize', function(data, options) {
        if (typeof data === 'string' || options.force) {
            data = String(data)
            return data[0].toUpperCase() + data.slice(1)
        }
        return data
    })
    instance.registerFilter('json', function(data, options) {
        return JSON.stringify(data, null, options.space == null ? 4 : options.space)
    })
}
