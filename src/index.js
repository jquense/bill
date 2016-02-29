import { findAll, createNode, NODE_TYPE, NODE_TYPES } from './node';
import { create as createCompiler } from './compiler';
import selectors from './selectors';

let compiler = createCompiler()

selectors(compiler);

function querySelectorAll(selector, tree, includeSelf = true) {
  return createNode(tree).findAll(compiler.compile(selector), includeSelf)
}

function matches(selector, node) {
  return compiler.compile(selector)(node)
}

module.exports = {
  matches,
  querySelectorAll,
  findAll,
  isNode: el => el && el.$$typeof === NODE_TYPE,
  NODE_TYPES,
  ...compiler
}
