bill
=======

A set of tools for matching React Elements against CSS selectors.

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
matches[0] // { type: 'li', props: { className: 'foo' } }
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

- classNames
- `div[propName="hi"]` or `div[boolProp]`
- `>`: `div > .foo`
- `:has()`: `div:has(a.foo)`

### Not supported

- sibling selectors
- pseudo selectors (except for has)
- non string interpolations for anything other than "tag" or prop values
