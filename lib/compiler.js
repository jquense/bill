'use strict';

exports.__esModule = true;
exports.parse = parse;
exports.create = create;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodashObjectTransform = require('lodash/object/transform');

var _lodashObjectTransform2 = _interopRequireDefault(_lodashObjectTransform);

var _lodashObjectHas = require('lodash/object/has');

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _lodashUtilityUniqueId = require('lodash/utility/uniqueId');

var _lodashUtilityUniqueId2 = _interopRequireDefault(_lodashUtilityUniqueId);

var _cssSelectorParser = require('css-selector-parser');

var PREFIX = 'sub_____';

var parser = new _cssSelectorParser.CssSelectorParser();

parser.registerSelectorPseudos('has');
parser.registerNestingOperators('>');
parser.enableSubstitutes();

var prim = function prim(value) {
  var typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1;
};

function parse(selector) {
  var ast = typeof selector === 'string' ? parser.parse(selector) : selector;

  if (ast.rule) {
    var rule = ast.rule;
    return { rules: getRule(rule), ast: ast };
  } else if (ast.selectors) {
    return {
      ast: ast,
      rules: ast.selectors.map(function (s) {
        return getRule(s.rule);
      }),
      multiple: true
    };
  }

  function getRule(rule) {
    if (!rule) return [];
    return getRule(rule.rule).concat(rule);
  }
}

function create(options) {
  var NESTING = Object.create(null);
  var PSEUDOS = Object.create(null);

  var traverse = options.traverse;

  return {
    compile: compile,
    compileRule: compileRule,
    registerNesting: function registerNesting(name, fn) {
      NESTING[name] = fn;
    },
    registerPseudo: function registerPseudo(name, fn) {
      PSEUDOS[name] = fn;
    }
  };

  function compile(selector) {
    var values = arguments.length <= 1 || arguments[1] === undefined ? Object.create(null) : arguments[1];

    var _parse = parse(selector);

    var rules = _parse.rules;
    var ast = _parse.ast;
    var multiple = _parse.multiple;

    if (!multiple) return compileRule(rules, null, values, ast);

    return rules.map(function (ruleSet) {
      return compileRule(ruleSet, null, values, ast);
    }).reduce(function (current, next) {
      return function (root, parent) {
        return current(root, parent) || next(root, parent);
      };
    });
  }

  function compileRule(rules, parent, values, ast) {
    var fns = [];
    var rule = rules.shift();

    if (rule.tagName) fns.push(getTagComparer(rule, values));

    if (rule.attrs) fns.push(getPropComparer(rule, values));

    if (rule.classNames) fns.push(function (_ref) {
      var className = _ref.props.className;

      return rule.classNames.every(function (clsName) {
        return className && className.indexOf(clsName) !== -1;
      });
    });

    if (rule.pseudos) {
      fns = fns.concat(rule.pseudos.map(function (pseudo) {
        if (!PSEUDOS[pseudo.name]) throw new Error('psuedo element: ' + psuedo.name + ' is not supported');
        return PSEUDOS[pseudo.name](pseudo, values, options);
      }));
    }

    if (rule.hasOwnProperty('nestingOperator')) {
      var operator = rule.nestingOperator || 'any';
      var nestedCompiled = compileRule(rules, rule, values, ast);

      if (!NESTING[operator]) throw new Error('nesting operator: ' + operator + ' is not supported');

      fns.push(NESTING[operator](nestedCompiled));
    }

    return fns.reduce(function (current) {
      var next = arguments.length <= 1 || arguments[1] === undefined ? function () {
        return true;
      } : arguments[1];

      return function (root, parent) {
        return next(root, parent) && current(root, parent);
      };
    });
  }
}

function getTagComparer(rule, values) {
  var isStr = function isStr(t) {
    return typeof t === 'string';
  };
  var tagName = values[rule.tagName] || rule.tagName;

  if (rule.tagName === '*') return function () {
    return true;
  };

  if (isStr(tagName)) {
    tagName = tagName.toUpperCase();
    return function (root) {
      return isStr(root.type) && root.type.toUpperCase() === tagName;
    };
  }

  return function (root) {
    return root.type === tagName;
  };
}

function getPropComparer(rule, values) {
  return function (_ref2) {
    var props = _ref2.props;
    return rule.attrs.every(function (attr) {
      if (!_lodashObjectHas2['default'](attr, 'value')) return !!props[attr.name];

      if (!_lodashObjectHas2['default'](values, attr.value)) return props[attr.name] == attr.value;

      return props[attr.name] === values[attr.value];
    });
  };
}