import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import { create as createCompiler, parse } from './compiler';
import { anyParent, directParent, isDomElement, isCompositeElement } from './utils';

export let compiler = createCompiler()

compiler.registerPseudo('has', function(compiledSelector) {
  return root => {
    let matches = findAll(root, compiledSelector)
    return !!matches.length
  }
})

compiler.registerPseudo('dom', isDomElement)
compiler.registerPseudo('composite', isCompositeElement)


compiler.registerNesting('any', test => anyParent.bind(null, test))

compiler.registerNesting('>', test => directParent.bind(null, test))

export function match(selector, tree, includeSelf = true){
  return findAll(tree, compiler.compile(selector), includeSelf)
}

function findAll(root, test, includeSelf, getParent = ()=> ({ parent: null })) {
  let found = [];

  if (!React.isValidElement(root))
    return found;

  let children = root.props.children

  if (includeSelf && test(root, getParent))
    found.push(root);

  if (React.Children.count(children) === 0)
    return found

  React.Children.forEach(children, child => {
    let parent = ()=> ({ parent: root, getParent });

    if (React.isValidElement(child)){
      if (test(child, parent))
        found.push(child);

      found = found.concat(findAll(child, test, false, parent))
    }
  })

  return found
}
