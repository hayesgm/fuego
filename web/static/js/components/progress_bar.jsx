import React from '../react'
import {trace,debug} from "../services/logging"

export class ProgressBar extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    let widthPercent = Math.round(this.props.chunks.length / ( this.props.pool.chunks.length / 100.0 ) );

    return (
      <div className="progressBar">
        <div className="inner" style={ { width: widthPercent + "%" } }/>
      </div>
    );
    
  }
}
