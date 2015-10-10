import React from 'react';
import { create } from '../src/compiler';

let { compile, selector: s } = create()

chai.use(require('sinon-chai'))

describe('create compiler', ()=> {

  it('should return a function', ()=>{
    let result = compile('a.foo')

    result.should.be.a('function')
  })

  it('should match object', ()=>{
    let result = compile('a.foo')

    result({
      type: 'a',
      props: {
        className: 'foo bar'
      }
    }).should.equal(true)
  })

  it('should fail when not a match', ()=>{
    let result = compile('a.foo')

    result({
      type: 'div',
      props: {
        className: 'foo bar'
      }
    }).should.equal(false)
  })

  it('should match props', ()=>{
    let result = compile('[foo="5"]')

    result({
      props: {
        foo: 5
      }
    }).should.equal(true)
  })

  it('should match bool props', ()=>{
    let result = compile('[foo]')

    result({
      props: {
        foo: true
      }
    }).should.equal(true)
  })

  it('should match multiple selectors', ()=>{
    let result = compile('[foo], div')

    result({
      type: 'div',
      props: {
        foo: false
      }
    }).should.equal(true)
  })

  it('should fail when multiple selectors do not match', ()=>{
    let result = compile('[foo], div')

    result({
      type: 'a',
      props: {
        foo: false
      }
    }).should.equal(false)
  })

  it('should return a selector function', ()=>{
    s.should.be.a('function')
  })

  it('should accept a selector template result', ()=>{
    let result = compile(s`a[foo=${false}]`)

    result({
      type: 'a',
      props: {
        foo: false
      }
    }).should.equal(true)
  })

  it('should create valid selector with substitutions', ()=>{
    let List = ()=>{};
    let { selector, valueMap } = s`${List}.foo`;

    ;(() => compile(selector)).should.not.throw()

    selector.match(/^sub_____\d\.foo$/).should.be.ok
  })

  it('should use == on non interpolated values', ()=>{
    let result = compile(s`a[foo=false]`)

    result({
      type: 'a',
      props: {
        foo: 'false'
      }
    }).should.equal(true)
  })

  it('should use === on  interpolated values', ()=>{
    let result = compile(s`a[foo=${false}]`)

    result({ type: 'a', props: { foo: 'false'} }).should.equal(false)

    result({ type: 'a', props: { foo: false } }).should.equal(true)
  })

  it('should match interpolated tagName', ()=>{
    let Klass = ()=>{}
    let result = compile(s`${Klass}.foo`)

    result({
      type: Klass,
      props: { className: 'foo' }
    }).should.equal(true)
  })
})
