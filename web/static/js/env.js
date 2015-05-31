"use strict";

let prod = !/^dev|localhost/.test(location.host);

export default {
  env: {
    debug: !prod,
    prod: prod
  }
};