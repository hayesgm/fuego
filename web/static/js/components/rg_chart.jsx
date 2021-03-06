"use strict";

import React from 'includes/react';
import {trace,debug} from "services/logging";

export class RGChart extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    // TODO: This should probably move out of "NetworkStats"
    // debug("lookin' at",this.props.pool.chunks,this.props.chunks);

    let rgChart = this.props.pool.chunks.map((chunk) => {
      let exists = this.props.chunks.filter(c => c.chunk == chunk).length > 0;
      return (<div className={exists ? 'green' : 'red'} key={chunk}></div>);
    });

    return (
      <div className="rgChart">{rgChart}</div>
    );
    
  }
}