const {
    isFunction,
    hasProperty
} = require('./utils')

/**
 * Represents a rendering context by wrapping a data object and
 * maintaining a reference to the parent context.
 */
class Context {
    constructor(data, parentContext, metaData, dot) {
        this.data = data
        this.metaData = metaData
        this.cache = {
            '.': dot === undefined ? this.data : dot
        }
        this.cache['this'] = this.cache['.']
        this.parent = parentContext
    }
    /**
     * Creates a new context using the given data with this context
     * as the parent.
     * @param  {Object} data          given data
     * @param  {Object} metaData      meta data, such as array index, object key
     * @return {Object}               new context object
     */
    push(data, metaData, dot) {
        return new Context(data, this, metaData, dot)
    }
    /**
     * Returns the value of the given name in this context, traversing
     * up the context hierarchy if the value is absent in this context's data.
     * @param  {String} name name
     * @return {Any}         the value represented by name
     */
    lookup(name) {
        let cache = this.cache
        let value

        if (cache.hasOwnProperty(name)) {
            value = cache[name]
        } else {
            let context = this
            let names, index, lookupHit = false

            while (context) {
                if (name.indexOf('.') > 0) {
                    value = context.data
                    names = name.split('.')
                    index = 0

                    /**
                     * Using the dot notion path in `name`, we descend through the
                     * nested objects.
                     *
                     * To be certain that the lookup has been successful, we have to
                     * check if the last object in the path actually has the property
                     * we are looking for. We store the result in `lookupHit`.
                     *
                     * This is specially necessary for when the value has been set to
                     * `undefined` and we want to avoid looking up parent contexts.
                     **/
                    while (value != null && index < names.length) {
                        if (index === names.length - 1)
                            lookupHit = hasProperty(value, names[index])

                        value = value[names[index++]]
                    }
                } else {
                    if (context.data) {
                        value = context.data[name]
                        lookupHit = hasProperty(context.data, name)
                    }
                }

                if (lookupHit) break

                context = context.parent
            }

            if (!lookupHit && this.metaData && /^\$([^\.\s]+)$/.test(name)) {
                value = this.metaData[RegExp.$1]
            }

            cache[name] = value
        }

        if (isFunction(value)) {
            value = value.call(this.data)
        }

        return value
    }
}

module.exports = Context
