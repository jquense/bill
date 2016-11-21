import { ifDef } from './compat';

let internalInstanceKey
function getKey(node) {
  if (!internalInstanceKey)
    Object.keys(node).some(key => {
      if (key.indexOf('__reactInternalInstance$') === 0){
        internalInstanceKey = key;
        return true
      }
    })

  return internalInstanceKey
}

export const getInstanceFromNode = ifDef({
  '>=15': subject => _getInstanceFromNode(subject),

  '*': subject => {
    if (subject._reactInternalComponent)
      return subject._reactInternalComponent
  }
})

/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
function getClosestInstanceFromNode(node) {
  if (!node.tagName) return null;
  
  if (node[getKey(node)]) {
    return node[getKey(node)];
  }

  let parents = [];
  while (!node[getKey(node)]) {
    parents.push(node);
    if (node.parentNode) {
      node = node.parentNode;
    } else {
      return null;
    }
  }

  let closest, inst;
  for (; node && (inst = node[getKey(node)]); node = parents.pop()) {
    closest = inst;
  }

  return closest;
}

function _getInstanceFromNode(node) {
  let inst = getClosestInstanceFromNode(node);
  if (
    inst != null && (
    inst._hostNode === node ||
    inst._nativeNode === node
  )) {
    return inst;
  }

  return null;
}
