const objectToString = Object.prototype.toString

const isArray = Array.isArray || function isArrayPolyfill(object) {
    return objectToString.call(object) === '[object Array]'
}

function isFunction(object) {
    return typeof object === 'function'
}

function typeStr(obj) {
    return isArray(obj) ? 'array' : typeof obj;
}

const nonSpaceRe = /\S/

function isWhitespace(string) {
    return !nonSpaceRe.test(string)
}

function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
        return entityMap[s]
    })
}

/**
 * Null safe way of checking whether or not an object,
 * including its prototype, has a given property
 */
function hasProperty(obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj)
}

module.exports = {
    isFunction,
    isArray,
    typeStr,
    isWhitespace,
    escapeRegExp,
    escapeHtml,
    hasProperty
}
