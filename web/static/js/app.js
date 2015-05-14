import {Socket} from "phoenix"

var PEER_JS_API_KEY = 'dx24ylo616y9zfr';

var pc = new PeerConnection(configuration);

var changeHash = function() {
  var pool = location.hash.slice(1);

  console.log("hash changed to: " + pool);

  var socket = new Socket("/pm")
  socket.connect()
  var chan = socket.chan("pool:" + pool, {client: true});

  chan.on("offer_accepted", payload => {
    payload.offer
  });

  chan.join().receive("ok", response => {
    console.log("You are joinining...");
    console.log(response);

    response.chunks.forEach(chunk => {
    
      pc.createOffer(offer => {
        console.log(offer);
        chan.push("find_peer_for_chunk", {pool: pool, chunk: chunk, offer: JSON.stringify(offer)});
      });
    
    });
    // print

    location.hash = ""; // clear hash
  });
};

function registerPool(pool, description, chunks) {
  var socket = new Socket("/pm")
  socket.connect()
  
  trace("Registering pool for pool " + pool + " ( " + description + " ) ");
  trace(chunks)

  var createChan = socket.chan("pool:" + pool, {
    pool: pool,
    description: description,
    chunks: chunks
  });

  createChan.on("please_accept_offer", payload => {
    trace("i was told to accept offer");
    trace(payload);

    offer = new SessionDescription(JSON.parse(payload.offer));
    pc.setRemoteDescription(offer);

    pc.createAnswer(answer => {
      pc.setLocalDescription(answer);

      createChan.push("i_accept_offer", {})
    });
  });

  trace("Channel connected for pool " + pool);

  createChan.join().receive("ok", message => {
    trace("got message back...");
    trace(message);
  });
};

// This is for receipt
window.addEventListener("hashchange", changeHash);
let refresh = document.querySelector('#refresh');
refresh.addEventListener('click', changeHash);

// This is for create a pool
let fileInput = document.querySelector('input#fileInput');
fileInput.addEventListener('change', createNewPoolAndSeed, false);

var seeds = [];

function trace(msg) {
  console.log(msg);
}

function createNewPoolAndSeed() {
  fileInput.disabled = true;

  var file = fileInput.files[0];
  
  trace('file is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(' '));
  if (file.size === 0) {
    return;
  }

  var chunkSize = 16384;
  let chunkHashes = [];

  var sliceFile = function(offset) {
    var reader = new window.FileReader();
    reader.onload = (function() {
      return function(e) {
        trace("computing hash for: " + e.target.result);
        trace("chunk hash: " + CryptoJS.SHA256(e.target.result));
        chunkHashes.push(CryptoJS.SHA256(e.target.result).toString());

        if (file.size > offset + e.target.result.byteLength) {
          window.setTimeout(sliceFile, 0, offset + chunkSize);
        } else {
          // We're done walking through the slices

          let pool = CryptoJS.SHA256(chunkHashes.join("")).toString();

          registerPool(pool, file.name, chunkHashes);
          
          fileInput.disabled = false;
        }
      };
    })(file);
    
    var slice = file.slice(offset, offset + chunkSize);

    reader.readAsBinaryString(slice);
  };

  sliceFile(0);
}

let App = {
}

export default App
