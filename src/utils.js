
let isValidPlainElement = element => typeof element === 'object' && element != null;

export let isTextElement =
  element => !isValidPlainElement(element) && element !== false

export let isDomElement =
  element => !isTextElement(element) && typeof element.type === 'string' && element.type.toLowerCase() === element.type

export let isCompositeElement =
  element => !isTextElement(element) && typeof element.type === 'function'

export function anyParent(test, element, parentNode){
  do {
    var { getParent, parent } = parentNode();
    element = parent
    parentNode = getParent
  } while(element && !test(element, test, getParent))

  return !!element
}

export function directParent(test, element, parentNode) {
  element = parentNode().parent
  return !!(element && test(element, parentNode().getParent))
}

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
