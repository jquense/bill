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

var _utils = require('./utils');

var compiler = _compiler.create();

exports.compiler = compiler;
compiler.registerPseudo('has', function (compiledSelector) {
  return function (root) {
    var matches = findAll(root, compiledSelector);
    return !!matches.length;
  };
});

compiler.registerPseudo('dom', _utils.isDomElement);
compiler.registerPseudo('composite', _utils.isCompositeElement);

compiler.registerNesting('any', function (test) {
  return _utils.anyParent.bind(null, test);
});

compiler.registerNesting('>', function (test) {
  return _utils.directParent.bind(null, test);
});

function match(selector, tree) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  return findAll(tree, compiler.compile(selector), includeSelf);
}

function findAll(root, test, includeSelf) {
  var getParent = arguments.length <= 3 || arguments[3] === undefined ? function () {
    return { parent: null };
  } : arguments[3];

  var found = [];

  if (!_react2['default'].isValidElement(root)) return found;

  var children = root.props.children;

  if (includeSelf && test(root, getParent)) found.push(root);

  if (_react2['default'].Children.count(children) === 0) return found;

  _react2['default'].Children.forEach(children, function (child) {
    var parent = function parent() {
      return { parent: root, getParent: getParent };
    };

    if (_react2['default'].isValidElement(child)) {
      if (test(child, parent)) found.push(child);

      found = found.concat(findAll(child, test, false, parent));
    }
  });

  return found;
}