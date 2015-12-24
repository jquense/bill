'use strict';

exports.__esModule = true;
exports.findAll = findAll;
exports.eachChild = eachChild;
exports.createNode = createNode;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactLibReactInstanceMap = require('react/lib/ReactInstanceMap');

var _reactLibReactInstanceMap2 = _interopRequireDefault(_reactLibReactInstanceMap);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _lodashArrayFindIndex = require('lodash/array/findIndex');

var _lodashArrayFindIndex2 = _interopRequireDefault(_lodashArrayFindIndex);

var _compiler = require('./compiler');

var _utils = require('./utils');

var NODE_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('bill.node') || 0xeac7;

exports.NODE_TYPE = NODE_TYPE;
var NODE_TYPES = {
  COMPOSITE: 1,
  DOM: 2,
  TEXT: 3
};

exports.NODE_TYPES = NODE_TYPES;
function indexOfNode(arr, instOrElement) {
  return _lodashArrayFindIndex2['default'](arr, function (node, i) {
    return node.privateInstance === instOrElement || node.element === instOrElement;
  });
}

function instanceFromNativeNode(subject) {
  if (subject._reactInternalComponent) return subject._reactInternalComponent;

  // TODO: react 0.15.0 is going to break this
  // need to use ReactDOMComponentTree.getInstanceFromNode
}

function normalizeSubject(subject) {
  return subject && !subject.getPublicInstance ? instanceFromNativeNode(subject) || _reactLibReactInstanceMap2['default'].get(subject) || subject : subject;
}

function findAll(subject, test, includeSelf) {
  if (!subject) return [];

  var found = [];
  var node = createNode(subject);

  // ReactEmptyComponents (return null; render <noscript/>) have null has their element
  // so don't assume it's there.
  if (includeSelf && node.element != null && test(node)) found = found.concat(node);

  return node.children.reduce(function (found, child) {
    return found.concat(findAll(child, test, true));
  }, found);
}

function eachChild(subject, fn) {
  var inst = undefined,
      element = undefined,
      publicInst = undefined;

  if (!subject) return;

  subject = normalizeSubject(subject);

  if (_react2['default'].isValidElement(subject)) return _react2['default'].Children.forEach(subject.props.children, function (child) {
    return child != null && fn(child);
  });

  if (!_utils.isReactInstance(subject)) return;

  inst = subject;
  element = inst._currentElement;

  if (inst.getPublicInstance) publicInst = inst.getPublicInstance();

  if (_utils.isDOMComponent(publicInst)) {
    (function () {
      var renderedChildren = inst._renderedChildren,
          child = element && element.props.children;

      // in cases where there is a single child
      // renderedChildren will be null if that child is a non-element
      // renderable thing, like a string or number.
      if (renderedChildren != null) Object.keys(renderedChildren || {}).forEach(function (key) {
        return fn(renderedChildren[key]);
      });else if (child != null && _utils.isTextElement(child)) fn(child);
    })();
  } else if (_react2['default'].isValidElement(element) && typeof element.type === 'function' && inst._renderedComponent != null) {
    fn(inst._renderedComponent);
  }
}

function createNode(subject, lastWrapper) {
  var node = undefined,
      element = undefined,
      inst = undefined;

  if (subject != null && subject.$$typeof === NODE_TYPE) return subject;

  subject = normalizeSubject(subject);

  if (_utils.isReactInstance(subject)) element = subject._currentElement, inst = subject;else element = subject, inst = null;

  var children = undefined,
      type = undefined;

  if (element) {
    if (_utils.isCompositeElement(element)) type = NODE_TYPES.COMPOSITE;else if (_utils.isDomElement(element)) type = NODE_TYPES.DOM;else if (_utils.isTextElement(element)) type = NODE_TYPES.TEXT;
  }

  node = Object.defineProperties({}, {
    $$typeof: { value: NODE_TYPE },
    nodeType: { value: type, enumerable: true },
    privateInstance: { value: inst, enumerable: true },
    element: {
      enumerable: true,
      get: function get() {
        if (node.privateInstance) return node.privateInstance._currentElement;

        return element;
      }
    },
    instance: {
      enumerable: true,
      get: function get() {
        var publicInst = undefined;
        if (!inst) return;
        if (inst.getPublicInstance) {
          publicInst = inst.getPublicInstance();
          if (publicInst === null) publicInst = inst._instance;
        } else if (_utils.isTextElement(node.element)) publicInst = node.element;

        return publicInst;
      }
    },
    parentNode: { value: lastWrapper, enumerable: true },
    findAll: {
      enumerable: true,
      value: function value(test, includeSelf) {
        return findAll(node, test, includeSelf);
      }
    },
    prevSibling: {
      enumerable: true,
      get: function get() {
        var children = lastWrapper ? lastWrapper.children : [],
            idx = indexOfNode(children, inst || node.element) - 1;

        return idx < 0 ? null : children[idx];
      }
    },
    nextSibling: {
      enumerable: true,
      get: function get() {
        var children = lastWrapper ? lastWrapper.children : [],
            idx = indexOfNode(children, inst || node.element) + 1;

        return idx >= children.length ? null : children[idx];
      }
    },
    children: {
      enumerable: true,
      get: function get() {
        if (!children) {
          children = [];
          eachChild(inst || node.element, function (child) {
            return children.push(createNode(child, node));
          });
        }

        return children;
      }
    }
  });

  return node;
}