import React from 'react';
import semver from 'semver';

// let version = React.version.split('.')

// const MAJOR = version[0] == 0 ? version[1] : version[0]

export const IS_REACT_13 = React.version.slice(0, 4) === '0.13';
export const IS_REACT_14 = React.version.slice(0, 4) === '0.14';

export function ifDef(hash) {
  let result;
  Object.keys(hash).some(ver => {
    if (semver.satisfies(React.version, ver)) {
      result = hash[ver]
      return true
    }
  });

  return result
}
