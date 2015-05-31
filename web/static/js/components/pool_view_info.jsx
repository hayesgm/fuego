"use strict";

import React from 'react';
import {trace,debug} from "services/logging";
import PoolStore from 'stores/pool_store';
import Pool from 'services/pool';

export class PoolViewInfo extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.percentComplete == 100) {
      var downloadStatus = (
        <span>Download Complete, Seeding</span>
      );
    } else {
      var downloadStatus = (
        <span>Downloading...</span>
      );
    }

    return (
      <div className="pool-info">
        <h1>{this.props.pool.description}</h1>
        <h4>{downloadStatus}</h4>
      </div>
    );
  }
}
