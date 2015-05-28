import React from '../react'
import {trace,debug} from "../services/logging"
import PoolStore from '../stores/pool_store'
import {Cinema} from './cinema'
import ChunkStore from '../stores/chunk_store'
import {NetworkStats} from './network_stats'

export class PoolView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pool: null,
      poolChunks: [],
      percentComplete: null,
    };

    // We may want to immediately set the state, which we have to do after this returns
    setTimeout(() => {
      this.onPoolIdChange(props);
    }, 0);
  };

  onPoolIdChange(props) {
    let pool = props.pools.filter((pool) => {
      return pool.pool_id == props.params.pool_id;
    })[0];

    if (pool) {
      debug("pool view // setting pool", pool.pool_id);
      let poolChunks = props.chunks[pool.pool_id] || [];

      this.setState({
        pool: pool,
        poolChunks: poolChunks,
        percentComplete: Math.round(poolChunks.length / ( pool.chunks.length / 100.0 ) ),
      });
    } else {
      if (props.poolsLoaded) {
        debug("pool view // didn't find pool");

        props.fetchPool(props.params.pool_id);
      }
    }
  }

  componentWillReceiveProps(props) {
    debug("getting da props");

    this.onPoolIdChange(props)
  }

  render() {    
    debug("pool", this.state.pool);

    if (!this.state.pool) {
      return <div>Loading...</div>;
    } else {

      if (this.state.percentComplete == 100) {
        var downloadStatus = (
          <span>Download Complete, Seeding</span>
        );
      } else {
        var downloadStatus = (
          <span>Downloading...</span>
        );
      }

      return (
        <div className="poolView">
          <a className="btn btn-default btn-lg" onClick={()=>this.props.deletePool(this.state.pool)}>Remove</a>

          <div className="header">
            <h1>{this.state.pool.description}</h1>
            <h4>{downloadStatus}</h4>
          </div>

          <NetworkStats pool={this.state.pool} poolChunks={this.state.poolChunks} percentComplete={this.state.percentComplete}/>

          <div className="row" id="actionArea">
            <div className="col-lg-12">
              <Cinema pool={this.state.pool} chunks={this.state.poolChunks} />
            </div>
          </div>
        </div>
      );
    }
  }
}
