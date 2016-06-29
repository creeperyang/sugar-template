class Node {
    constructor(type, value, start, end) {
        if (typeof type === 'object') {
            Object.assign(this, type)
        } else {
            this.type = type
            this.value = value
            this.loc = {
                start,
                end
            }
        }
    }
    toJSON() {
        const { type, value, loc, children } = this
        return { type, value, loc, children }
    }
}

module.exports = Node
