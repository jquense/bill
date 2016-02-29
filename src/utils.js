import has from 'lodash/object/has';
import React from 'react';

let isPrimitive = value => {
  let typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1
}

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


export function createSelector(prefix) {
  return selector;

  function selector(strings, ...values) {
    if (!Array.isArray(strings))
      [ strings, values ] = legacySelector.apply(null, [strings].concat(values));

    let valueMap = Object.create(null);

    let selector = strings.reduce((rslt, string, idx) => {
      let noValue = idx >= values.length
        , value = values[idx]
        , strValue = '' + value;

      if (!noValue && !isPrimitive(value))
        valueMap[strValue = (prefix + idx)] = value;

      return rslt + string + (noValue ? '' : strValue)
    }, '')

    return { selector, valueMap }
  }
}

function legacySelector(...args){
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
