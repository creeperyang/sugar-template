module.exports = function(instance) {
    instance.registerFilter('uppercase', function(data, hash) {
        if (typeof data === 'string' || hash.force) {
            return String(data).toUpperCase()
        }
        return data
    })
    instance.registerFilter('lowercase', function(data, hash) {
        if (typeof data === 'string' || hash.force) {
            return String(data).toLowerCase()
        }
        return data
    })
    instance.registerFilter('capitalize', function(data, hash) {
        if (typeof data === 'string' || hash.force) {
            data = String(data)
            return data[0].toUpperCase() + data.slice(1)
        }
        return data
    })
    instance.registerFilter('json', function(data, hash) {
        return JSON.stringify(data, null, hash.space == null ? 4 : hash.space)
    })
}
