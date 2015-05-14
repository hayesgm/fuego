
function trace() {
  if (arguments.length == 1) {
    console.log(arguments[0]);  
  } else {
    console.log(arguments);
  }  
}

let Logging = {
  debug: trace,
  trace: trace
};

export default Logging;