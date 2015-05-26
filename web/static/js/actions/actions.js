let Reflux = require('../reflux');

let createPool = Reflux.createAction({async_result: true});
let storeChunk = Reflux.createAction({async_result: true});
let storeBlob = Reflux.createAction({async_result: true});

let Actions = {
  createPool: createPool,
  storeChunk: storeChunk,
  storeBlob: storeBlob
};

export default Actions;