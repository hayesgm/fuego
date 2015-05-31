"use strict";

import {env} from "env";

function trace() {
  if (arguments.length == 1) {
    console.log(arguments[0]);  
  } else {
    console.log(arguments);
  }
}

if (env.debug) {
  var debug = trace;
} else {
  var debug = function() {};
}

let Logging = {
  debug: debug,
  trace: trace
};

export default Logging;