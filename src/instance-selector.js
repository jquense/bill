import ReactInstanceMap from 'react/lib/ReactInstanceMap';
import { create as createCompiler, parse } from './compiler';
import {
    anyParent, directParent
  , isDomElement, isCompositeElement } from './utils';


let isDOMComponent = inst => !!(inst && inst.nodeType === 1 && inst.tagName);

let isCompositeComponent = inst => !isDOMComponent(inst) || inst === null
  || typeof inst.render === 'function' && typeof inst.setState === 'function';


export let compiler = createCompiler()

compiler.registerPseudo('has', function(compiledSelector) {
  return (_, inst) => {
    let matches = findAll(inst, compiledSelector)
    return !!matches.length
  }
})

compiler.registerPseudo('dom', isDomElement)
compiler.registerPseudo('composite', isCompositeElement)

compiler.registerNesting('any', test =>
  (element, inst, parent) => anyParent(test, element, parent))

compiler.registerNesting('>', test =>
  (element, inst, parent) => directParent(test, element, parent))


function findAll(inst, test, getParent = ()=> ({ parent: null }), excludeSelf = true) {
  let found = [];

  if (!inst || !inst.getPublicInstance)
    return found;

  let publicInst = inst.getPublicInstance()
    , element = inst._currentElement
    , parent = ()=> ({ parent: element, getParent });

  if (!excludeSelf && test(element, inst, getParent))
    found = found.concat(inst)

  if (isDOMComponent(publicInst)) {
    let renderedChildren = inst._renderedChildren || {};

    Object.keys(renderedChildren).forEach(key => {
      found = found.concat(
        findAll(renderedChildren[key], test, parent, false)
      );
    })
  }
  else if (isCompositeComponent(publicInst)) {
    found = found.concat(
      findAll(inst._renderedComponent, test, parent, false)
    );
  }

  return found;
}

/**
 * The matcher actually works on internal instances, not public ones
 * since DOM and stateless components don't have helpful public instances
 */
export function match(selector, inst, includeSelf = true) {
  let tree = inst.getPublicInstance
    ? inst //already a private instance
    : inst._reactInternalComponent //is a DOM node
      ? inst._reactInternalComponent
      : ReactInstanceMap.get(inst)

  return findAll(tree, compiler.compile(selector), undefined, !includeSelf)
}

export let { compile, compileRule, selector } = compiler
