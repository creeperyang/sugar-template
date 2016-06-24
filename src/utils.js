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

function isEmpty(value) {
    if (!value) {
        return value !== 0
    } else if (isArray(value)) {
        return value.length === 0
    } else {
        return false
    }
}

const nonSpaceRe = /\S/

function isWhitespace(string) {
    return !nonSpaceRe.test(string)
}

// values, not property name
// "string", 'string', 5, false, true, null, undefined
// Be tolerant of string check, if starts with "|', we think it is string
function isValue(string) {
    if (typeof string !== 'string'
        || !/^(true|false|null|undefined|(\d+(\.\d+)?))$|^"|^'/.test(string)) {
            return false
        }
    return {
        preferNumber: !!RegExp.$2
    }
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
    return (string instanceof SafeString)
        ? string.toString()
        : String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
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

const stringToValueMap = {
    'null': null,
    'undefined': undefined,
    'true': true,
    'false': false
}

function getValueFromString(string, preferNumber) {
    if (string in stringToValueMap) {
        return stringToValueMap[string]
    }
    return preferNumber ? Number(string) : string.slice(1, -1)
}

class SafeString {
    constructor(raw) {
        this.raw = raw
    }
    toString() {
        return String(this.raw)
    }
    toJSON() {
        return this.raw
    }
}

exports = module.exports = {
    isFunction,
    isArray,
    typeStr,
    isWhitespace,
    isEmpty,
    isValue,
    escapeRegExp,
    escapeHtml,
    hasProperty,
    getValueFromString,
    SafeString
}
