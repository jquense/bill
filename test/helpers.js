import React from 'react';
import { create as createFragment } from 'react/lib/ReactFragment';
import { IS_REACT_14 } from '../src/compat';

export { createFragment };

export function component (fn) {
  return IS_REACT_14 ? fn
    : React.createClass({
        render(){
          return fn(this.props, this.context)
        }
    })
}

// IT'S FINE; better then juggling around react-dom
export let render = IS_REACT_14
  ? React.__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.render
  : React.render;
