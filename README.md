bill
=======

A set of tools for matching React Elements against CSS selectors, or easily creating new ways to match react components.
against css selectors.

`bill` is meant to be a substrate library for building more interesting and user friendly testing utilities.
It probably shouldn't be used as a standalone tool.

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

matches.length // 1
matches[0] // ReactElement{ type: 'li', props: { className: 'foo' } }
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

matches.length // 2
matches[0] // { type: List, props }
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

### Not supported

- most pseudo selectors
- non string interpolations for anything other than "tag" or prop values

## API

### `match(selector, elementOrInstance) -> array<Element|Instance>`

`bill` will match against either a plain old ReactElement in which case it will walk `props.children`,
or if you provide it with a component instance, it will match against the entire rendered tree.

__note:__ matching instances returns __private__ component instances not the normal instances you are used to
working with. This is because DOM and Stateless components do not have public instances that can be further traversed.
To get the normal instances you are used to call `.getPubliceInstance()` on each match.

```js
let matches = match('div li.foo'
  <div>
    <List>
      <li className='foo'>John</li>
      <li>Betty</li>
    </List>
  </div>
)
```

Or with a rendered instance

```js
let root = ReactDOM.render(<div>
  <List>
    <li className='foo'>John</li>
    <li>Betty</li>
  </List>
</div>, document.body)

let matches = match('div li.foo', root)

```

### `selector() -> Selector`

A function used for tagged template strings,

```js
selector`div > .foo`
```

You really only need to use the `selector` function when you want to write a selector matching exact prop values or a
composite type.


```js
selector`div > ${List}[length=${5}]`
```
