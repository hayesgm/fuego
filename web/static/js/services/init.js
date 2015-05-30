import {Socket} from "phoenix"
import Peer from "./peer"
import Pool from "./pool"
import {trace,debug} from "./logging";
import db from "../models/database";
import Chunks from './chunks'

let socket = new Socket("/pm");

trace("peer", Peer.peer_id, "online...");

socket.connect();

Pool.refresh(socket, Peer.peer_id);

debug("ready...");

window.fuego = function() {
  return {
    peer: Peer,
    db: {
      peer_id: Peer.peer_id,
      server: db.getServer(),
      pools: db.getServer().then((server) => { return server.pools.query().all().execute().then(x => {trace("pools",x)}) }),
      chunks: db.getServer().then((server) => { return server.chunks.query().all().execute().then(x => {trace("chunks",x)}) }),
      blobs: db.getServer().then((server) => { return server.blobs.query().all().execute().then(x => {trace("blobs",x)}) })
    },
    downloads: Chunks.getActiveDownloads(),
    queue: Chunks.getDownloadQueue(),
  };
};

let Init = {
  socket: socket,
  peer_id: Peer.peer_id
};

export default Init;