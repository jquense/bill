'use strict';

exports.__esModule = true;
exports.selector = selector;
exports.match = match;
exports.parse = parse;
exports.compile = compile;
exports.compileRule = compileRule;

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

var PSEUDOS = {
  has: function has(rule, valueMap) {
    var compiled = compile(rule.value, valueMap);
    return function (root) {
      var matches = findAll(root, compiled);
      return !!matches.length;
    };
  }
};

var _parser = parser;

exports._parser = _parser;

function selector(strings) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  var valueMap = Object.create(null);

  var selector = strings.reduce(function (rslt, string, idx) {
    var noValue = idx >= values.length,
        value = values[idx],
        strValue = '' + value;

    if (!noValue && !prim(value)) valueMap[strValue = PREFIX + _lodashUtilityUniqueId2['default']()] = value;

    return rslt + string + (noValue ? '' : strValue);
  }, '');

  return {
    selector: selector,
    valueMap: valueMap
  };
}

function match(selector, tree) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  var valueMap = Object.create(null);

  if (selector.selector) {
    valueMap = selector.valueMap;
    selector = selector.selector;
  }
  var compiled = compile(selector, valueMap);

  var matches = findAll(tree, compiled, undefined, includeSelf);
  return matches;
}

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
      return PSEUDOS[pseudo.name](pseudo);
    }));
  }

  if (rule.hasOwnProperty('nestingOperator')) {
    (function () {
      var immediate = rule.nestingOperator === '>';
      var nestedCompiled = compileRule(rules, rule, ast);

      fns.push(function (root, parent) {
        var method = immediate ? directParent : anyParent;
        var result = method(root, nestedCompiled, parent);
        return result;
      });
    })();
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

function findAll(root, test, getParent, includeSelf) {
  if (getParent === undefined) getParent = function () {
    return { parent: null };
  };

  var found = [];

  if (!_react2['default'].isValidElement(root)) return found;

  var children = root.props.children;

  if (_react2['default'].Children.count(children) === 0) return found;

  if (includeSelf && test(root, getParent)) found.push(root);

  _react2['default'].Children.forEach(children, function (child) {
    var parent = function parent() {
      return { parent: root, getParent: getParent };
    };

    if (_react2['default'].isValidElement(child)) {
      if (test(child, parent)) found.push(child);

      found = found.concat(findAll(child, test, parent, false));
    }
  });

  return found;
}

function getTagComparer(rule, values) {
  var tagName = values[rule.tagName] || rule.tagName;

  if (rule.tagName === '*') return function () {
    return true;
  };

  if (typeof tagName === 'string') return function (root) {
    return root.type.toUpperCase() === tagName.toUpperCase();
  };

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

function anyParent(node, test, parentNode) {
  var i = 0;
  do {
    i++;

    var _parentNode = parentNode();

    var getParent = _parentNode.getParent;
    var parent = _parentNode.parent;

    node = parent;
    parentNode = getParent;
  } while (i < 100 && node && !test(node, test, getParent));

  return !!node;
}

function directParent(node, test, parentNode) {
  node = parentNode().parent;

  return !!(node && test(node, parentNode().getParent) ? node : null);
}