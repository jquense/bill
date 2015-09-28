import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import { create as createCompiler, parse } from './compiler';

let compiler = createCompiler()

compiler.registerPseudo('has', function(compiledSelector) {
  return root => {
    let matches = findAll(root, compiledSelector)
    return !!matches.length
  }
})

compiler.registerNesting('any', test => anyParent.bind(null, test))
compiler.registerNesting('>', test => directParent.bind(null, test))

export function match(selector, tree, includeSelf = true){
  return findAll(tree, compiler.compile(selector), undefined, includeSelf)
}

function findAll(root, test, getParent = ()=> ({ parent: null }), includeSelf){
  let found = [];

  if (!React.isValidElement(root))
    return found;

  let children = root.props.children

  if (React.Children.count(children) === 0)
    return found

  if (includeSelf && test(root, getParent))
    found.push(root);

  React.Children.forEach(children, child => {
    let parent = ()=> ({ parent: root, getParent });

    if (React.isValidElement(child)){
      if (test(child, parent))
        found.push(child);

      found = found.concat(findAll(child, test, parent, false))
    }
  })

  return found
}

function anyParent(test, node, parentNode){
  do {
    var { getParent, parent } = parentNode();
    node = parent
    parentNode = getParent
  } while(node && !test(node, test, getParent))

  return !!node
}

function directParent(test, node, parentNode) {
  node = parentNode().parent
  return !!(node && test(node, parentNode().getParent))
}

export let { compile, compileRule, selector } = compiler
