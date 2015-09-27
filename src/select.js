import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import uid from 'lodash/utility/uniqueId';
import { CssSelectorParser } from 'css-selector-parser';

const PREFIX = 'sub_____';

let parser = new CssSelectorParser();

parser.registerSelectorPseudos('has');
parser.registerNestingOperators('>');
parser.enableSubstitutes();

let prim = value => {
  let typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1
}

const PSEUDOS = {
  has(rule, valueMap) {
    let compiled = compile(rule.value, valueMap)
    return root => {
      let matches = findAll(root, compiled)
      return !!matches.length
    }
  }
}

export let _parser = parser;

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

export function match(selector, tree){
  let valueMap = Object.create(null);

  if (selector.selector) {
    valueMap = selector.valueMap;
    selector = selector.selector
  }
  let compiled = compile(selector, valueMap);

  let matches = findAll(tree, compiled, undefined, true)
  return matches
}

export function parse(selector){
  let ast = typeof selector === 'string'
    ? parser.parse(selector)
    : selector;

  if (ast.rule){
    let rule = ast.rule;
    return { rules: getRule(rule), ast }
  }
  else if (ast.selectors) {
    return {
      ast,
      rules: ast.selectors.map(s => getRule(s.rule)),
      multiple: true
    }
  }

  function getRule(rule){
    if (!rule) return []
    return getRule(rule.rule).concat(rule)
  }
}

export function compile(selector, values = Object.create(null)){
  let { rules, ast, multiple } = parse(selector);

  if (!multiple)
    return compileRule(rules, null, values, ast)

  return rules
    .map(ruleSet => compileRule(ruleSet, null, values, ast))
    .reduce((current, next)=> {
      return (root, parent) => current(root, parent) || next(root, parent)
    })
}

export function compileRule(rules, parent, values, ast){
  let fns = [];
  let rule = rules.shift();

  if (rule.tagName)
    fns.push(getTagComparer(rule, values))

  if (rule.attrs)
    fns.push(getPropComparer(rule, values))

  if (rule.classNames)
    fns.push(({ props: { className } }) => {
      return rule.classNames.every(clsName =>
        className && className.indexOf(clsName) !== -1)
    })

  if (rule.pseudos) {
    fns = fns.concat(
      rule.pseudos.map(pseudo => {
        if (!PSEUDOS[pseudo.name])
          throw new Error('psuedo element: ' + psuedo.name + ' is not supported')
        return PSEUDOS[pseudo.name](pseudo)
      })
    )
  }

  if (rule.hasOwnProperty('nestingOperator') ){
    let immediate = rule.nestingOperator === '>'
    let nestedCompiled = compileRule(rules, rule, ast);

    fns.push((root, parent) => {
      let method = immediate ? directParent : anyParent
      let result = method(root, nestedCompiled, parent)
      return result
    })
  }

  return fns.reduce((current, next = ()=> true)=> {
    return (root, parent)=> next(root, parent) && current(root, parent)
  })
}

function findAll(root, test, getParent = ()=> ({ parent: null }), includeSelf){
  let children = root.props.children
  let found = [];

  if (React.Children.count(children) === 0)
    return found

  if (includeSelf && React.isValidElement(root) && test(root, getParent)){
    found.push(root);
  }

  React.Children.forEach(children, child => {
    let parent = ()=> ({ parent: root, getParent });

    if (React.isValidElement(child) && test(child, parent)){
      found.push(child);
    }

    found = found.concat(findAll(child, test, parent, false))
  })

  return found
}

function getTagComparer(rule, values) {
  let tagName = values[rule.tagName] || rule.tagName;

  if (rule.tagName === '*')
    return ()=> true

  if (typeof tagName === 'string')
    return root => root.type.toUpperCase() === tagName.toUpperCase();

  return root => root.type === tagName
}

function getPropComparer(rule, values) {
  return ({ props }) => rule.attrs.every(attr => {
    if (!has(attr, 'value'))
      return !!props[attr.name]

    if (!has(values, attr.value))
      return props[attr.name] == attr.value

    return props[attr.name] === values[attr.value]
  })
}

function anyParent(node, test, parentNode){
  var i = 0;
  do {
    i++;
    var { getParent, parent } = parentNode();
    node = parent
    parentNode = getParent
  } while(i < 100 && node && !test(node, test, getParent))

  return !!node
}

function directParent(node, test, parentNode) {
  node = parentNode().parent

  return !!(node && test(node, parentNode().getParent) ? node : null)
}
