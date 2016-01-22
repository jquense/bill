import React from 'react';
import transform from 'lodash/object/transform';
import has from 'lodash/object/has';
import uid from 'lodash/utility/uniqueId';
import { createNode, NODE_TYPES } from './node';
import { isTextElement, legacySelector } from './utils';
import { CssSelectorParser } from 'css-selector-parser';
import fnName from 'fn-name';

let parser = new CssSelectorParser();

let name = type => typeof type === 'string'
  ? type : type.displayName || fnName(type) || ''

let prim = value => {
  let typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1
}

function failText(fn){
  return (...args) => args[0].nodeType === NODE_TYPES.TEXT ? false : fn(...args)
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

export function create(options = {}) {
  const NESTING = Object.create(null);
  const PSEUDOS = Object.create(null);
  const PREFIX = options.prefix || 'sub_____';

  let { traverse } = options;

  return {
    compile,
    compileRule,
    selector,

    registerNesting(name, fn){
      if (name !== 'any')
        parser.registerNestingOperators(name)
      NESTING[name] = fn
    },

    registerPseudo(name, containsSelector, fn) {
      if (typeof containsSelector === 'function')
        fn = containsSelector, containsSelector = true;

      if (containsSelector)
        parser.registerSelectorPseudos(name)

      PSEUDOS[name] = fn
    }
  }

  function compile(selector, values = Object.create(null)){
    if (selector.selector) {
      values = selector.valueMap;
      selector = selector.selector
    }

    let { rules, ast, multiple } = parse(selector);

    if (!multiple)
      return compileRule(rules, null, values, ast)

    return rules
      .map(ruleSet => compileRule(ruleSet, null, values, ast))
      .reduce((current, next)=> {
        return (...args) => current(...args) || next(...args)
      })
  }

  function compileRule(rules, parent, values, ast){
    let fns = [];
    let rule = rules.shift();

    if (rule.tagName)
      fns.push(getTagComparer(rule, values))

    if (rule.attrs)
      fns.push(
        failText(getPropComparer(rule, values))
      )

    if (rule.classNames)
      fns.push(
        failText(({ element: { props } }) => {
          let className = props && '' + props.className
          return rule.classNames.every(clsName =>
            className && className.indexOf(clsName) !== -1)
        })
      )

    if (rule.pseudos) {
      fns = fns.concat(
        rule.pseudos.map(pseudo => {
          if (!PSEUDOS[pseudo.name])
            throw new Error('psuedo element: ' + pseudo.name + ' is not supported')

          let pseudoCompiled = pseudo.valueType === 'selector'
            ? compile(pseudo.value, values)
            : pseudo.value

          return PSEUDOS[pseudo.name](pseudoCompiled, values, options)
        })
      )
    }

    if (rule.hasOwnProperty('nestingOperator') ){
      let operator = rule.nestingOperator || 'any'
      let nestedCompiled = compileRule(rules, rule, values, ast);

      if (!NESTING[operator])
        throw new Error('nesting operator: ' + operator + ' is not supported')

      fns.push(NESTING[operator](nestedCompiled))
    }

    let compiledRule = fns.reduce((current, next = ()=> true)=> {
      return (...args)=> current(...args) && next(...args)
    })

    return (element, ...args)=> compiledRule(createNode(element), ...args)
  }

  function selector(strings, ...values){
    if (!Array.isArray(strings))
      [ strings, values ] = legacySelector.apply(null, [strings].concat(values));

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
}

function getTagComparer(rule, values) {
  let tagName = values[rule.tagName] || rule.tagName
    , test;

  if (rule.tagName === '*')
    test = ()=> true

  else {
    if (typeof tagName !== 'string')
      test = root => root.element.type === tagName
    else {
      test = root => name(root.element.type) === tagName;
    }

    test = failText(test)
  }

  return test
}

function getPropComparer(rule, values) {
  return ({ element: { props } }) => rule.attrs.every(attr => {
    if (!has(attr, 'value'))
      return !!props[attr.name]

    if (!has(values, attr.value))
      return props[attr.name] == attr.value

    return props[attr.name] === values[attr.value]
  })
}
