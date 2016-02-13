import React from 'react';
import { findDOMNode } from 'react-dom';
import ReactInstanceMap from 'react/lib/ReactInstanceMap';
import isPlainObject from 'lodash/lang/isPlainObject';
import findIndex from 'lodash/array/findIndex';
import { create as createCompiler, parse } from './compiler';
import {
    isDomElement, isCompositeElement
  , isTextElement, isReactInstance
  , isDOMComponent, isCompositeComponent, getAllPropertyNames} from './utils';

export const NODE_TYPE = (typeof Symbol === 'function' && Symbol.for && Symbol.for('bill.node')) || 0xadc3;

export const NODE_TYPES = {
  COMPOSITE: 1,
  DOM: 2,
  TEXT: 3
}

function indexOfNode(arr, instOrElement) {
  return findIndex(arr, (node, i) => {
    return node.privateInstance === instOrElement || node.element === instOrElement
  })
}
function isStale(privateInstance) {
  return privateInstance && privateInstance._rootNodeID === null
}

function trimStale(nodes) {
  for (var i = nodes.length - 1; i--;)
  	if (isStale(array[i].privateInstance))
      nodes.splice(i, 1);
}

function instanceFromNativeNode(subject) {
  if (subject._reactInternalComponent)
    return subject._reactInternalComponent

  // TODO: react 0.15.0 is going to break this
  // need to use ReactDOMComponentTree.getInstanceFromNode
}

function normalizeSubject(subject) {
  return subject && !subject.getPublicInstance
    ? instanceFromNativeNode(subject) || ReactInstanceMap.get(subject) || subject
    : subject
}

export function findAll(subject, test, includeSelf) {
  if (!subject)
    return [];

  let found = [];
  let node = createNode(subject);

  // ReactEmptyComponents (return null; render <noscript/>) have null has their element
  // so don't assume it's there.
  if (includeSelf && node.element != null && test(node))
    found = found.concat(node)

  return node.children.reduce(
    (found, child) => found.concat(findAll(child, test, true)), found)
}

export function eachChild(subject, fn) {
  let inst, element, publicInst;

  if (!subject) return;

  subject = normalizeSubject(subject);

  if (React.isValidElement(subject))
    return React.Children.forEach(subject.props.children,
      child => child != null && fn(child))

  if (!isReactInstance(subject))
    return

  inst = subject
  element = inst._currentElement

  if (inst.getPublicInstance)
    publicInst = inst.getPublicInstance()

  if (isDOMComponent(publicInst)) {
    let renderedChildren = inst._renderedChildren
      , child = element && element.props.children;

    // in cases where there is a single child
    // renderedChildren will be null if that child is a non-element
    // renderable thing, like a string or number.
    if (renderedChildren != null)
      Object.keys(renderedChildren || {}).forEach(
        key => fn(renderedChildren[key])
      );
    else if (child != null && isTextElement(child))
      fn(child)
  }
  else if (
    React.isValidElement(element) &&
    typeof element.type === 'function' &&
    inst._renderedComponent != null
  ) {
    fn(inst._renderedComponent);
  }
}


export function createNode(subject, lastWrapper) {
  let node, element, inst;

  if (subject != null && subject.$$typeof === NODE_TYPE)
    return subject;

  subject = normalizeSubject(subject);

  if (isReactInstance(subject))
    element = subject._currentElement, inst = subject;
  else
    element = subject, inst = null;

  let children = []
    , lastElement, type;

  if (element != null && element !== false) {
    if (isCompositeElement(element))
      type = NODE_TYPES.COMPOSITE;
    else if (isDomElement(element))
      type = NODE_TYPES.DOM;
    else if (isTextElement(element))
      type = NODE_TYPES.TEXT;
  }

  node = Object.defineProperties({}, {
    $$typeof: { value: NODE_TYPE },
    nodeType: { value: type, enumerable: true },
    parentNode: { value: lastWrapper, enumerable: true },
    privateInstance: {
      enumerable: true,
      get(){
        if (inst && isStale(inst)) inst = null
        return inst
      }
    },
    element: {
      enumerable: true,
      get() {
        if (node.privateInstance)
          return node.privateInstance._currentElement

        return element
      }
    },
    instance: {
      enumerable: true,
      get() {
        let publicInst;
        let privInst = node.privateInstance;

        if (!privInst) return

        if (privInst.getPublicInstance) {
          publicInst = privInst.getPublicInstance()
          if (publicInst === null)
            publicInst = privInst._instance
        }
        else if (isTextElement(node.element))
          publicInst = node.element

        return publicInst
      }
    },

    findAll: {
      enumerable: true,
      value: (test, includeSelf) => findAll(node, test, includeSelf)
    },
    prevSibling: {
      enumerable: true,
      get(){
        let children = lastWrapper ? lastWrapper.children : []
          , idx = indexOfNode(children, inst || node.element) - 1

        return idx < 0 ? null : children[idx]
      }
    },
    nextSibling: {
      enumerable: true,
      get(){
        let children = lastWrapper ? lastWrapper.children : []
          , idx = indexOfNode(children, inst || node.element) + 1

        return idx >= children.length ? null : children[idx]
      }
    },
    children: {
      enumerable: true,
      get() {
        let elem = node.element;
        if (!lastElement || elem !== lastElement) {
          if (children.length)
            children.length = 0

          lastElement = elem

          eachChild(node.privateInstance || elem, child => {
            child = createNode(child, node);

            if (!isStale(child.privateInstance))
              children.push(child)
          })
        }
        
        return children
      }
    }
  })

  return node
}
