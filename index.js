const Sugar = require('./lib/sugar')
const {
    tokenizer,
    parser,
    traverser
} = require('./lib/compiler')

const instance = new Sugar()
require('./lib/helpers/if')(instance)
require('./lib/helpers/each')(instance)
require('./lib/filters/string')(instance)

exports = module.exports = instance
exports.Sugar = Sugar
exports.Compiler = {
    tokenizer,
    parser,
    traverser
}
exports.Util = require('./lib/utils')
exports.Exception = require('./lib/exception')
exports.Context = require('./lib/context')
