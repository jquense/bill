import { isValidElement } from 'react';
import { findAll, createNode, NODE_TYPE, NODE_TYPES } from './node';
import { create as createCompiler, parse } from './compiler';
import selectors from './selectors';

let compiler = createCompiler()

selectors(compiler);

function match(selector, tree, includeSelf = true) {
  return createNode(tree).findAll(compiler.compile(selector), includeSelf)
}

function matchKind(selector, element, includeSelf) {
  return match(selector, element, includeSelf)
    .map(node => node.instance || node.element)
}

module.exports = {
  match,
  matchKind,
  findAll,
  isNode: el => el && el.$$typeof === NODE_TYPE,
  NODE_TYPES,
  ...compiler
}
