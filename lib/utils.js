'use strict';

exports.__esModule = true;
exports.legacySelector = legacySelector;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashObjectHas = require('lodash/object/has');

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var isValidPlainElement = function isValidPlainElement(element) {
  return typeof element === 'object' && element != null && _lodashObjectHas2['default'](element, 'type');
};

exports.isValidPlainElement = isValidPlainElement;
var isTextElement = function isTextElement(element) {
  return !isValidPlainElement(element) && element !== false && element != null;
};

exports.isTextElement = isTextElement;
var isDomElement = function isDomElement(element) {
  return !isTextElement(element) && typeof element.type === 'string' && element.type.toLowerCase() === element.type;
};

exports.isDomElement = isDomElement;
var isCompositeElement = function isCompositeElement(element) {
  return !isTextElement(element) && typeof element.type === 'function';
};

exports.isCompositeElement = isCompositeElement;
var isDOMComponent = function isDOMComponent(inst) {
  return !!(inst && inst.nodeType === 1 && inst.tagName);
};

exports.isDOMComponent = isDOMComponent;
var isCompositeComponent = function isCompositeComponent(inst) {
  return !isDOMComponent(inst) || inst === null || typeof inst.render === 'function' && typeof inst.setState === 'function';
};

exports.isCompositeComponent = isCompositeComponent;
var isReactInstance = function isReactInstance(obj) {
  return obj != null && _lodashObjectHas2['default'](obj, '_currentElement') && _lodashObjectHas2['default'](obj, '_rootNodeID');
};

exports.isReactInstance = isReactInstance;

function legacySelector() {
  var strings = [],
      values = [];

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  args.forEach(function (arg, idx) {
    var isString = typeof arg === 'string';

    if (isString) strings.push(arg);else {
      if (idx === 0) strings.push('');
      values.push(arg);
    }
  });

  return [strings, values];
}