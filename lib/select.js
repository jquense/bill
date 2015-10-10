'use strict';

exports.__esModule = true;
exports.match = match;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodashObjectTransform = require('lodash/object/transform');

var _lodashObjectTransform2 = _interopRequireDefault(_lodashObjectTransform);

var _lodashObjectHas = require('lodash/object/has');

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _compiler = require('./compiler');

var compiler = _compiler.create();

compiler.registerPseudo('has', function (compiledSelector) {
  return function (root) {
    var matches = findAll(root, compiledSelector);
    return !!matches.length;
  };
});

compiler.registerNesting('any', function (test) {
  return anyParent.bind(null, test);
});
compiler.registerNesting('>', function (test) {
  return directParent.bind(null, test);
});

function match(selector, tree) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  return findAll(tree, compiler.compile(selector), undefined, includeSelf);
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
  do {
    var _parentNode = parentNode();

    var getParent = _parentNode.getParent;
    var parent = _parentNode.parent;

    node = parent;
    parentNode = getParent;
  } while (node && !test(node, test, getParent));

  return !!node;
}

function directParent(test, node, parentNode) {
  node = parentNode().parent;
  return !!(node && test(node, parentNode().getParent));
}

var compile = compiler.compile;
var compileRule = compiler.compileRule;
var selector = compiler.selector;
exports.compile = compile;
exports.compileRule = compileRule;
exports.selector = selector;