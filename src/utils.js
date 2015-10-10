
export let isTextElement =
  element => typeof element === 'string'

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
