// helpers here works on server side only

const {
    isAbsolute,
    join
} = require('path')
const {
    isEmpty,
    isFunction,
    SafeString
} = require('../utils')

module.exports = function(instance) {
    instance.registerHelper('js', function(url, options) {
        let src = url
        if (!/(https?:)\/\/.test(url)/.test(url) && !isAbsolute(url)) {
            const base = options.hash.base || this && this.lookup('$$file')
            if (base) {
                src = join(base, url)
            }
        }

        return new SafeString(`<script src="${src}"></script>`)
    })
    instance.registerHelper('css', function(url, options) {
        let src = url
        if (!/(https?:)\/\/.test(url)/.test(url) && !isAbsolute(url)) {
            const base = options.hash.base || this && this.lookup('$$file')
            if (base) {
                src = join(base, url)
            }
        }

        return new SafeString(`<link rel="stylesheet" href="${src}">`)
    })
    instance.registerHelper('img', function(url, options) {
        let src = url
        if (!/(https?:)\/\/.test(url)/.test(url) && !isAbsolute(url)) {
            const base = options.hash.base || this && this.lookup('$$file')
            if (base) {
                src = join(base, url)
            }
        }
        const alt = options.hash.alt || ''

        return new SafeString(`<img src="${src}" alt="${alt}"/>`)
    })
}
