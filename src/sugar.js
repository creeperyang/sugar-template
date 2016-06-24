const sugar = {
    tags: ['{{', '}}'],
    version: '0.0.1',
    isNode: !!(typeof global === 'object' && global.process)
}

module.exports = sugar
