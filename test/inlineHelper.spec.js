const should = require('should') // eslint-disable-line
const sugar = require('../')

describe('sugar-template#inlineHelper', function() {
    it('should parse `js` helper and generate code successfully!', function() {
        let text = sugar.render(`{{js "/js/x.js"}}`)
        text.should.be.exactly('<script src="/js/x.js"></script>')

        // path from data
        text = sugar.render(`{{js path}}`, {
            path: '/js/x.js'
        })
        text.should.be.exactly('<script src="/js/x.js"></script>')

        // string has spaces
        text = sugar.render(`{{js "/js /x.js"}}`)
        text.should.be.exactly('<script src="/js /x.js"></script>')

        // string has quotes
        text = sugar.render(`{{js "/js"/x.js"}}`)
        text.should.be.exactly('<script src="/js"/x.js"></script>')

        // string can be spaces
        text = sugar.render(`{{js " "}}`, {})
        text.should.be.exactly('<script src=" "></script>')
    })
    it('should parse `css` helper and generate code successfully!', function() {
        let text = sugar.render(`{{css "/css/x.css"}}`)
        text.should.be.exactly('<link rel="stylesheet" href="/css/x.css">')

        // path from data
        text = sugar.render(`{{css path}}`, {
            path: '/css/x.css'
        })
        text.should.be.exactly('<link rel="stylesheet" href="/css/x.css">')

        // string has spaces
        text = sugar.render(`{{css "/css /x.css"}}`)
        text.should.be.exactly('<link rel="stylesheet" href="/css /x.css">')

        // string has quotes
        text = sugar.render(`{{css "/css"/x.css"}}`)
        text.should.be.exactly('<link rel="stylesheet" href="/css"/x.css">')

        // string can be spaces
        text = sugar.render(`{{css " "}}`, {})
        text.should.be.exactly('<link rel="stylesheet" href=" ">')
    })
    it('should parse `img` helper and generate code successfully!', function() {
        let text = sugar.render(`{{img "/img/x.img"}}`)
        text.should.be.exactly('<img src="/img/x.img" alt=""/>')

        // path from data
        text = sugar.render(`{{img path alt="image"}}`, {
            path: '/img/x.img'
        })
        text.should.be.exactly('<img src="/img/x.img" alt="image"/>')

        // string has spaces
        text = sugar.render(`{{img "/img /x.img"}}`)
        text.should.be.exactly('<img src="/img /x.img" alt=""/>')

        // string has quotes
        text = sugar.render(`{{img "/img"/x.img"}}`)
        text.should.be.exactly('<img src="/img"/x.img" alt=""/>')

        // string can be spaces
        text = sugar.render(`{{img " "}}`, {})
        text.should.be.exactly('<img src=" " alt=""/>')
    })
})
