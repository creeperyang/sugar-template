const {
    isArray
} = require('../utils')

module.exports = function(instance) {
    instance.registerHelper('each', function(context, options) {
        if (!options) {
            throw new Error('Must pass iterator to #each')
        }

        const fn = options.fn
        const inverse = options.inverse
        let i = 0
        let ret = ''

        function execIteration(field, index, last) {
            ret += fn(context[field], {
                key: field,
                index: index,
                first: index === 0,
                last: !!last
            })
        }

        if (context && typeof context === 'object') {
            if (isArray(context)) {
                for (let j = context.length; i < j; i++) {
                    if (i in context) {
                        execIteration(i, i, i === context.length - 1)
                    }
                }
            } else {
                let priorKey

                for (const key in context) {
                    if (context.hasOwnProperty(key)) {
                        // We're running the iterations one step out of sync so we can detect
                        // the last iteration without have to scan the object twice and create
                        // an itermediate keys array.
                        if (priorKey !== undefined) {
                            execIteration(priorKey, i - 1)
                        }
                        priorKey = key
                        i++
                    }
                }
                if (priorKey !== undefined) {
                    execIteration(priorKey, i - 1, true)
                }
            }
        }

        if (i === 0) {
            ret = inverse(this)
        }

        return ret
    })
}
