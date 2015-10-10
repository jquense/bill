import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom'
import bill from '../src/index';
import each from 'lodash/collection/each';

describe('Selecting', ()=> {
  let mountPoint;

  let types = {
    element: bill,
    instance: {
      ...bill,
      match(selector, root){
        return bill.match(selector, render(root, mountPoint))
      },

      beforeEach(){
        mountPoint = document.createElement('div')
      }
    }
  };

  each(types, (details, key) => {
    let { match, selector: s } = details;

    describe(key, ()=> {

      details.beforeEach &&
        beforeEach(details.beforeEach)

      details.afterEach &&
        beforeEach(details.afterEach)

      it('should match nested', ()=>{
        match('div a.foo',
          <div>
            <span>Hello there</span>
            <span>
              {'More text Nodes'}
              <a className='foo'>single text node</a>
            </span>
            <a className='foo'/>
          </div>
        ).length.should.equal(2)
      })

      it('should work with :has()', ()=> {
        match('div:has(a.foo, a[show])',
          <div>
            <span>
              {'More text Nodes'}
              <a show />
            </span>
            <a className='foo'/>
          </div>
        ).length.should.equal(1)
      })

      it('should match nested attributes', ()=>{
        match('div a.foo[show]',
          <div>
            text node!
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
        let List = ({ children })=> children;

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


})
