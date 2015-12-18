import {
    isDomElement, isCompositeElement
  , isReactInstance, isDOMComponent, isCompositeComponent } from './utils';

function anyParent(test, element, node){
  do {
    node = node.parentNode
  } while(node && !test(node.element, node))

  return !!node
}

function directParent(test, _, node) {
  node = node.parentNode
  return !!(node && test(node.element, node))
}

function anySibling(test, _, node) {
  do {
    node = node.prevSibling
  } while(node && !test(node.element, node))

  return !!node
}

function directSibling(test, _, node) {
  node = node.prevSibling
  return !!(node && test(node.element, node))
}

export default function(compiler) {
  compiler.registerPseudo('dom', ()=> isDomElement)
  compiler.registerPseudo('composite', ()=> isCompositeElement)

  compiler.registerPseudo('not', function(compiledSelector) {
    return (element, node) => {
      let matches = compiledSelector(element, node)
      return !matches
    }
  })

  compiler.registerPseudo('first-child', () =>
    (element, node) => {
      let parent = node.parentNode;
      return parent && parent.children.indexOf(node.instance || element) === 0
    })

  compiler.registerPseudo('last-child', () =>
    (element, node) => {
      let parent = node.parentNode;
      let children = parent && parent.children
      return parent && children.indexOf(node.instance || element) === (children.length - 1)
    })

  compiler.registerNesting('any', test =>
    (element, node) => anyParent(test, element, node))

  compiler.registerNesting('>', test =>
    (element, node) => directParent(test, element, node))

  compiler.registerNesting('~', test =>
    (element, node) => anySibling(test, element, node))

  compiler.registerNesting('+', test =>
    (element, node) => directSibling(test, element, node))
}
