'use strict';

exports.__esModule = true;

var _utils = require('./utils');

function anyParent(test, element, node) {
  do {
    node = node.parentNode;
  } while (node && !test(node.element, node));

  return !!node;
}

function directParent(test, _, node) {
  node = node.parentNode;
  return !!(node && test(node.element, node));
}

function anySibling(test, _, node) {
  do {
    node = node.prevSibling;
  } while (node && !test(node.element, node));

  return !!node;
}

function directSibling(test, _, node) {
  node = node.prevSibling;
  return !!(node && test(node.element, node));
}

exports['default'] = function (compiler) {
  compiler.registerPseudo('dom', function () {
    return _utils.isDomElement;
  });
  compiler.registerPseudo('composite', function () {
    return _utils.isCompositeElement;
  });

  compiler.registerPseudo('not', function (compiledSelector) {
    return function (element, node) {
      var matches = compiledSelector(element, node);
      return !matches;
    };
  });

  compiler.registerPseudo('first-child', function () {
    return function (element, node) {
      var parent = node.parentNode;
      return parent && parent.children.indexOf(node.instance || element) === 0;
    };
  });

  compiler.registerPseudo('last-child', function () {
    return function (element, node) {
      var parent = node.parentNode;
      var children = parent && parent.children;
      return parent && children.indexOf(node.instance || element) === children.length - 1;
    };
  });

  compiler.registerNesting('any', function (test) {
    return function (element, node) {
      return anyParent(test, element, node);
    };
  });

  compiler.registerNesting('>', function (test) {
    return function (element, node) {
      return directParent(test, element, node);
    };
  });

  compiler.registerNesting('~', function (test) {
    return function (element, node) {
      return anySibling(test, element, node);
    };
  });

  compiler.registerNesting('+', function (test) {
    return function (element, node) {
      return directSibling(test, element, node);
    };
  });
};

module.exports = exports['default'];