"use strict";

import {env} from "env";

var logs = [];

// Private function to display logs to screen
function display() {
  if (arguments.length == 1) {
    console.log(arguments[0]);  
  } else {
    console.log(arguments);
  }
}

// Trace will print logs in debug mode, and store logs in production mode so we can forward to error handler
function trace() {
  logs.push(Array.prototype.slice.call(arguments).join(", ")); // convert arguments to array and string (so we can gc any objects)

  if (env.debug) {
    display.call(null, arguments);
  }
}

// Debug will print logs in debug mode and do nothing in production mode
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