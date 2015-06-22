"use strict";

import {trace,debug} from 'services/logging';

import React from 'includes/react';
import Router from 'includes/react-router';

import {PoolBar} from 'components/pool_bar';
import {Dashboard} from 'components/dashboard';
import {PoolView} from 'components/pool_view';

import BlobStore from 'stores/blob_store';
import ChunkStore from 'stores/chunk_store';
import PoolStore from 'stores/pool_store';

import Actions from 'actions/actions';

import Pool from 'services/pool'
import Init from 'services/init';

let pError = Init.init(); // initialize
let socket = Init.socket(); // this needs to come after init is called
let peer_id = Init.peer_id;

var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      pools: [],
      chunks: {}
    }
  }

  componentDidMount() {
    this.unsubscribeOnPoolChange = PoolStore.listen(this.onPoolChange.bind(this));
    this.unsubscribeChunk = ChunkStore.listen(this.onChunkChange.bind(this));
    this.unsubscribeOnPoolRemove = Actions.removePool.listen(this.onPoolRemove.bind(this));

    // Initial load
    this.onPoolChange();

    pError.catch((error) => {
      console.log("danger!");
      this.setState({fatal: error});
    });
  }

  componentWillUnmount() {
    this.unsubscribeOnPoolChange();
    this.unsubscribeChunk();
    this.unsubscribeOnPoolRemove();
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
        poolsLoaded: true,
      });
    });
  }

  onPoolRemove(pool_id) {
    debug("removing pool from view", pool_id);

    let remainingPools = this.state.pools.filter(pool => pool.pool_id !== pool_id);
    delete this.state.chunks[pool_id]; // remove the pool from chunks

    this.setState({
      pools: remainingPools,
      chunks: this.state.chunks,
    });
  }

  onChunkChange(chunk) {
    // TODO: This should be atomic?
    debug("adding chunk", chunk.pool_id, chunk, "to", this.state.chunks);
    let chunks = this.state.chunks;

    if (chunks[chunk.pool_id]) { // skip if we don't know about pool
      let poolChunks = chunks[chunk.pool_id].map((chunk) => chunk.chunk);
      if (poolChunks.indexOf(chunk.chunk) === -1) {
        chunks[chunk.pool_id].push(chunk);
      }

      this.setState({
        chunks: chunks,
      });
    } else {
      debug("no pool for", chunk.pool_id);
    }
  }

  fetchPool(pool_id) {
    return Pool.fetch(socket, peer_id, pool_id);
  }

  deletePool(pool) {
    // first, redirect away
    this.context.router.transitionTo('dashboard');

    // then destroy the pool
    Pool.destroy(socket, peer_id, pool);
  }

  uploadFile(file) {
    // Create and register file
    Pool.createFromFile(file).then((pool) => {
      this.context.router.transitionTo('pool', {pool_id: pool.pool_id});
      Pool.register(socket, peer_id, pool);
    });
  }

  render () {
    console.log(this.state);
    if (this.state.fatal) {
      return (
        <div className="full-width">
          <div className="left">
            <PoolBar uploadFile={function() {}} pools={[]} chunks={[]}/>
          </div>
          <div className="right" id="main">
            <div className="pool-error">{this.state.fatal}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="full-width">
          <div className="left">
            <PoolBar uploadFile={this.uploadFile.bind(this)} pools={this.state.pools} chunks={this.state.chunks}/>
          </div>
          <div className="right" id="main">
            <RouteHandler fetchPool={this.fetchPool} deletePool={this.deletePool.bind(this)} pools={this.state.pools} chunks={this.state.chunks} poolsLoaded={this.state.poolsLoaded} />
          </div>
        </div>
      );
    }
  }
}

App.contextTypes = {
  router: React.PropTypes.func.isRequired
};

// declare our routes and their hierarchy
var routes = (
  <Route handler={App} path="">
    <Route path="/" handler={Dashboard} name="dashboard"/>
    <Route path=":pool_id" name="pool" handler={PoolView}/>
  </Route>
);

Router.run(routes, Router.HashLocation, (Root) => {
  React.render(<Root/>, document.getElementById('top'));
});
