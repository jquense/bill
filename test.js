import React from 'react';
import { _parser, compile, match, selector as s } from './src/select';

chai.use(require('sinon-chai'))

describe('Element Selecting', ()=> {

  describe('compiling selectors', ()=> {

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

    it('should match nested', ()=>{
      match('div a.foo',
        <div>
         <span>
           <a className='foo'/>
         </span>
         <a className='foo'/>
        </div>
      ).length.should.equal(2)
    })

    it('should work with :has()', ()=> {
      match('div:has(a.foo, a[show])',
        <div>
          <span>
            <a show />
          </span>
          <a className='foo'/>
        </div>
      ).length.should.equal(1)
    })

    it('should match nested attributes', ()=>{
      match('div a.foo[show]',
        <div>
          <span>
            <a className='foo' show/>
          </span>
          <a className='foo'/>
        </div>
      ).length.should.equal(1)
    })

    it('should match direct descendents', ()=>{
      match('div > a.foo',
        <div>
          <span>
            <a className='foo' show/>
          </span>
          <a className='foo'/>
        </div>
      ).length.should.equal(1)
    })

    it('should create valid selector with substitutions', ()=>{
      let List = ()=>{};
      let { selector, valueMap } = s`div ${List}.foo`;

      ;(() => compile(selector)).should.not.throw()

      selector.match(/^div sub_____\d\.foo$/).should.be.ok
    })

    it('should use primitive value instead of placeholder', ()=>{
      let List = 'span';
      let { selector, valueMap } = s`div ${List}.foo`;

      selector.should.equal('div span.foo')
      expect(valueMap.span).to.not.exist

      ;({ selector, valueMap } = s`div ${5}.foo`);

      selector.should.equal('div 5.foo')
      expect(valueMap['5']).to.not.exist
    })

    it('should match with tag substitions', ()=>{
      let List = ()=> <div/>;

      match(s`div ${List}.foo`,
        <div>
          <span>
            <a className='foo' show />
          </span>
          <List className='foo'/>
        </div>
      ).length.should.equal(1)
    })

    it('should match with nested tag substitutions', ()=>{
      let List = ()=> <div/>;

      match(s`${List}.foo > span`,
        <div>
          <List className='foo'>
            <span/>
          </List>
        </div>
      ).length.should.equal(1)
    })

    it('should match with prop value substitutions', ()=>{
      let date = new Date();

      match(s`div[date=${date}].foo`,
        <div className='foo' date={date}>
          <span>
            <a className='foo' date={date}/>
          </span>
        </div>
      ).length.should.equal(1)
    })
  })
})
