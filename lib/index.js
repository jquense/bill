'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _react = require('react');

var _elementSelector = require('./element-selector');

var elements = _interopRequireWildcard(_elementSelector);

var _instanceSelector = require('./instance-selector');

var instance = _interopRequireWildcard(_instanceSelector);

function match(selector, element) {
  if (_react.isValidElement(element)) return elements.match(selector, element);

  return instance.match(selector, element);
}

module.exports = {
  match: match,
  selector: elements.compiler.selector
};