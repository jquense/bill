bill
=======

Sort of like [Sizzle](https://github.com/jquery/sizzle/tree/master#sizzle) for React, `bill` is
a set of tools for matching React Element and Component trees against CSS selectors. `bill` is meant to be a
substrate library for building more interesting and user friendly testing utilities. It probably shouldn't
be used as a standalone tool.

```js
import { querySelectorAll } from 'bill';

let matches = querySelectorAll('div li.foo',
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

For selecting non string values, like custom Component types, you can use a [tagged template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings)

```js
import { querySelectorAll, selector as s } from 'bill';

let min = 5;

let matches = querySelectorAll(s`div > ${List}, li[min=${min}]`,
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

### React Compatibility

> WARNING: mising module 'react/lib/ReactDOMComponentTree'

bill supports the latest React and back to v0.13.0, because a library like this involves the use of private API's, maintaining support across major versions of React is _harder_ than normal. In particular we need to do dynamic requires to internal apis, which makes bundlers like Webpack warning about missing modules, and bundling with a less smart bundler hard.

Don't worry though they are missing because the version of React you are using doesn't have them, and thats ok, bill knows how to
do its work on each supported version.

### Supported

- id: `#foo`
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

#### Node

Nodes are a light object abstraction over both instances and elements that allow for a common
matching and traversal API between the distinct types of React objects.
The interface is similar to a traditional DOM node.

Most `bill` methods that accept elements or instances will also accept a node,
allowing you to use the return values of the methods directly with other methods.

```js
Node : {
  nodeType: NODE_TYPE,
  element: ReactElement,
  instance: ReactComponent | HTMLElement,
  privateInstance: ReactPrivateInstance,
  nextSibling: Node,
  prevSibling: Node,
  parentNode: Node,
  children: Array<Node>,
  findAll: (test (node) => bool, includeSelf? : bool) => array<Node>
}
```

Their is a caveat to the `publicInstance` property, when it comes to stateless functional components. Instead
of returning `null` as React would, `bill` returns the instance of the internal wrapper component. This is to allow,
potential chaining and also retrieval of the underlying DOM node if necessary (as in the example above).

__Note:__ Nodes only have instances when matching against a _rendered_ component tree

#### `querySelectorAll(selector, subject: Element|Instance|Node) -> Array<Node>`

`querySelectorAll()` traverses a react element or instance tree searching for nodes that match the provided selector.
As the name suggests it's analogous to `document.querySelectorAll`. The return value
is an __array of Nodes__.

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
matches = bill.querySelectorAll('div li.foo', elements)

// "John"
let textContent = matches.reduce(
  (str, node) => str + node.element.props.children, '')

// or search a rendered hierarchy
matches = bill.querySelectorAll('div li.foo', ReactDOM.render(elements))

let domNodes = matches.map(
  node => ReactDOM.findDOMNode(node.instance))
```

#### `matches(selector, subject: Element|Instance|Node) -> bool`

Analogous to the DOM `element.matches` method, `matches` returns true if a give element, instance or node is matched
by the provided `selector`.

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

let johnItem = bill
  .querySelectorAll('div li', elements)
  .filter(node => bill.matches('.foo', node))


// or search a rendered hierarchy
let bettyItem = bill
  .querySelectorAll('div li.foo', ReactDOM.render(elements))
  .filter(node => bill.matches(':not(.foo)', node))
```

#### `selector() -> Selector`

A function used for tagged template strings,

You really only need to use the `selector` function when you want to write a selector matching exact prop values or a
composite type.

```js
selector`div > ${List}[length=${5}]`
```

#### findAll(subject: Element|Instance|Node, test: (node: Node)=> bool, includeSelf? : bool) -> Array<Node>

A tree traversal utility function for finding nodes that return `true` from the `testFunction`. findAll
is similar to `ReactTestUtils.findAllInRenderedTree`, but more robust and works on both elements and instance trees.

```js
import { findAll, NODE_TYPES } from 'bill';

let found = findAll(elements, function (node) {
  return node.nodeType === NODE_TYPES.COMPOSITE
})
```

#### compile(selector) => (node: Node) => bool

Compiles a selector string into a function that matches nodes.

#### registerPseudo(pseudoSelector, handlePseudo: (selector) => (node: Node) => bool)

Registers a new pseudo selector with the compiler. The second parameter is a function that will be called
with the pseudo selector's argument (if it exists). The handler function should return a function that matches
a node.

```js
// A simple `:text(foo)` pseudo selector
bill.registerPseudo('text', function(value) {
  return function (node) {
    return node.children
      .filter(n => n.nodeType === NODE_TYPES.TEXT)
      .every(node => node.element === value)
  }
})

let matches = bill.querySelectorAll('li:text(john)',
  <ul>
    <li>betsy</li>
    <li>john</li>
    <li>yolanda</li>
  </ul>
)

matches[0].instance // <li class='bar'>john</li>
```

For pseudoSelectors whose inner argument is a selector, you can compile it
to a test function with `bill.compile`.

```js
// We want to test if an element has a sibling that matches
// a selector e.g. :nextSibling(.foo)
bill.registerPseudo('nextSibling', function (selector) {
  let matcher = bill.compile(selector);
  return function (node) {
    node = node.nextSibling
    return !!node && matcher(node)
  }
})

let matches = bill.querySelectorAll('li:nextSibling(li.baz)',
  <ul>
    <li className='foo'>1</li>
    <li className='bar'>2</li>
    <li className='baz'>3</li>
  </ul>
)

matches[0].instance // <li class='bar'>2</li>
```

#### registerNesting(nestingCombinator, handleNesting: (matcher: function) => (node: Node) => bool)

Similar to `registerPseudo` you can also register new combinator selectors (\*, >, ~, +) using the same pattern.
The handler function is called with the _compiled_ selector segment.

__Note:__ remember that selectors are matched _right-to-left_ so the logic is generally reversed from what you
might expect.

```js
// lets implement the same previous sibling selector as above
// but with a nesting selector.
bill.registerNesting('!', test => node => {
  node = node.nextSibling
  return !!(node && test(node))
})

let matches = bill.querySelectorAll('li.baz ! li',
  <ul>
    <li className='foo'>1</li>
    <li className='bar'>2</li>
    <li className='baz'>3</li>
  </ul>
)

matches[0].instance // <li class='bar'>2</li>
```


#### `NODE_TYPES` Object

Set of constants that correspond to `Node.nodeType`. Useful for filtering out types of nodes while traversing a tree.

- `NODE_TYPES.COMPOSITE`
- `NODE_TYPES.DOM`
- `NODE_TYPES.TEXT`

#### `isNode() -> boolean`

Determine if an object is a Node object.
