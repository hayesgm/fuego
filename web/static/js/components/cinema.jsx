"use strict";

import React from 'includes/react';
import {trace,debug} from "services/logging";

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

  // Clear video flag when navigating away from a pool
  componentWillReceiveProps(props) {
    if (this.state.showVideo) {
      if ( !props.pool || !this.props.pool || ( props.pool.pool_id !== this.props.pool.pool_id ) ) {
        this.setState({
          showVideo: false
        });
      }
    }
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

  componentDidUpdate() {
    debug("cinema 1", PDFJS);
    if (this.refs.pdf) {
      debug("cinema 2", this.props.url);
      let canvas = this.refs.pdf.getDOMNode()
      let ctx = canvas.getContext('2d');

      PDFJS.getDocument(this.props.url).then(function (pdfDoc) {
        pdfDoc.getPage(1).then(function(page) {

          var viewport = page.getViewport(scale);
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render PDF page into canvas context
          var renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          var renderTask = page.render(renderContext);
        });
      });
    }
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

      if (this.props.pool.description.match(/\.(mp4|webm)$/i)) { // A video
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
      } else if (this.props.pool.description.match(/(pdf)$/i)) { // A pdf document
        cinema.push(
          <canvas key="pdf" ref="pdf"/>
        )
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
