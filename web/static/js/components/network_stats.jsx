"use strict";

import React from 'includes/react'
import {trace,debug} from "services/logging"
import {getActiveDownloads} from 'services/chunks'
import {getActiveUploads} from 'services/peer'
import {RGChart} from 'components/rg_chart'
import {peer} from 'services/peer'

export class NetworkStats extends React.Component {
  
  constructor(props) {
    super(props);
    this.interval = 2000;

    this.state = {
      peers: 0,
      currentIn: null,
      currentOut: null,
      rateIn: null,
      rateOut: null,
    };
  };

  componentDidMount() {
    this.timer = setInterval(() => {
      this.getNetworkStats();
    }, this.interval);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentWillReceiveProps(props) {
    // are we changing pools?
    if (this.props.pool.pool_id !== props.pool.pool_id) {
      this.setState({
        peers: 0,
        currentIn: null,
        currentOut: null,
        rateIn: null,
        rateOut: null,
      });
    }
  }

  getNetworkStats() {
    let pool = this.props.pool;

    let downloadRemotes = getActiveDownloads().filter(a => { return a[0] == pool.pool_id; });
    let downloadRemoteConnections = downloadRemotes.filter(r => peer().connections[r[2]]).map(r => { return peer().connections[r[2]][0].pc });

    let uploadRemoteConnections = getActiveUploads().filter(a => { return a[0] == pool.pool_id; }).map(a => { return a[2].pc; });

    // from http://stackoverflow.com/questions/1960473/unique-values-in-an-array
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    let remoteConnections = downloadRemoteConnections.concat(uploadRemoteConnections).filter(c => { return !!c; }).filter(onlyUnique);

    // debug("rc", pool.pool_id, remoteConnections.length);

    let promises = remoteConnections.map(conn => {
      return new Promise((resolve, reject) => {

        // from http://stackoverflow.com/questions/25069419/webrtc-getstat-api-set-up
        conn.getStats((r) => {

          // from http://stackoverflow.com/questions/27699144/which-element-in-webrtc-api-stat-refer-to-incoming-bit-rate
          let pairStats = r.result().filter(x => { return x.type == "googCandidatePair" && x.stat("googActiveConnection") === "true" });

          if (pairStats[0]) {
            let bytesSent = parseInt(pairStats[0].stat('bytesSent'));
            let bytesReceived = parseInt(pairStats[0].stat('bytesReceived'));

            resolve([bytesReceived, bytesSent]);
          } else {
            resolve([0,0]);
          }
        });
      });
    });

    Promise.all(promises).then((results) => {
      let [bytesIn, bytesOut] = results.reduce(([currIn, currOut], [bytesIn, bytesOut]) => {
        return [currIn + bytesIn, currOut + bytesOut];
      }, [0,0]);

      this.setState({
        peers: remoteConnections.length,
        currentIn: bytesIn,
        currentOut: bytesOut,
        rateIn: this.state.currentIn !== null ? ( bytesIn - this.state.currentIn ) / ( this.interval / 1000.0 ) : null,
        rateOut: this.state.currentOut !== null ? ( bytesOut - this.state.currentOut ) / ( this.interval / 1000.0 ) : null,
      });
    });
  }

  percentComplete() {
    if (this.props.pool.chunks.length > 0) {
      return (
        <span>{this.props.percentComplete}%</span>
      );
    } else {
      return (<span>N/A</span>);
    }
  }

  byteRate(r) {
    if (!r || r < 0) {
      return "0 KB/s";
    } else {
      return Math.round(r / 1024.4) + "KB/s";
    }
  }

  plural(number, single, plural) {
    if (number == 1) {
      return [number, single].join(" ");
    } else {
      return [number, plural].join(" ");
    }
  }

  render() {
    return (
      <div className="network-stats info">
        <dl className="dl-horizontal">
          <dt>Network</dt>
          <dd>{this.plural(this.state.peers, "Active Peer", "Active Peers")}</dd>

          <dt>Upload</dt>
          <dd>{this.byteRate(this.state.rateOut)}</dd>

          <dt>Download</dt>
          <dd>{this.byteRate(this.state.rateIn)}</dd>

          <dt>Status ({this.percentComplete()})</dt>
          <dd><RGChart pool={this.props.pool} chunks={this.props.poolChunks} /></dd>

        </dl>
      </div>
    );
  }
}
