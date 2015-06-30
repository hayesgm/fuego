"use strict";

import React from 'includes/react';
import {trace,debug} from "services/logging";
import PoolStore from 'stores/pool_store';
import Pool from 'services/pool';

var MAX_RAW_SIZE = 100 * Math.pow(2, 10); // 100 KB

export class PoolViewHeader extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    var header = [];

    if (this.props.finished) {
      header.push(<a key="download" className="btn btn-default btn-lg" href={this.props.url} download={this.props.pool.description}>Download</a>);
    }

    header.push(<button key="share" className="btn btn-default btn-lg" onClick={()=>this.props.viewShare()}>{this.props.isViewShare ? "Hide Sharing" : "Share"}</button>);
    header.push(<a key="remove" className="btn btn-default btn-lg" onClick={()=>this.props.deletePool(this.props.pool)}>Remove</a>);

    // Only do this if the file is less than max raw size
    if (this.props.finished && this.props.pool.total_size < MAX_RAW_SIZE) {
      header.push(
        <button key="view-raw" type="button" className="btn btn-default btn-lg" onClick={()=>this.props.viewRaw()}>{this.props.isViewRaw ? "View Normal" : "View Raw"}</button>
      );
    }

    if (this.props.isViewShare) {
      console.log(this.context);
      let poolUrl = "https://fuego.link/%23" + this.props.pool.pool_id; // this.context.navigation.makeHref('pool', {pool_id: this.props.pool.pool_id})
      header.push(
        <div key="share-panel" className="share-panel">
          <a className="btn btn-default btn-lg" href={"https://twitter.com/intent/tweet?url=" + poolUrl} target="_blank">Share {this.props.pool.description} via Twitter</a>
          <input type="text" value={"https://fuego.link/#" + this.props.pool.pool_id} onClick="this.select();" />
        </div>
      );
    }

    return (
      <div className="pool-view-header">{header}</div>
    );
  }
}