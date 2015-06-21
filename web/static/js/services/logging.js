"use strict";

import {env} from "env";

var logs = [];

function display() {
  if (arguments.length == 1) {
    console.log(arguments[0]);  
  } else {
    console.log(arguments);
  }
}

function trace() {
  logs.push(arguments);

  if (env.debug) {
    display.call(null, arguments);
  }
}

if (env.debug) {
  var debug = display;
} else {
  var debug = function() {};
}

let Logging = {
  debug: debug,
  trace: trace,
  logs: () => { return logs; }
};

export default Logging;