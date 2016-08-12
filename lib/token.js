module.exports = class Node {
    constructor(attrs) {
        Object.assign(this, attrs)
    }
    toJSON() {
        const json = {}
        Object.keys(this).forEach(p => {
            if (p !== 'parent') {
                json[p] = this[p]
            }
        })
        return json
    }
}
