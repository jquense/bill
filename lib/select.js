'use strict';

exports.__esModule = true;
exports.selector = selector;
exports.match = match;

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

var _compiler = require('./compiler');

var PREFIX = 'sub_____';

var parser = new _cssSelectorParser.CssSelectorParser();

parser.registerSelectorPseudos('has');
parser.registerNestingOperators('>');
parser.enableSubstitutes();

var prim = function prim(value) {
  var typ = typeof value;
  return value === null || ['string', 'number'].indexOf(typ) !== -1;
};

var compiler = _compiler.create({});

compiler.registerPseudo('has', function (rule, valueMap) {
  var compiled = compiler.compile(rule.value, valueMap);

  return function (root) {
    var matches = findAll(root, compiled);
    return !!matches.length;
  };
});

compiler.registerNesting('any', function (test) {
  return anyParent.bind(null, test);
});

compiler.registerNesting('>', function (test) {
  return directParent.bind(null, test);
});

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

  var compiled = compiler.compile(selector, valueMap);
  var matches = findAll(tree, compiled, undefined, includeSelf);

  return matches;
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

function anyParent(test, node, parentNode) {
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

function directParent(test, node, parentNode) {
  node = parentNode().parent;
  return !!(node && test(node, parentNode().getParent));
}

var compile = compiler.compile;
var compileRule = compiler.compileRule;
exports.compile = compile;
exports.compileRule = compileRule;