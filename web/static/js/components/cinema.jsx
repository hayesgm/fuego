import React from '../react'
import {trace,debug} from "../services/logging"

var MAX_RAW_SIZE = 100 * Math.pow(2, 10); // 100 KB

export class Cinema extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      showVideo: false
    };
  }

  playVideo(pool) {
    this.setState({
      showVideo: !this.state.showVideo,
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
    if (!this.props.finished) {
      return (
        <div className="cinema"/>
      );
    } else {
      if (!this.props.url) {
        return (
          <div className="cinema">
            <div className="loading">Pulling the curtains...</div>
          </div>
        );
      }
    }

    var cinema = [];

    if (this.props.isViewRaw) {
      // If we're in raw mode, just show raw in a pre
      cinema.push(
        <pre key="raw">{this.joinBuffers(this.props.buffers)}</pre>
      );
    } else {
      // Otherwise, let's decide what to show

      if (this.props.pool.description.match(/\.mp4$/i)) { // A video
        if (this.state.showVideo) {
          cinema.push(
            <video key="video" src={this.props.url} autoPlay="true" ref="video" controls="true"></video>
          );
        } else {
          cinema.push(
            <button key="play" type="button" className="btn btn-default btn-lg play" onClick={()=>this.playVideo(this.props.pool)}>Play Video</button>
          );
        }
      } else if (this.props.pool.description.match(/\.(png|gif|jpg)$/i)) { // A picture
        cinema.push(
          <img key="image" src={this.props.url} />
        );
      } else if (this.props.pool.description.match(/\.(md)$/i)) { // A markdown document
        cinema.push(
          <pre key="markdown" dangerouslySetInnerHTML={{__html: marked(this.joinBuffers(this.props.buffers))}} />
        );
      } else if (this.props.pool.description.match(/\.(txt)$/i)) { // A text document
        cinema.push(
          <pre key="text">{this.joinBuffers(this.props.buffers)}</pre>
        );
      } else {
        cinema.push(
          <a key="download" className="btn btn-default btn-lg download" href={this.props.url} download={this.props.pool.description}>Download {this.props.pool.description}</a>
        );
      }
    }

    return (
      <div className="cinema">{cinema}</div>
    );
  }
}
