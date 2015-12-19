import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom'
import { findAll as instanceTraverse } from '../src/instance-selector';

let renderIntoDocument = (elements) =>
  render(elements , document.createElement('div'))._reactInternalInstance

let c = fn => React.createClass({ render(){ return fn(this.props, this.context) } })

describe.only('instance tree traversal', () => {
  it('should find all text nodes', ()=> {
    let Example = c(()=> <div className="foo"><span className="bar">textme!</span></div>)
    let inst = renderIntoDocument(<Example />);

    let matches = instanceTraverse(inst, child => typeof child === 'string', true)

    matches.length.should.equal(1)
  })
})
