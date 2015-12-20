'use strict';

exports.__esModule = true;
exports.eachChild = eachChild;
exports.createNode = createNode;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactLibReactInstanceMap = require('react/lib/ReactInstanceMap');

var _reactLibReactInstanceMap2 = _interopRequireDefault(_reactLibReactInstanceMap);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _compiler = require('./compiler');

var _utils = require('./utils');

function eachChild(subject, fn) {
  var inst = undefined,
      element = undefined,
      publicInst = undefined;

  if (!subject) return;

  if (_react2['default'].isValidElement(subject)) return _react2['default'].Children.forEach(subject.props.children, function (child) {
    return fn(child);
  });

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
  } else if (_utils.isCompositeComponent(publicInst) && inst._renderedComponent != null) {
    fn(inst._renderedComponent);
  }
}

function createNode(subject, lastWrapper) {
  var element = undefined,
      inst = undefined;

  if (_utils.isReactInstance(subject)) element = subject._currentElement, inst = subject;else element = subject, inst = null;

  return Object.defineProperties({}, {
    element: { get: function get() {
        return element;
      }, enumerable: true },
    instance: { value: inst, enumerable: true },
    parentNode: { value: lastWrapper, enumerable: true },
    prevSibling: {
      enumerable: true,
      get: function get() {
        var children = lastWrapper ? lastWrapper.children : [],
            idx = children.indexOf(inst || element) - 1;

        return idx < 0 ? null : createNode(children[idx], lastWrapper);
      }
    },
    nextSibling: {
      enumerable: true,
      get: function get() {
        var children = lastWrapper ? lastWrapper.children : [],
            idx = children.indexOf(inst || element) + 1;

        return idx >= children.length ? null : createNode(children[idx], lastWrapper);
      }
    },
    children: {
      enumerable: true,
      get: function get() {
        var children = [];
        eachChild(inst || element, function (child) {
          return children.push(child);
        });
        return children;
      }
    }
  });
}