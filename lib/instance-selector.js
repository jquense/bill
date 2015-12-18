'use strict';

exports.__esModule = true;
exports.findAll = findAll;
exports.match = match;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactLibReactInstanceMap = require('react/lib/ReactInstanceMap');

var _reactLibReactInstanceMap2 = _interopRequireDefault(_reactLibReactInstanceMap);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _compiler = require('./compiler');

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _node = require('./node');

var _utils = require('./utils');

var compiler = _compiler.create();

exports.compiler = compiler;
_common2['default'](compiler);

compiler.registerPseudo('has', function (compiledSelector) {
  return function (_, node) {
    var matches = findAll(node.instance, compiledSelector);
    return !!matches.length;
  };
});

function findAll(inst, test, includeSelf, parent) {
  var found = [],
      publicInst = undefined;

  if (!inst) return found;

  if (inst.getPublicInstance) publicInst = inst.getPublicInstance();

  var node = _node.createNode(inst, parent);

  // ReactEmptyComponents (return null render <noscript/>) have null has their element
  if (includeSelf && node.element !== null && test(node.element, node)) found = found.concat(inst);

  _node.eachChild(inst, function (child) {
    var childNode = _node.createNode(child, node);

    if (!_utils.isReactInstance(child) && test(childNode.element, childNode)) return found.push(child);

    found = found.concat(findAll(child, test, true, node));
  });

  return found;
}

/**
 * The matcher actually works on internal instances, not public ones
 * since DOM and stateless components don't have helpful public instances
 */

function match(selector, inst) {
  var includeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  var tree = inst.getPublicInstance ? inst //already a private instance
  : inst._reactInternalComponent //is a DOM node
  ? inst._reactInternalComponent : _reactLibReactInstanceMap2['default'].get(inst);

  return findAll(tree, compiler.compile(selector), includeSelf);
}

var compile = compiler.compile;
var compileRule = compiler.compileRule;
var selector = compiler.selector;
exports.compile = compile;
exports.compileRule = compileRule;
exports.selector = selector;