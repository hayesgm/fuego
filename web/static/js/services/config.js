import {env} from 'env';

let Config = {
  PEER_JS_API_KEY: 'dx24ylo616y9zfr',
  PEER_JS_SERVER: 'fuego-peer-server.herokuapp.com',
  ENDPOINT: env.prod ? "wss://fuego-hgh.herokuapp.com/pm" : "/pm";
};

export default Config;