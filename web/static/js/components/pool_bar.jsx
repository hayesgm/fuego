"use strict";

import React from 'includes/react';
import {Link} from 'includes/react-router';
import PoolStore from 'stores/pool_store';
import {debug} from 'services/logging';
import Pool from 'services/pool';
import {ProgressBar} from 'components/progress_bar';

class PoolBarList extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    
    var poolList = this.props.pools.map((pool) => {
      let chunks = this.props.chunks[pool.pool_id] || [];

      return (
        <li key={pool.pool_id}>
          <Link to="pool" params={{pool_id: pool.pool_id}}>
            <div className="name">
              <div className="desc">{pool.description}</div>
              <ProgressBar pool={pool} chunks={chunks}/>
            </div>
          </Link>
        </li>
      )
    });

    return (
      <ul id="pools">
        <li key="dashboard">
          <Link to="dashboard">
            <div className="name">
              <div className="desc">Dashboard</div>
            </div>
          </Link>
        </li>
        {poolList}
      </ul>
    );
  }
}

export class PoolBar extends React.Component {
  constructor(props) {
    super(props);
  }

  selectFile() {
    React.findDOMNode(this.refs.file).click();
  }

  uploadFile(e) {
    var fileInput = e.target;
    var file = fileInput.files[0];

    debug('file', [file.name, file.size, file.type, file.lastModifiedDate]);
    
    if (file.size === 0 && !file.name) {
      return; // do nothing
    } else {
      debug("uploading", file);

      this.props.uploadFile(file);
    }
  }

  render() {
    return (
      <div id="leftNav">
        <div id="navigation">
          <PoolBarList pools={this.props.pools} chunks={this.props.chunks}/>
        </div>

        <div id="bottom-navigation">
          <div id="upload">
            <button id="upload" type="button" className="btn btn-default btn-lg" onClick={this.selectFile.bind(this)}>Add Pool</button>
            <input type="file" id="fileInput" ref="file" onChange={this.uploadFile.bind(this)}/>
          </div>
          
          <div id="credits">
            by <a href="https://twitter.com/justHGH">justHGH</a>
          </div>
        </div>
      </div>
    );
  }
}
