"use strict";

let prod = location.host.match(/^dev|localhost/i);

export default {
  env: {
    debug: !prod,
    prod: prod
  }
};