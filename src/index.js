import { isValidElement } from 'react';
import * as elements from './element-selector';
import * as instance from './instance-selector';

function match(selector, element){
  if (isValidElement(element))
    return elements.match(selector, element)

  return instance.match(selector, element)
}

module.exports = {
  match,
  selector: elements.compiler.selector 
}
