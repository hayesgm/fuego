import React from '../react'
import {Link} from '../react-router'
import PoolStore from '../stores/pool_store'

class PoolBarList extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {pools: []};
  };

  componentDidMount() {
    this.unsubscribe = PoolStore.listen(this.onPoolChange.bind(this));
    this.onPoolChange();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onPoolChange() {
    PoolStore.getPools().then((pools) => {
      this.setState({
        pools: pools
      });
    });
  }

  render() {
    var poolList = this.state.pools.map((pool) => {
      return (
        <li key={pool.pool_id}>
          <Link to="pool" params={{pool_id: pool.pool_id}}>
            <span className="name">{pool.description}</span>
            <span className="status {pool.status}" />
          </Link>
        </li>
      )
    });

    return (
      <ul id="pools">
        {poolList}
      </ul>
    );
  }
}

export class PoolBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="col-xs-5 col-sm-4" id="leftNav">
        <div className="row">
          <div className="col-xs-12" id="navigation">
            <PoolBarList/>
          </div>
        </div>

        <div className="row" id="bottomNav">
          <div className="col-md-12">
            <div className="row">
              <div className="col-md-12">
                <button id="upload" type="button" className="btn btn-default btn-lg">Upload</button>
                <input type="file" id="fileInput" />
              </div>
            </div>
            <div className="row">
              by <a href="https://twitter.com/justHGH">justHGH</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
