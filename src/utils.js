import has from 'lodash/object/has';
import React from 'react';

export let isValidPlainElement =
  element => typeof element === 'object' && element != null && has(element, 'type');

export let isTextElement =
  element => !isValidPlainElement(element) && element !== false && element != null

export let isDomElement =
  element => !isTextElement(element) && typeof element.type === 'string' && element.type.toLowerCase() === element.type

export let isCompositeElement =
  element => !isTextElement(element) && typeof element.type === 'function'


export let isDOMComponent = inst => !!(inst && inst.nodeType === 1 && inst.tagName);

export let isCompositeComponent = inst => !isDOMComponent(inst) || inst === null
    || typeof inst.render === 'function' && typeof inst.setState === 'function';

export let isReactInstance = obj =>
  obj != null &&
  has(obj, '_currentElement') &&
  has(obj, '_rootNodeID');


export function legacySelector(...args){
  let strings = []
    , values = [];

  args.forEach((arg, idx) => {
    let isString = typeof arg === 'string';

    if (isString) strings.push(arg)
    else {
      if (idx === 0) strings.push('')
      values.push(arg)
    }
  })

  return [strings, values]
}

export function getAllPropertyNames(obj) {
  let proto = Object.getPrototypeOf(obj)
    , names = Object.getOwnPropertyNames(obj)

  if (proto)
    names.concat(getAllPropertyNames(proto))

  return names
}
