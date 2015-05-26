import React from '../react'
import {trace,debug} from "../services/logging"
import PoolStore from '../stores/pool_store'
import {Cinema} from './cinema'
import {RGChart} from './rg_chart'
import ChunkStore from '../stores/chunk_store'

export class PoolView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pool: null,
      poolChunks: [],
      poolsLoaded: false
    }
  };

  onPoolIdChange(props) {
    let pool = props.pools.filter((pool) => {
      return pool.pool_id == props.params.pool_id;
    })[0];

    if (pool) {
      let poolChunks = props.chunks[pool.pool_id] || [];

      this.setState({
        pool: pool,
        poolChunks: poolChunks,
        percentComplete: Math.round(poolChunks.length / ( pool.chunks.length / 100.0 ) ),
      });
    } else {
      if (props.poolsLoaded) {
        props.fetchPool(props.params.pool_id);
      }
    }
  }

  componentWillReceiveProps(props) {
    debug("props changing", props);
    this.onPoolIdChange(props)
  }

  percentComplete() {
    if (this.state.pool.chunks.length > 0) {
      return (
        <span>{this.state.percentComplete}%</span>
      );
    } else {
      return (<span>N/A</span>);
    }
  }

  render() {    
    debug("pool", this.state.pool);

    if (!this.state.pool) {
      return <div>Loading...</div>;
    } else {

      if (this.state.percentComplete == 100) {
        let downloadStatus = (
          <span>Download Complete, Seeding</span>
        );
      } else {
        let downloadStatus = (
          <span>Downloading...</span>
        );
      }

      return (
        <div className="poolView">
          <div className="header">
            <h1>{this.state.pool.description}</h1>
            <h4>{status}</h4>
          </div>

          <div id="info">
            <dl className="dl-horizontal">
              <dt>Network</dt>
              <dd>5 Peers</dd>

              <dt>Upload</dt>
              <dd>10 KB/s</dd>

              <dt>Download</dt>
              <dd>120 KB/s</dd>

              <dt>Status ({this.percentComplete()})</dt>
              <dd><RGChart pool={this.state.pool} chunks={this.state.poolChunks} /></dd>

            </dl>
          </div>

          <div className="row" id="actionArea">
            <div className="col-lg-12">
              <Cinema pool={this.state.pool} chunks={this.state.poolChunks}/>
            </div>
          </div>
        </div>
      );
    }
  }
}
