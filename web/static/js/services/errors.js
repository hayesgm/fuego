"use strict";

import {env} from 'env';
import {logs} from 'services/logging';

function init() {
  // To help us debug, add logs and set release stage if we've included Bugsnag
  if (typeof(window.Bugsnag) !== 'undefined') {
    Bugsnag.beforeNotify = function(payload, metaData) {
      metaData.logs = {
        trace: logs()
      };
    };

    Bugsnag.notifyReleaseStages = ["dev", "prod"];
    Bugsnag.releaseStage = env.prod ? "prod" : "dev";
  }
}

export default {
  init: init
};