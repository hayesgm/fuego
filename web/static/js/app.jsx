import {trace,debug} from "./services/logging";

var React = require('./react');
var Router = require('./react-router');
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

var {PoolBar} = require('./components/pool_bar');
var {Dashboard} = require('./components/dashboard');
var {PoolView} = require('./components/pool_view');

var BlobStore = require('./stores/blob_store');
var ChunkStore = require('./stores/chunk_store');

import Pool from './services/pool'
import {socket, peer_id} from './services/init'; // initialize

class App extends React.Component {
  constructor() {
    super()
  }

  fetchPool(pool_id) {
    Pool.fetch(socket, peer_id, pool_id);
  }

  render () {
    return (
      <div className="full row">
        <PoolBar/>
        <div className="col-xs-7 col-sm-8" id="main">
          <RouteHandler fetchPool={this.fetchPool}/>
        </div>
      </div>
    )
  }
}

// declare our routes and their hierarchy
var routes = (
  <Route handler={App} path="">
    <Route path="" handler={Dashboard}/>
    <Route path=":pool_id" name="pool" handler={PoolView}/>
  </Route>
);

Router.run(routes, Router.HashLocation, (Root) => {
  React.render(<Root/>, document.getElementById('top'));
});
