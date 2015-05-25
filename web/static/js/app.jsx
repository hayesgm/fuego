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
var PoolStore = require('./stores/pool_store');

import Pool from './services/pool'
import {socket, peer_id} from './services/init'; // initialize

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      pools: [],
      chunks: {}
    }
  }

  componentDidMount() {
    this.unsubscribePool = PoolStore.listen(this.onPoolChange.bind(this));
    this.unsubscribeChunk = ChunkStore.listen(this.onChunkChange.bind(this));

    // Initial load
    this.onPoolChange();
  }

  componentWillUnmount() {
    this.unsubscribePool();
    this.unsubscribeChunk();
  }

  onPoolChange() {
    PoolStore.getPools().then((pools) => {
      pools.map((pool) => {
        ChunkStore.getChunks(pool.pool_id).then((chunks) => {
          // TODO: This should be atomic?
          let allChunks = this.state.chunks;
          allChunks[pool.pool_id] = chunks;

          this.setState({
            chunks: allChunks,
          });
        });
      });

      this.setState({
        pools: pools,
      });
    });
  }

  onChunkChange(chunk) {
    // TODO: This should be atomic?
    let chunks = this.state.chunks;
    chunks[chunk.pool_id].push(chunk);
    this.setState({
      chunks: chunks,
    });
  }

  fetchPool(pool_id) {
    Pool.fetch(socket, peer_id, pool_id);
  }

  uploadFile(file) {
    // Create and register file
    Pool.createFromFile(file).then((pool) => {
      this.context.router.transitionTo('pool', {pool_id: pool.pool_id});
      Pool.register(socket, peer_id, pool);
    });
  }

  render () {
    return (
      <div className="full row">
        <PoolBar uploadFile={this.uploadFile.bind(this)} pools={this.state.pools} chunks={this.state.chunks}/>
        <div className="col-xs-7 col-sm-8" id="main">
          <RouteHandler fetchPool={this.fetchPool} pools={this.state.pools} chunks={this.state.chunks} />
        </div>
      </div>
    )
  }
}

App.contextTypes = {
  router: React.PropTypes.func.isRequired
};

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
