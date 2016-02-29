import React from 'react';
import { render } from './helpers'
import * as bill from '../src';

let { querySelectorAll: qsa, isNode } = bill;

let renderIntoDocument = (elements) =>
  render(elements , document.createElement('div'))

let c = fn => React.createClass({ render(){ return fn(this.props, this.context) } })

describe('Main exports', () => {

  it('should match and return return nodes', ()=> {
    let Example = c(()=> <div className="foo"><span className="bar">textme!</span></div>)
    let inst = renderIntoDocument(<Example />);

    qsa('span.bar', inst)
      .every(isNode)
      .should.equal(true)
  })

  it('should export compile methods', ()=> {
    bill.should.contain.keys([
      'selector', 'compile', 'registerPseudo', 'registerNesting'
    ])
  })

  it('should registerPseudo selector', ()=> {
    bill.registerPseudo('nextSibling', (selector) => {
      let test = bill.compile(selector);

      return (node) => {
        node = node.nextSibling
        return !!node && test(node)
      }
    })

    let matches = qsa('li:nextSibling(li.baz)',
      <ul>
        <li className='foo'>1</li>
        <li className='bar'>2</li>
        <li className='baz'>3</li>
      </ul>
    )

    matches[0].element.props.children.should.equal('2')
  })

  it('should registerPseudo', ()=> {
    bill.registerPseudo('test', text => () => {
      expect(text).to.equal('foo')
    })

    qsa('li:test(foo)', <li className='foo'>foo</li>)
  })

  it('should registerNesting', ()=> {
    bill.registerNesting('!', test => node => {
      node = node.nextSibling
      return !!(node && test(node))
    })

    let matches = qsa('li.baz ! li',
      <ul>
        <li className='foo'>1</li>
        <li className='bar'>2</li>
        <li className='baz'>3</li>
      </ul>
    )

    matches[0].element.props.children.should.equal('2')
  })
})
