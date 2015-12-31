bill
=======

Sort of like [Sizzle](https://github.com/jquery/sizzle/tree/master#sizzle) for React, `bill` is
A set of tools for matching React Element and Component trees against CSS selectors. `bill` is meant to be a
substrate library for building more interesting and user friendly testing utilities. It probably shouldn't
be used as a standalone tool.

```js
import { match } from 'bill';

let matches = match('div li.foo'
  <div>
    <List>
      <li className='foo'>John</li>
      <li>Betty</li>
    </List>
  </div>
)

matches.length     // 1
matches[0].element // ReactElement{ type: 'li', props: { className: 'foo' } }
```

For selecting non string values, like custom Component types, we can use a [tagged template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings)

```js
import { match, selector as s } from 'bill';

let min = 5;

let matches = match(s`div > ${List}, li[min=${min}]`
  <div>
    <List>
      <li min={min}>John</li>
      <li>Betty</li>
    </List>
  </div>
)

matches.length     // 2
matches[0].element // { type: List, props }
```

### Supported

- classes: `.foo`
- attributes: `div[propName="hi"]` or `div[boolProp]`
- `>`: direct descendent `div > .foo`
- `+`: adjacent sibling selector
- `~`: general sibling selector
- `:has()`: parent selector `div:has(a.foo)`
- `:not()`: negation
- `:first-child`
- `:last-child`
- `:text` matches "text" (renderable) nodes, which may be a non string value (like a number)
- `:dom` matches only DOM components
- `:composite` matches composite (user defined) components

### Not supported

- other pseudo selectors
- non string interpolations for anything other than "tag" or prop values

## API

### `match(selector, elementOrInstance) -> array<Node>`

`match()` traverses a react element or instance tree searching for nodes that match the provided selector. The
return value is an __array of Nodes__. A "node" is a light object abstraction over both instances and elements
that allow for a common matching and traversal API between the distinct types of React objects.

```js
let matches;
let elements = (
  <div>
    <List>
      <li className='foo'>John</li>
      <li>Betty</li>
    </List>
  </div>
)

// find elements in the above element description
matches = match('div li.foo', elements)

// "John"
let textContent = matches.reduce(
  (str, node) => str + node.element.props.children, '')

// or search a rendered hierarchy
matches = match('div li.foo', ReactDOM.render(elements))

let domNodes = matches.map(
  node => ReactDOM.findDOMNode(node.instance))
```

Nodes wrap either an instance or element and provide a few helpful properties and methods similar to a traditional DOM
node:

```js
object Node {
  nodeType: NODE_TYPE,
  element: ReactElement,
  instance: ReactComponent|HTMLElement,
  privateInstance: ReactPrivateInstance,
  nextSibling: Node,
  prevSibling: Node,
  parentNode: Node,
  children: array<Node>,
  findAll(testFn, includeSelf) -> array<Node>
}
```

Their is a slight caveat to the the `publicInstance` property, when it comes to stateless functional components. Instead
of returning `null` as React would, `bill` returns the instance of the internal wrapper component. This is to allow,
potential chaining and also retrieval of the underlying DOM node if necessary (as in the example above).

__Note:__ Nodes only have instances when matching against a _rendered_ component tree


### `matchKind(selector, elementOrInstance) -> array<Element>|array<Instance>`

`matchKind` is a convenience method works just like `match` except instead of returning Nodes,
it returns the instances or elements depending on what type of tree you are matching against.

```js
let matches;
let elements = (
  <div>
    <List>
      <li className='foo'>John</li>
      <li>Betty</li>
    </List>
  </div>
)

matches = match('div li.foo', elements)

// "John"
let textContent = matches.reduce((str, element) => str + element.props.children, '')

// or search a rendered hierarchy
matches = match('div li.foo', ReactDOM.render(elements))

let domNodes = matches.map(
  instance => ReactDOM.findDOMNode(instance))
```

### `selector() -> Selector`

A function used for tagged template strings,

You really only need to use the `selector` function when you want to write a selector matching exact prop values or a
composite type.

```js
selector`div > ${List}[length=${5}]`
```

### findAll(tree, testFunction, [includeSelf = true]) -> Array<Node>

A tree traversal utility function for finding nodes that return `true` from the `testFunction`. findAll
is similar to `ReactTestUtils.findAllInRenderedTree`, but more robust and works on both elements and instance trees.

```js
import { findAll, NODE_TYPES } from 'bill';

let found = findAll(elements, function (node) {
  return node.nodeType === NODE_TYPES.COMPOSITE
})
```

### registerPseudo(pseudoSelector, isSelector=true, testFunction)

Registers a new pseudo selector with the compiler. The second parameter is a function that will be called
with the compiled inner selector of the pseudo selector (if it exists) and should return a __new__ function that
tests an element or node. The second `isSelector` argument indicates that the inner text of the pseudoSelector
(as in `'foo'` in `:has(.foo)`) is itself a selector that needs to be compiled into a function.

```js
// A simple `:disabled` pseudo selector
bill.registerPseudo('disabled', false, function() {
  return (node) => node.nodeType !== NODE_TYPES.TEXT
    && node.element.props.disabled === true
})

// We want to test if an element has a sibling that matches
// a selector e.g. :nextSibling(.foo)
bill.registerPseudo('nextSibling', function (compiledInnerSelector) {
  return function (node) {
    node = node.nextSibling
    return !!node && compiledInnerSelector(node)
  }
})

let matches = bill.match('li:nextSibling(li.baz)',
  <ul>
    <li className='foo'>1</li>
    <li className='bar'>2</li>
    <li className='baz'>3</li>
  </ul>
)

matches[0].instance // <li class='bar'>2</li>
```

### registerNesting(nestingCombinator, testFunction)

Similar to `registerPseudo` you can also register new combinator selectors (\*, >, ~, +) using the same pattern.

__Note:__ remember that selectors are matched _right-to-left_ so the logic is generally reversed from what you
might expect.

```js
// lets implement the same previous sibling selector as above
// but with a nesting selector.

bill.registerNesting('!', test => node => {
  node = node.nextSibling
  return !!(node && test(node))
})

let matches = bill.match('li.baz ! li',
  <ul>
    <li className='foo'>1</li>
    <li className='bar'>2</li>
    <li className='baz'>3</li>
  </ul>
)

matches[0].instance // <li class='bar'>2</li>
```


### `NODE_TYPES` Object

Set of constants that correspond to Node.nodeType. Useful for filtering out types of nodes while traversing a tree.

- `NODE_TYPES.COMPOSITE`
- `NODE_TYPES.DOM`
- `NODE_TYPES.TEXT`

### `isNode() -> boolean`

Determine if an object is a Node object.
