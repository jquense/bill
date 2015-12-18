import React from 'react';
import ReactInstanceMap from 'react/lib/ReactInstanceMap';
import isPlainObject from 'lodash/lang/isPlainObject';
import { create as createCompiler, parse } from './compiler';
import common from './common';
import { createNode, eachChild } from './node';
import {
    anyParent, directParent
  , isDomElement, isCompositeElement
  , isReactInstance, isDOMComponent, isCompositeComponent } from './utils';

export let compiler = createCompiler()

common(compiler);

compiler.registerPseudo('has', function(compiledSelector) {
  return (_, node) => {
    let matches = findAll(node.instance, compiledSelector)
    return !!matches.length
  }
})

export function findAll(inst, test, includeSelf, parent) {
  let found = [], publicInst;

  if (!inst)
    return found;

  if (inst.getPublicInstance)
    publicInst = inst.getPublicInstance()

  var node = createNode(inst, parent);

  // ReactEmptyComponents (return null render <noscript/>) have null has their element
  if (includeSelf && node.element !== null && test(node.element, node))
    found = found.concat(inst)

  eachChild(inst, child => {
    let childNode = createNode(child, node);

    if (!isReactInstance(child) && test(childNode.element, childNode))
      return found.push(child)

    found = found.concat(
      findAll(child, test, true, node)
    );
  })

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

  return findAll(tree, compiler.compile(selector), includeSelf)
}


export let { compile, compileRule, selector } = compiler
