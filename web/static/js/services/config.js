import {env} from 'env';

let Config = {
  PEER_JS_API_KEY: 'dx24ylo616y9zfr',
  PEER_JS_SERVER: 'fuego-peer-server.herokuapp.com',
  ENDPOINT: env.prod ? "wss://fuego-hgh.herokuapp.com/pm" : "/pm",
  POOL_EXAMPLES: {
    "a2f77ba909ded2a19a926dcd3fe0e45f17796dcacb65fc7a56bdb6e72411a7c1": "A Document",
    "63205cc0f66c2efb9d58a32548350d5c5b414e5996da9f6252724ecb54a2a5bb": "A Picture",
    "9a177a8cad9a8dcba77a58f76ca7af8b82b80a6ccb4bf301fea9c1863b4d0ca6": "A Video"
  }
};

export default Config;