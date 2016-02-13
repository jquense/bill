import React from 'react';
import createFragment from 'react-addons-create-fragment';
import { render, unmountComponentAtNode } from 'react-dom'
import { findAll, eachChild, createNode } from '../src/node';
import { List, Map as IMap } from 'immutable';

let unwrapComposite = inst => inst._renderedComponent;
let renderIntoDocument = (elements, unwrap) => {
  let inst = render(elements , document.createElement('div'))._reactInternalInstance
  return unwrap ? unwrapComposite(inst) : inst
}

let renderAndReturnTree = element => findAll(renderIntoDocument(element), () => true, true);

let c = fn => React.createClass({ render(){ return fn(this.props, this.context) } })

describe('Node Objects', ()=> {

  it('should return the public instance of a Composite component', () => {
    let Example = c(() => <span />)
    let [root] = renderAndReturnTree(<Example name='foo' />)

    root.instance.should.exist
    root.instance.props.name.should.equal('foo')
  })

  it('should return the public instance of a DOM Component', () => {
    let Example = c(() => <span />)
    let [_, span] = renderAndReturnTree(<Example name='foo' />)

    span.instance.should.exist
    span.instance.tagName.should.equal('SPAN')
  })

  it('should return the semi-public instance of a Functional Component', () => {
    let Empty = ()=> <span />
    let Example = c(() => <Empty name='foo' />)
    let [_, empty] = renderAndReturnTree(<Example />)

    empty.instance.should.exist
    empty.instance.props.name.should.equal('foo')
  })

  describe('dynamic changes in the tree', () => {
    class Dynamic extends React.Component {
      constructor(props) {
        super(props);
        this.state = { show: false };
        this.show = () => this.setState({ show: true })
        this.hide = () => this.setState({ show: false })
      }
      render() {
        return (
          <div>
            <div>foo</div>
            {this.state.show && <p>hi</p>}
          </div>
        );
      }
    }

    it('should update children when component changes', () => {
      let instance = render(<Dynamic />, document.createElement('div'))
      let node = createNode(instance)
        , div = node.children[0]

      let firstChildren = div.children;

      firstChildren.should.have.lengthOf(1)
      firstChildren.should.equal(div.children)

      instance.show()

      div = node.children[0]

      firstChildren.should.equal(div.children)
      div.children.should.have.lengthOf(2)
    })

    it('should null stale nodes', () => {
      let instance = render(<Dynamic />, document.createElement('div'))

      instance.show()

      let node = createNode(instance)
        , children = node.children[0].children

      instance.hide()

      expect(children[1].instance).to.not.exist
      expect(children[1].privateInstance).to.not.exist
    })
  })
})

describe('child traversal', ()=> {
  it('should iterate over instance children', () => {
    let Example = c(()=> (
      <div>
        text node
        { 500 }
        { true }
        { false }
        <span />
        <div />
      </div>
    ))

    let count = 0;
    eachChild(renderIntoDocument(<Example />, true), ()=> count++ )

    count.should.equal(4)
  })

  it('should iterate over element children', () => {
    let elements = (
      <div>
        text node
        { 500 }
        { false }
        <span />
        <div />
      </div>
    )

    let count = 0;
    eachChild(elements, ()=> count++)

    count.should.equal(4)
  })

  it('it should not iterate over non elements or instances', () => {
    eachChild([1,2,3], ()=> { throw new Error('should not have anything to iterate over')})
    eachChild({ type: 'a', children: [] }, ()=> { throw new Error('should not have anything to iterate over')})
  })
})

describe('instance tree traversal', () => {
  it('should find all text nodes', ()=> {
    let Example = c(()=> <div className="foo"><span className="bar">textme!</span></div>)
    let inst = renderIntoDocument(<Example />);

    let matches = findAll(inst, ({ element }) => typeof element === 'string', true)

    matches.length.should.equal(1)
  })

  it('should report Empty Components but not their root `null` element', ()=> {
    let Empty = ()=> <span />
    let Example = c(()=>
      <div className="foo">
        <Empty />
        <span className="bar">textme!</span>
      </div>
    )
    let inst = renderIntoDocument(<Example />);

    let matches = findAll(inst, ({ element }) => {
      if (element === null)
        throw new Error('should not report null elements')
      return element && element.type === Empty
    })

    matches.length.should.equal(1)
  })

  describe('DOM nodes with single child node', ()=>{
    let Example = c(({ text })=> <div className="foo">{text}</div>)

    describe('children that are not rendered components', () => {
      [
        ['strings', 'foo', ({ element }) => typeof element === 'string'],
        ['numbers', 9000, ({ element }) => typeof element === 'number'],
        ['`NaN`', NaN, ({ element }) => element !== element],
      ].forEach(([type, value, test]) => {

        it(`should report: ${type}`, () => {
          let inst = renderIntoDocument(<Example text={value} />);

          findAll(inst, test, true)
            .length.should.equal(1)
        })
      })
    })

    describe('children that are rendered "components"', () => {
      [
        ['arrays', [<span key='0'/>, 'hello'],
            ({ element: c }) => Array.isArray(c)],
        ['booleans: true', false,
            ({ element: c }) => c === true ],
        ['booleans: false', false,
            ({ element: c }) => c === false ],
        ['fragments', createFragment({ 0: <span />, 1: 'hello' }),
            ({ element: c }) => !c.type && typeof c === 'object'],
        ['iterables: Immutable List', List.of(<span key='0'/>, 'hello'),
            ({ element: c }) => List.isList(c)],
        ['iterables: Immutable Map',  new IMap({ 0: <span />, 1: 'hello' }),
            ({ element: c }) => IMap.isMap(c)]
      ].forEach(([type, value, test]) => {

        it(`should not report: ${type}`, () => {
          let inst = renderIntoDocument(<Example text={value} />);

          findAll(inst, test, true)
            .length.should.equal(0)
        })
      })
    })
  })
})
