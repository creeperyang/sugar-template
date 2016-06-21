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
}

module.exports = Node
