import React from 'react';
import { create as createFragment } from 'react/lib/ReactFragment';
import { ifDef } from '../src/compat';

let ReactDOM;
try {
  ReactDOM = require('react/lib/ReactDOM')
}
catch (err){} //eslint-disable-line

export { createFragment };

export let component  = ifDef({
  '<0.14.0': fn => React.createClass({
      render(){
        return fn(this.props, this.context)
      }
  }),
  '*': fn => fn
})

// IT'S FINE; better then juggling around react-dom
export let render = ifDef({
  '>=0.14.0': ReactDOM.render,
  '*': React.render
});
