class Exception extends Error {
    constructor(message, index, template) {
        super(message)
        // if no index, just return this
        if (index == null) return this

        let line, column
        let len = 0
        let preLen = 0
        // the last line maybe incorrect
        // if it is '', it means last line doesn't exist.
        let lines = template.split(/\n/).map(l => `${l}\n`)

        lines.some((item, i) => {
            preLen = len
            len += item.length
            if (len - 1 === index) {
                line = i + 1
                column = item.length
                return true
            } else if (len - 1 > index) {
                line = i + 1
                column = index - preLen + 1
                return true
            }
        })
        this.line = line
        this.column = column
        this.message = message + `  ${line}:${column}`
    }
}

module.exports = Exception
