'use strict';

exports.__esModule = true;
exports.match = match;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactLibReactInstanceMap = require('react/lib/ReactInstanceMap');

var _reactLibReactInstanceMap2 = _interopRequireDefault(_reactLibReactInstanceMap);

var _compiler = require('./compiler');

var _utils = require('./utils');

var isDOMComponent = function isDOMComponent(inst) {
  return !!(inst && inst.nodeType === 1 && inst.tagName);
};

var isCompositeComponent = function isCompositeComponent(inst) {
  return !isDOMComponent(inst) || inst === null || typeof inst.render === 'function' && typeof inst.setState === 'function';
};

var compiler = _compiler.create();

exports.compiler = compiler;
compiler.registerPseudo('has', function (compiledSelector) {
  return function (_, inst) {
    var matches = findAll(inst, compiledSelector);
    return !!matches.length;
  };
});

compiler.registerPseudo('dom', function () {
  return _utils.isDomElement;
});
compiler.registerPseudo('composite', function () {
  return _utils.isCompositeElement;
});

compiler.registerNesting('any', function (test) {
  return function (element, inst, parent) {
    return _utils.anyParent(test, element, parent);
  };
});

compiler.registerNesting('>', function (test) {
  return function (element, inst, parent) {
    return _utils.directParent(test, element, parent);
  };
});

function findAll(inst, test) {
  var excludeSelf = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
  var getParent = arguments.length <= 3 || arguments[3] === undefined ? function () {
    return { parent: null };
  } : arguments[3];

  var found = [];

  if (!inst || !inst.getPublicInstance) return found;

  var publicInst = inst.getPublicInstance(),
      element = inst._currentElement,
      parent = function parent() {
    return { parent: element, getParent: getParent };
  };

  if (!excludeSelf && test(element, inst, getParent)) found = found.concat(inst);

  if (isDOMComponent(publicInst)) {
    (function () {
      var renderedChildren = inst._renderedChildren || {};

      Object.keys(renderedChildren).forEach(function (key) {
        found = found.concat(findAll(renderedChildren[key], test, false, parent));
      });
    })();
  } else if (isCompositeComponent(publicInst)) {
    found = found.concat(findAll(inst._renderedComponent, test, false, parent));
  }

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

  return findAll(tree, compiler.compile(selector), !includeSelf);
}

var compile = compiler.compile;
var compileRule = compiler.compileRule;
var selector = compiler.selector;
exports.compile = compile;
exports.compileRule = compileRule;
exports.selector = selector;