const {
    isEmpty,
    isFunction,
    SafeString
} = require('../utils')

module.exports = function(instance) {
    instance.registerHelper('if', function(conditional, options) {
        if (isFunction(conditional)) {
            conditional = conditional.call(this)
        }

        let ret
        // Default behavior is to render the positive path if the value is truthy and not empty.
        // The `includeZero` option may be set to treat the condtional as purely not empty based on the
        // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
        if ((!options.hash.includeZero && !conditional) || isEmpty(conditional)) {
            ret = options.inverse(this)
        } else {
            ret = options.fn(this)
        }
        return new SafeString(ret)
    })

    instance.registerHelper('unless', function(conditional, options) {
        return instance.helpers['if'].call(this, conditional, {
            fn: options.inverse,
            inverse: options.fn,
            hash: options.hash
        })
    })
}
