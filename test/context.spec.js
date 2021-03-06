const should = require('should')
const Context = require('../lib/context')

describe('sugar-template#Context', function() {
    const data = {
        user: {
            name: 'ABC',
            age: 20
        },
        id: 0
    }
    const ctx = new Context(data)
    it('`lookup` should get value correctly!', function() {
        ctx.lookup('.').should.deepEqual(data)
        ctx.lookup('this').should.deepEqual(data)
        ctx.lookup('user.name').should.be.exactly('ABC')
        ctx.lookup('id').should.be.exactly(0)
        should(ctx.lookup('user.xyz')).be.exactly(undefined)
        should(ctx.lookup('user.xyz.abc')).be.exactly(undefined)
    })
    it('`lookup` should get value correctly when specify dot!', function() {
        const ctx2 = new Context(data, null, null, null)
        should(ctx2.lookup('.')).be.exactly(null)
        should(ctx2.lookup('this')).be.exactly(null)
        ctx2.lookup('user.name').should.be.exactly('ABC')
        ctx2.lookup('id').should.be.exactly(0)
        should(ctx2.lookup('user.xyz')).be.exactly(undefined)
        should(ctx2.lookup('user.xyz.abc')).be.exactly(undefined)
        const ctx3 = new Context(data, null, null, data.user)
        ctx3.lookup('.').should.be.exactly(data.user)
        ctx3.lookup('this').should.be.exactly(data.user)
    })
    it('`push` should gen sub context correctly!', function() {
        const subData = {
            id: 1
        }
        const subContext = ctx.push(subData)
        subContext.lookup('.').should.deepEqual(subData)
        subContext.lookup('this').should.deepEqual(subData)
        subContext.lookup('id').should.be.exactly(1)
        subContext.lookup('user.name').should.be.exactly('ABC')
        should(subContext.lookup('user.xyz')).be.exactly(undefined)
    })
    it('addtionalData should work correctly!', function() {
        const addtionalData = {
            index: 10
        }
        const ctx2 = new Context(data, null, addtionalData)
        ctx2.lookup('.').should.deepEqual(data)
        ctx2.lookup('this').should.deepEqual(data)
        ctx2.lookup('$index').should.be.exactly(10)
    })
    it('should not throw when data is null!', function() {
        const addtionalData = {
            index: 10
        }
        const ctx2 = new Context(null, null, addtionalData)
        should(ctx2.lookup('.')).be.exactly(null)
        should(ctx2.lookup('this')).be.exactly(null)
        ctx2.lookup('$index').should.be.exactly(10)
    })
})
