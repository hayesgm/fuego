"use strict";

import Reflux from 'includes/reflux';

let createPool = Reflux.createAction({async_result: true});
let storeChunk = Reflux.createAction({async_result: true});
let storeBlob = Reflux.createAction({async_result: true});
let removePool = Reflux.createAction({async_result: true});

let Actions = {
  createPool: createPool,
  storeChunk: storeChunk,
  storeBlob: storeBlob,
  removePool: removePool,
};

export default Actions;