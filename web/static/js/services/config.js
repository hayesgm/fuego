import {env} from 'env';

let Config = {
  PEER_JS_API_KEY: 'dx24ylo616y9zfr',
  PEER_JS_SERVER: 'fuego-peer-server.herokuapp.com',
  ENDPOINT: env.prod ? "wss://fuego-hgh.herokuapp.com/pm" : "/pm",
  POOL_EXAMPLES: {
    "8fd0cb083d634b320d86550b116e4bcfac4c54d6b00a7fff5ff85eabb3dcb2cc": "A Document",
    "63205cc0f66c2efb9d58a32548350d5c5b414e5996da9f6252724ecb54a2a5bb": "A Picture",
    "9a177a8cad9a8dcba77a58f76ca7af8b82b80a6ccb4bf301fea9c1863b4d0ca6": "A Video"
  }
};

export default Config;