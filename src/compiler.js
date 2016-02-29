import has from 'lodash/object/has';
import pick from 'lodash/object/pick';
import { createNode, NODE_TYPES } from './node';
import { createSelector } from './utils';
import { CssSelectorParser } from 'css-selector-parser';
import createCache from './cache'
import fnName from 'fn-name';
import rEscape from 'escape-regexp';

const returnsTrue = ()=> true;

let parseCache = createCache();
let parser = new CssSelectorParser();

let name = type => typeof type === 'string'
  ? type : type.displayName || fnName(type) || ''

function ignoreTextNodes(fn){
  return (...args) => args[0].nodeType === NODE_TYPES.TEXT ? false : fn(...args)
}

export function parse(selector) {
  if (typeof selector !== 'string')
    return selector

  let parsed = parseCache.get(selector)

  if (parsed) return parsed
  let ast = parser.parse(selector);

  if (ast.rule) {
    let rule = ast.rule;
    parsed =  { rules: getRule(rule), ast }
  }
  else if (ast.selectors) {
    parsed = {
      ast,
      rules: ast.selectors.map(s => getRule(s.rule)),
      multiple: true
    }
  }

  return parseCache.set(selector, parsed)

  function getRule(rule){
    if (!rule) return []
    return getRule(rule.rule).concat(rule)
  }
}

export function create(options = {}) {
  const NESTING = Object.create(null);
  const PSEUDOS = Object.create(null);

  const prefix = options.prefix || 'sub_____'
  const rValueSub = new RegExp(rEscape(prefix) + '\\d+', 'gm')

  return {
    compile,
    compileRule,

    selector: createSelector(prefix),

    registerNesting(name, fn){
      if (name !== 'any')
        parser.registerNestingOperators(name)
      NESTING[name] = fn
    },

    registerPseudo(name, fn) {
      PSEUDOS[name] = fn
    }
  }

  function compile(selector, values = Object.create(null)) {
    if (selector.selector) {
      values = selector.valueMap
      selector = selector.selector
    }

    let { rules, ast, multiple } = parse(selector)
      , compiled;

    if (!multiple)
      compiled = compileRule(rules, values)

    else {
      compiled = rules
        .map(ruleSet => compileRule(ruleSet, values))
        .reduce((current, next)=> {
          return (...args) => current(...args) || next(...args)
      })
    }

    return compiled
  }

  function compileRule(rules, values){
    let fns = [];
    let rule = rules[0];

    if (rule.tagName)
      fns.push(getTagMatcher(rule, values))

    if (rule.attrs)
      fns.push(getPropMatcher(rule, values))

    if (rule.id)
      fns.push(getIdMatcher(rule, values))

    if (rule.classNames)
      fns.push(getClassNameMatcher(rule, values))

    if (rule.pseudos) {
      fns = fns.concat(
        rule.pseudos.map(pseudo =>
          getPseudoMatcher(rule, values, pseudo)))
    }

    if (has(rule, 'nestingOperator'))
      fns.push(getNestingMatcher(rule, values, rules))

    let compiledRule = fns.reduce((current, next = returnsTrue) => {
      return (...args) => current(...args) && next(...args)
    })

    return (element, ...args) => compiledRule(createNode(element), ...args)
  }

  function getPseudoMatcher(rule, values, pseudo) {
    let createMatcher = PSEUDOS[pseudo.name]
      , inner = pseudo.value || ''
      , subValues;

    if (typeof createMatcher !== 'function')
      throw new Error('psuedo element: ' + pseudo.name + ' is not supported')

    if (subValues = inner.match(rValueSub))
      inner = { selector: inner, valueMap: pick(values, subValues)}

    return createMatcher(inner)
  }

  function getNestingMatcher(rule, values, rules) {
    let operator = rule.nestingOperator || 'any'
    let createMatcher = NESTING[operator];

    if (typeof createMatcher !== 'function')
      throw new Error('nesting operator: ' + operator + ' is not supported')

    return createMatcher(
      compileRule(rules.slice(1), values)
    )
  }
}

function getIdMatcher(rule, values) {
  return ignoreTextNodes(({ element: { props } }) => {
    if (!props || !has(props, 'id'))
      return false
    return rule.id === ('' + props.id)
  })
}

function getTagMatcher(rule, values) {
  let tagName = rule.tagName
    , test;

  if (has(values, rule.tagName))
    tagName = values[rule.tagName]

  if (tagName === '*')
    test = returnsTrue

  else {
    // interpolated value: `${MyList}.foo`
    // should be a function (todo?) strict compare.
    if (typeof tagName !== 'string')
      test = root => root.element.type === tagName
    else {
      // fallback to comparing string names
      test = root => name(root.element.type) === tagName;
    }

    test = ignoreTextNodes(test)
  }

  return test
}

function getClassNameMatcher(rule, values) {
  return ignoreTextNodes(({ element: { props } }) => {
    if (!props || !has(props, 'className'))
      return false

    let className = (' ' + props.className + ' ').replace(/[\t\r\n\f]/g, ' ')

    return rule.classNames
      .every(cls => className.indexOf(' ' + cls + ' ') >= 0)
  })
}

function getPropMatcher(rule, values) {
  return ignoreTextNodes(
      ({ element: { props } }) => rule.attrs.every(attr => {
      // boolean prop: <input disabled />
      if (!has(attr, 'value'))
        return !!props[attr.name]

      // interpolated value: 'input[max=${5}]'
      // since we have the actual value vs serialized string
      // do a strict comparison
      if (has(values, attr.value))
        return props[attr.name] === values[attr.value]

      // string value: 'input[max="5"]'
      // allow coearcion in the comparison
      return props[attr.name] == attr.value
    })
  )
}
