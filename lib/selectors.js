'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var _node = require('./node');

exports['default'] = function (compiler) {

  Object.keys(_node.NODE_TYPES).forEach(function (type) {
    compiler.registerPseudo(type.toLowerCase(), function () {
      return function (node) {
        return node.nodeType === _node.NODE_TYPES[type];
      };
    });
  });

  compiler.registerPseudo('has', function (test) {
    return function (node) {
      var matches = node.findAll(test);
      return !!matches.length;
    };
  });

  compiler.registerPseudo('not', function (test) {
    return function (node) {
      var matches = test(node);
      return !matches;
    };
  });

  compiler.registerPseudo('first-child', function () {
    return function (node) {
      var parent = node.parentNode;
      return parent && parent.children.indexOf(node) === 0;
    };
  });

  compiler.registerPseudo('last-child', function () {
    return function (node) {
      var parent = node.parentNode;
      var children = parent && parent.children;
      return parent && children.indexOf(node) === children.length - 1;
    };
  });

  compiler.registerNesting('any', function (test) {
    return function (node) {
      do {
        node = node.parentNode;
      } while (node && !test(node));

      return !!node;
    };
  });

  compiler.registerNesting('>', function (test) {
    return function (node) {
      node = node.parentNode;
      return !!(node && test(node));
    };
  });

  compiler.registerNesting('~', function (test) {
    return function (node) {
      do {
        node = node.prevSibling;
      } while (node && !test(node));

      return !!node;
    };
  });

  compiler.registerNesting('+', function (test) {
    return function (node) {
      node = node.prevSibling;
      return !!(node && test(node));
    };
  });
};

module.exports = exports['default'];