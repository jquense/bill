'use strict';

exports.__esModule = true;
exports.match = match;
exports.findAll = findAll;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodashObjectTransform = require('lodash/object/transform');

var _lodashObjectTransform2 = _interopRequireDefault(_lodashObjectTransform);

var _lodashObjectHas = require('lodash/object/has');

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _compiler = require('./compiler');

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _node = require('./node');

var _utils = require('./utils');

var compiler = _compiler.create();

exports.compiler = compiler;
_common2['default'](compiler);

compiler.registerPseudo('has', function (compiledSelector) {
  return function (root) {
    var matches = findAll(root, compiledSelector);
    return !!matches.length;
  };
});

function match(selector, tree) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  return findAll(tree, compiler.compile(selector), includeSelf);
}

function findAll(element, test, includeSelf, parent) {
  var found = [],
      children = [];

  if (element == null || element === false) return found;

  var node = _node.createNode(element, parent);

  if (includeSelf && test(element, node)) found.push(element);

  if (_react2['default'].isValidElement(element)) _node.eachChild(element, function (child) {
    found = found.concat(findAll(child, test, true, node));
  });

  return found;
}