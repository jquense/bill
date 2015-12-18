import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import { create as createCompiler, parse } from './compiler';
import common from './common';
import { createNode, eachChild } from './node';
import { anyParent, directParent, isDomElement, isCompositeElement } from './utils';

export let compiler = createCompiler()

common(compiler);

compiler.registerPseudo('has', function(compiledSelector) {
  return root => {
    let matches = findAll(root, compiledSelector)
    return !!matches.length
  }
})

export function match(selector, tree, includeSelf = true){
  return findAll(tree, compiler.compile(selector), includeSelf)
}

export function findAll(element, test, includeSelf, parent) {
  let found = [], children = [];

  if (element == null || element === false)
    return found;

  var node = createNode(element, parent);

  if (includeSelf && test(element, node))
    found.push(element);


  if (React.isValidElement(element))
    eachChild(element, child => {
      found = found.concat(findAll(child, test, true, node))
    })

  return found
}
