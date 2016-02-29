import React from 'react';
import { create } from '../src/compiler';
import { isTextElement } from '../src/utils';


chai.use(require('sinon-chai'))

describe('create compiler', ()=> {
  let compile, s, registerPseudo;

  beforeEach(() => {
    ({ compile, registerPseudo, selector: s } = create())
  })

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


  it('should not fail is missing id', ()=> {
    let result = compile('#foo')

    expect(() => result({
      type: 'a',
      props: {}
    })).to.not.throw()
  })

  it('should not fail id with missing props', ()=> {
    let result = compile('#foo')

    expect(() => result({
      type: 'a',
      props: null
    })).to.not.throw()
  })

  it('should match id', ()=> {
    let result = compile('#foo')

    result({
      type: 'a',
      props: {
        id: 'foo'
      }
    }).should.equal(true)
  })

  it('should not fail className with missing props', ()=> {
    let result = compile('a.foo')

    expect(() => result({
      type: 'a',
      props: null
    })).to.not.throw()
  })

  it('should not match className subsets', ()=> {
    let result = compile('a.foo-bar')

    result({
      type: 'a',
      props: {
        className: 'foo bar foo-bar-'
      }
    }).should.equal(false)

    result({
      type: 'a',
      props: {
        className: 'foo-bar'
      }
    }).should.equal(true)
  })

  it('should coerce className helpers to string', ()=> {
    let result = compile('a.foo')
    let bemHelper = () => {}
    bemHelper.toString = () => 'foo'

    result({
      type: 'a',
      props: {
        className: bemHelper
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

  it('should handle non element values', ()=> {
    registerPseudo('text', ()=> node => isTextElement(node.element))
    let result = compile(':text')

    result({}).should.equal(true)
    result('hello').should.equal(true)
    result(500).should.equal(true)
    result(/regex/).should.equal(true)
    result([1, 2, 3]).should.equal(true)
    result(new Date()).should.equal(true)
    result(true).should.equal(true)
    result(false).should.equal(false)
    result(null).should.equal(false)
  })

  it('universal selector * should include text nodes', ()=> {
    let result = compile('*')

    result('hello').should.equal(true)
    result(500).should.equal(true)
  })

  it('should match props', ()=> {
    let result = compile('[foo="5"]')

    result({
      type: 'p',
      props: {
        foo: 5
      }
    }).should.equal(true)
  })

  it('should match bool props', ()=>{
    let result = compile('[foo]')

    result({
      type: 'p',
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

    selector.match(/^sub_____\d+\.foo$/).should.be.ok
  })

  it('should create valid selector as a normal function call', ()=>{
    let List = ()=>{};
    let { selector, valueMap } = s(List, '.foo');

    ;(() => compile(selector)).should.not.throw()

    selector.match(/^sub_____\d+\.foo$/).should.be.ok
  })

  it('should create cacheable interpolated selectors', ()=>{
    let { selector: firstSelector } = s`${()=>{}}.foo[max=${new Date()}]`;
    let { selector: secondSelector } = s`${()=>{}}.foo[max=${new Date()}]`;

    firstSelector.should.equal(secondSelector)
  })

  it('should infer inner selector', (done)=> {
    let sel = s`${()=>{}}:foo([max=${new Date()}])`;

    registerPseudo('foo', innerValue => {
      expect(innerValue.selector).to.exist
      expect(innerValue.valueMap).to.exist
      Object.keys(innerValue.valueMap).length.should.equal(1)
      done()
    })

    compile(sel)
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

  it('should match inferred name', ()=>{
    let Klass = ()=>{}
    let result = compile('Klass.foo')

    result({
      type: Klass,
      props: { className: 'foo' }
    }).should.equal(true)
  })

  it('should match displayName', ()=>{
    let Klass = ()=>{}
    Klass.displayName = 'MyComponent'
    let result = compile('MyComponent.foo')

    result({
      type: Klass,
      props: { className: 'foo' }
    }).should.equal(true)
  })

  it('should match interpolated tagName', ()=>{
    let Klass = ()=>{}
    let result = compile(s`${Klass}.foo`)

    result({
      type: Klass,
      props: { className: 'foo' }
    }).should.equal(true)
  })

  // https://github.com/jquense/teaspoon/issues/14
  it('should make a case sensitive tagName comparison', ()=>{
    let result = compile('button.foo')
    let Button = ()=>{}

    result({
      type: Button,
      props: { className: 'foo' }
    }).should.equal(false)

    result({
      type: 'button',
      props: { className: 'foo' }
    }).should.equal(true)
  })
})
