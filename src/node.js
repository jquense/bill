import React from 'react';
import ReactInstanceMap from 'react/lib/ReactInstanceMap';
import isPlainObject from 'lodash/lang/isPlainObject';
import { create as createCompiler, parse } from './compiler';
import {
    anyParent, directParent
  , isDomElement, isCompositeElement
  , isReactInstance, isDOMComponent, isCompositeComponent } from './utils';

export function eachChild(subject, fn) {
  let inst, element, publicInst;

  if (!subject) return;

  if (React.isValidElement(subject))
    return React.Children.forEach(subject.props.children, child => fn(child))

  inst = subject
  element = inst._currentElement

  if (inst.getPublicInstance)
    publicInst = inst.getPublicInstance()

  if (isDOMComponent(publicInst)) {
    let renderedChildren = inst._renderedChildren || {}
      , child = element && element.props.children;

    if (child != null && !isPlainObject(child) && !Array.isArray(child) && !isReactInstance(child))
      fn(child)

    Object.keys(renderedChildren).forEach(
      key => fn(renderedChildren[key])
    );
  }
  else if (isCompositeComponent(publicInst)) {
    fn(inst._renderedComponent);
  }
}


export function createNode(subject, lastWrapper) {
  let element, inst;

  if (React.isValidElement(subject))
    element = subject, inst = null;

  else if (isReactInstance(subject))
    element = subject._currentElement, inst = subject;

  return Object.defineProperties({}, {
    element: { get: () => element, enumerable: true },
    instance: { value: inst, enumerable: true },
    parentNode: { value: lastWrapper, enumerable: true },
    prevSibling: {
      enumerable: true,
      get(){
        let children = lastWrapper ? lastWrapper.children : []
          , idx = children.indexOf(inst || element) - 1

        return idx < 0 ? null : createNode(children[idx], lastWrapper)
      }
    },
    nextSibling: {
      enumerable: true,
      get(){
        let children = lastWrapper ? lastWrapper.children : []
          , idx = children.indexOf(inst || element) + 1

        return idx >= children.length ? null : createNode(children[idx], lastWrapper)
      }
    },
    children: {
      enumerable: true,
      get(){
        let children = [];
        eachChild(inst || element, child => children.push(child))
        return children
      }
    }
  })
}
