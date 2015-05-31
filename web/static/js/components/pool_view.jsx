"use strict";

import React from 'react';
import {trace,debug} from "services/logging";
import PoolStore from 'stores/pool_store';
import {Cinema} from 'components/cinema';
import ChunkStore from 'stores/chunk_store';
import {NetworkStats} from 'components/network_stats';
import {PoolViewInfo} from 'components/pool_view_info';
import {PoolViewHeader} from 'components/pool_view_header';
import Pool from 'services/pool';

export class PoolView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pool: null,
      poolChunks: [],
      percentComplete: null,
      buffers: null,
      url: null,
    };

    // We may want to immediately set the state, which we have to do after this returns
    setTimeout(() => {
      this.onPoolIdChange(props);
    }, 0);
  };

  componentWillReceiveProps(props) {
    debug("getting da props");

    this.onPoolIdChange(props)
  }

  componentWillUnmount() {
    this.clearURL();
  }

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
        finished: poolChunks.length == pool.chunks.length,
      });
    } else {
      if (props.poolsLoaded) {
        debug("pool view // didn't find pool");

        props.fetchPool(props.params.pool_id);
      }
    }

    if (pool) {
      if (!this.state.pool || ( this.state.pool.pool_id != props.params.pool_id) ) {
        // We've changed pools we're looking at, always re-fetch
        this.clearURL();

        this.fetchData(pool, props.chunks[pool.pool_id]);
      } else {

        // We're looking at the same pool, see if we should fetch if we have a complete download
        if (this.state.url == null) { // only bother if we don't have a url built
          this.fetchData(pool, props.chunks[pool.pool_id]); // download that m-f
        }
      }
    }
  }

  clearURL() {
    if (this.state.url) {
      // clear the url
      URL.revokeObjectURL(this.state.url);
      this.setState({
        isViewRaw: false,
        buffers: null,
        url: null,
      });
    }
  }

  fetchData(pool, chunks) {
    debug("re-fetching pool data for pool view");

    if (chunks && pool.chunks.length == chunks.length) { // only build if we have a complete download
      Pool.getPoolBuffers(pool).then((arrayBuffers) => {
        let blob = new Blob(arrayBuffers);
        let url = URL.createObjectURL(blob);

        this.setState({
          buffers: arrayBuffers,
          url: url,
        });
      });
    }
  }

  viewRaw() {
    debug("view raw", this.state);

    this.setState({
      isViewRaw: !this.state.isViewRaw,
    });
  }

  render() {
    debug("pool", this.state.pool);

    if (!this.state.pool) {
      return <div></div>;
    } else {

      return (
        <div className="pool-view">

          <PoolViewHeader pool={this.state.pool} chunks={this.state.poolChunks} url={this.state.url} buffers={this.state.buffers} deletePool={this.props.deletePool} viewRaw={this.viewRaw.bind(this)} isViewRaw={this.state.isViewRaw} finished={this.state.finished} />

          <PoolViewInfo pool={this.state.pool} percentComplete={this.state.percentComplete} />

          <NetworkStats pool={this.state.pool} poolChunks={this.state.poolChunks} percentComplete={this.state.percentComplete}/>

          <Cinema pool={this.state.pool} chunks={this.state.poolChunks} url={this.state.url} buffers={this.state.buffers} deletePool={this.props.deletePool} isViewRaw={this.state.isViewRaw} finished={this.state.finished}/>
        </div>
      );
    }
  }
}
