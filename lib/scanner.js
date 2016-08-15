/**
 * A simple string scanner that is used by the template parser to find
 * tokens in template strings.
 */
class Scanner {
    constructor(text) {
        this.text = text
        this.tail = text
        this.pos = 0
    }
    /**
     * Check if this.tail is empty (end of string).
     * @return {Boolean} `true` if the tail is empty
     */
    eos() {
        return this.tail === ''
    }
    /**
     * Skips all text until the given regular expression can be matched. Returns
     * the skipped string, which is the entire tail if no match can be made.
     * @param  {RegExp} re regular expression
     * @return {String}    skipped text
     */
    scanUntil(re) {
        const index = this.tail.search(re)
        let match

        switch (index) {
            case -1:
                match = this.tail
                this.tail = ''
                break
            case 0:
                match = ''
                break
            default:
                match = this.tail.substring(0, index)
                this.tail = this.tail.substring(index)
        }

        this.pos += match.length
        return match
    }
    /**
     * Tries to match the given regular expression at the current position.
     * Returns the matched text if it can match, the empty string otherwise.
     * @param  {RegExp} re regular expression
     * @return {String}    matched text
     */
    scan(re) {
        const match = this.tail.match(re)

        if (!match || match.index !== 0) return ''

        const text = match[0]
        this.tail = this.tail.substring(text.length)
        this.pos += text.length

        return text
    }
    charAt(index) {
        if (typeof index !== 'number' || index < 0) return null
        return this.tail.charAt(index)
    }
    getRawString() {
        return this.tail
    }
}

module.exports = Scanner
