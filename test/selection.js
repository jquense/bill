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
      querySelectorAll(selector, root){
        return bill.querySelectorAll(selector, render(root, mountPoint))
      },

      beforeEach(){
        mountPoint = document.createElement('div')
      }
    }
  };

  each(types, (details, key) => {
    let { querySelectorAll: match, selector: s } = details;

    let isInstanceTest = key === 'instance';

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

      it(':has()', ()=> {
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

      it(':not()', ()=> {
        match('a:not(.foo)',
          <div>
            <span>
              {'More text Nodes'}
              <a show />
            </span>
            <a className='foo'/>
          </div>
        ).length.should.equal(1)
      })

      it(':first-child', ()=> {
        match(':first-child',
          <div>
            <span><p /></span>
            <a />
          </div>
        ).length.should.equal(2)
      })

      it(':last-child', ()=> {
        match(':last-child',
          <div>
            <span><p /></span>
            <a /><p/>
          </div>
        ).length.should.equal(2)
      })

      it(':text', ()=> {
        let Composite = ()=> <span />
        match(':text',
          <div>
            { 9000 }
            <Composite><p /></Composite>
            <section >some text</section>
          </div>
        ).length.should.equal(2)
      })

      it(':dom', ()=> {
        let Composite = ()=> <span />
        match(':dom',
          <div>
            <Composite><p /></Composite>
            <section >some text</section>
          </div>
        ).length.should.equal(3)
      })

      it(':composite', ()=> {
        let Composite = ()=> <span />
        match(':composite',
          <div>
            <Composite><p /></Composite>
            <section >some text</section>
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

      it('should match Adjacent siblings', ()=>{
        match('a.foo + span',
          <div>
            <a className='foo'/>
            <span>
              <a className='foo' show/>
            </span>
          </div>
        ).length.should.equal(1)
      })

      it('should match general siblings', ()=>{
        match('a.foo ~ span',
          <div>
            <a className='foo'/>
            <div />
            <span>
              <a className='foo' show/>
            </span>
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
        let Empty = React.createClass({ render(){ return null } })

        match(s`${List}.foo > span`,
          <div>
            <Empty/>
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
