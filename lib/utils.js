'use strict';

exports.__esModule = true;
exports.anyParent = anyParent;
exports.directParent = directParent;
exports.legacySelector = legacySelector;

var isValidPlainElement = function isValidPlainElement(element) {
  return typeof element === 'object' && element != null;
};

var isTextElement = function isTextElement(element) {
  return !isValidPlainElement(element) && element !== false;
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

function anyParent(test, element, parentNode) {
  do {
    var _parentNode = parentNode();

    var getParent = _parentNode.getParent;
    var parent = _parentNode.parent;

    element = parent;
    parentNode = getParent;
  } while (element && !test(element, test, getParent));

  return !!element;
}

function directParent(test, element, parentNode) {
  element = parentNode().parent;
  return !!(element && test(element, parentNode().getParent));
}

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