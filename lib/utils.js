'use strict';

exports.__esModule = true;
exports.anyParent = anyParent;
exports.directParent = directParent;
var isDomElement = function isDomElement(element) {
  return typeof element.type === 'string' && element.type.toLowerCase() === element.type;
};

exports.isDomElement = isDomElement;
var isCompositeElement = function isCompositeElement(element) {
  return typeof element.type === 'function';
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