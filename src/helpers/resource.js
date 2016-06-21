const {
    isAbsolute
} = require('path')
const {
    isEmpty,
    isFunction,
    SafeString
} = require('../utils')

module.exports = function(instance) {
    instance.registerHelper('js', function(url, options) {
        let src = ''
        if (isAbsolute(url)) {
            src = url
        }
        const base = options.base || ''

        return new SafeString(`<script src="${src}"></script>`)
    })
}