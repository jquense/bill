import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import uid from 'lodash/utility/uniqueId';
import { CssSelectorParser } from 'css-selector-parser';
import { create as createCompiler, parse } from './compiler';

const PREFIX = 'sub_____';

let parser = new CssSelectorParser();

parser.registerSelectorPseudos('has');
parser.registerNestingOperators('>');
parser.enableSubstitutes();

let prim = value => {
  let typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1
}

let compiler = createCompiler({})

compiler.registerPseudo('has', function(rule, valueMap) {
  let compiled = compiler.compile(rule.value, valueMap);

  return root => {
    let matches = findAll(root, compiled)
    return !!matches.length
  }
})

compiler.registerNesting('any', test => anyParent.bind(null, test))

compiler.registerNesting('>', test => directParent.bind(null, test))


export function selector(strings, ...values){
  let valueMap = Object.create(null);

  let selector = strings.reduce((rslt, string, idx) => {
    let noValue = idx >= values.length
      , value = values[idx]
      , strValue = '' + value;

    if (!noValue && !prim(value))
      valueMap[strValue = (PREFIX + uid())] = value;

    return rslt + string + (noValue ? '' : strValue)
  }, '')

  return {
    selector,
    valueMap
  }
}

export function match(selector, tree, includeSelf = true){
  let valueMap = Object.create(null);

  if (selector.selector) {
    valueMap = selector.valueMap;
    selector = selector.selector
  }

  let compiled = compiler.compile(selector, valueMap);
  let matches = findAll(tree, compiled, undefined, includeSelf);

  return matches
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
  var i = 0;
  do {
    i++;
    var { getParent, parent } = parentNode();
    node = parent
    parentNode = getParent
  } while(i < 100 && node && !test(node, test, getParent))

  return !!node
}

function directParent(test, node, parentNode) {
  node = parentNode().parent
  return !!(node && test(node, parentNode().getParent))
}

export let { compile, compileRule } = compiler
