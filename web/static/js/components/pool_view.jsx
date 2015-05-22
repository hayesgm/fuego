import React from '../react'
import {trace,debug} from "../services/logging"
import PoolStore from '../stores/pool_store'
import {Cinema} from './cinema'
import ChunkStore from '../stores/chunk_store'

export class PoolView extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {pools: []};
  };

  componentDidMount() {
    this.unsubscribePool = PoolStore.listen(this.onPoolChange.bind(this));
    this.unsubscribeChunk = ChunkStore.listen(this.onPoolChange.bind(this));

    // Start it off
    this.onPoolChange();
  }

  componentWillUnmount() {
    this.unsubscribePool();
    this.unsubscribeChunk();
  }

  onPoolChange() {
    PoolStore.getPools().then((pools) => {
      this.setState({
        pools: pools
      });

      // And find our specific pool
      this.onPoolIdChange(this.props);
    });
  }

  onPoolIdChange(props) {
    let pool = this.state.pools.filter((pool) => {
      return pool.pool_id == props.params.pool_id;
    })[0];

    if (pool) {
      // good, we're done
      this.setState({
        pool: pool
      });
    } else {
      this.props.fetchPool(props.params.pool_id);
    }
  }

  componentWillReceiveProps(props) {
    this.onPoolIdChange(props)
  }

  render() {    
    debug("pool", this.state.pool);

    if (!this.state.pool) {
      return <div>Loading...</div>;
    } else {

      return (
        <div className="poolView">
          <div className="header">
            <h1>{this.state.pool.description}</h1>
            <h4>Download Complete, Seeding</h4>
          </div>

          <div id="info">
            <dl className="dl-horizontal">
              <dt>Network</dt>
              <dd>5 Peers</dd>

              <dt>Upload</dt>
              <dd>10 KB/s</dd>

              <dt>Download</dt>
              <dd>120 KB/s</dd>
            </dl>
          </div>

          <div className="row" id="actionArea">
            <div className="col-lg-12">
              <Cinema pool={this.state.pool} />
            </div>
          </div>
        </div>
      );
    }
  }
}
