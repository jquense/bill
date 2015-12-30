'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _node = require('./node');

var _compiler = require('./compiler');

var _selectors = require('./selectors');

var _selectors2 = _interopRequireDefault(_selectors);

var compiler = _compiler.create();

_selectors2['default'](compiler);

function match(selector, tree) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  return _node.createNode(tree).findAll(compiler.compile(selector), includeSelf);
}

function matchKind(selector, element, includeSelf) {
  return match(selector, element, includeSelf).map(function (node) {
    return node.instance || node.element;
  });
}

module.exports = _extends({
  match: match,
  matchKind: matchKind,
  findAll: _node.findAll,
  isNode: function isNode(el) {
    return el && el.$$typeof === _node.NODE_TYPE;
  },
  NODE_TYPES: _node.NODE_TYPES
}, compiler);