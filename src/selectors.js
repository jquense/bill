import { isReactInstance, isDOMComponent, isCompositeComponent } from './utils';
import { NODE_TYPES } from './node';

export default function(compiler) {

  Object.keys(NODE_TYPES).forEach(type => {
    compiler.registerPseudo(type.toLowerCase(),
      ()=> node => node.nodeType === NODE_TYPES[type])
  })

  compiler.registerPseudo('has', (selector) => {
    let test = compiler.compile(selector);
    return node => {
      let matches = node.findAll(test)
      return !!matches.length
    }
  })

  compiler.registerPseudo('not', (selector) => {
    let test = compiler.compile(selector);
    return node => {
      let matches = test(node)
      return !matches
    }
  })

  compiler.registerPseudo('first-child', () => node => {
    let parent = node.parentNode;
    return parent && parent.children.indexOf(node) === 0
  })

  compiler.registerPseudo('last-child', () => node => {
    let parent = node.parentNode;
    let children = parent && parent.children
    return parent && children.indexOf(node) === (children.length - 1)
  })

  compiler.registerNesting('any', test => node => {
    do {
      node = node.parentNode
    } while(node && !test(node))

    return !!node
  })

  compiler.registerNesting('>', test => node => {
    node = node.parentNode
    return !!(node && test(node))
  })

  compiler.registerNesting('~', test => node => {
    do {
      node = node.prevSibling
    } while(node && !test(node))

    return !!node
  })

  compiler.registerNesting('+', test => node => {
    node = node.prevSibling
    return !!(node && test(node))
  })
}
