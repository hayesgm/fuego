import {Socket} from "phoenix"
import Peer from "./peer"
import Pool from "./pool"
import {trace,debug} from "./logging";

let socket = new Socket("/pm");

trace("peer", Peer.peer_id, "online...");

socket.connect();

Pool.refresh(socket, Peer.peer_id);

debug("ready...");

let Init = {
  socket: socket,
  peer_id: Peer.peer_id
};

export default Init;