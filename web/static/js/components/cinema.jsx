import React from '../react'
import {trace,debug} from "../services/logging"
import PoolStore from '../stores/pool_store'
import Pool from '../services/pool'

export class Cinema extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      buffers: null,
      url: null,
    };

    // We may want to immediately set the state, which we have to do after this returns
    setTimeout(() => {
      this.componentWillReceiveProps(props);
    }, 0);
  }

  componentWillReceiveProps(props) {
    debug("cinema props", this.state.url, props, this.props);
    if (this.props.pool.pool_id != props.pool.pool_id) {
      // We've changed pools we're looking at, always re-fetch
      this.clearURL();

      this.fetchData(props.pool);
    } else {
      // We're looking at the same pool, see if we should fetch if we have a complete download

      if (this.state.url == null) { // only bother if we don't have a url built
        if (props.pool.chunks.length == props.chunks.length) { // only build if we have a complete download
          this.fetchData(props.pool); // download that m-f
        }
      }
    }
  }

  componentWillUnmount() {
    this.clearURL();
  }

  clearURL() {
    if (this.state.url) {
      // clear the url
      URL.revokeObjectURL(this.state.url);
      this.setState({
        buffers: null,
        url: null,
      });
    }
  }

  fetchData(pool) {
    debug("re-fetching data for cinema");

    Pool.getPoolBuffers(pool).then((arrayBuffers) => {
      let blob = new Blob(arrayBuffers);
      let url = URL.createObjectURL(blob);

      this.setState({
        buffers: arrayBuffers,
        url: url,
      });
    });
  }

  playVideo(pool) {
    this.setState({
      showVideo: !this.state.showVideo,
    });
  }

  viewRaw(pool) {
    this.setState({
      viewRaw: !this.state.viewRaw,
    });
  }

  joinBuffers(buffers) {
    let length = buffers.reduce((res,b) => { return res + b.byteLength; }, 0);
    let res = new Uint8Array(length);
    let pos = 0;

    buffers.forEach((buffer) => {
      res.set(new Uint8Array(buffer), pos);
      pos += buffer.byteLength;
    });

    return String.fromCharCode.apply(null, new Uint16Array(res));;
  }

  render() {
    if (!this.state.url) {
      return (<div className="cinema loading">Pulling the curtains...</div>);
    }

    var cinema = [];

    cinema.push(<a key="download" className="btn btn-default btn-lg" href={this.state.url} download={this.props.pool.description}>Download</a>);
    cinema.push(
      <button key="view-raw" type="button" className="btn btn-default btn-lg" onClick={()=>this.viewRaw(this.props.pool)}>View Raw</button>
    );

    if (this.state.viewRaw) {
      cinema.push(
        <pre key="raw">{this.joinBuffers(this.state.buffers)}</pre>
      );
    } else {
      if (this.props.pool.description.match(/\.mp4$/i)) {
        cinema.push(
          <button key="play" type="button" className="btn btn-default btn-lg" onClick={()=>this.playVideo(this.props.pool)}>Play Video</button>
        );

        if (this.state.showVideo) {
          cinema.push(
            <video key="video" src={this.state.url} autoPlay="true" ref="video" controls="true"></video>
          );
        }
      }

      if (this.props.pool.description.match(/\.(png|gif|jpg)$/i)) {
        cinema.push(
          <img key="image" src={this.state.url} />
        );
      }

      if (this.props.pool.description.match(/\.(md)$/i)) {
        cinema.push(
          <pre key="markdown" dangerouslySetInnerHTML={{__html: marked(this.joinBuffers(this.state.buffers))}} />
        );
      }
    }


    return <div className="cinema">{cinema}</div>;
  }
}
