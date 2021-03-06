"use strict";

import React from 'includes/react';
import {trace,debug} from "services/logging";

export class ProgressBar extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    let percent = Math.round(this.props.chunks.length / ( this.props.pool.chunks.length / 100.0 ) );

    if (percent < 100) {
      return (
        <div className="progressBar">
          <div className="inner" style={ { width: percent + "%" } }>{percent}%&nbsp;</div>
        </div>
      );
    } else {
      return (
        <div className="progressBar">
          <div className="inner" style={ { width: percent + "%" } } />
        </div>
      );
    }
    
  }
}
