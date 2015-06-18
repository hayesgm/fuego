"use strict";

var guid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

var diff = function(a, b) {
  return a.filter(function(i) {return b.indexOf(i) < 0;});
};

var assert = function(assertion, message) {
  if (!assertion) {
    throw message;
  }
}

let Helpers = {
  guid: guid,
  diff: diff,
  assert: assert,
  values: obj => Object.keys(obj).map(key => obj[key])
};

export default Helpers;