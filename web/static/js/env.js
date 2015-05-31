"use strict";

let prod = location.host.match(/^dev|localhost/i);

export default {
  mode: {
    debug: !prod,
    prod: prod
  }
};