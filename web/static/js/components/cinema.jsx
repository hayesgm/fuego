import React from '../react'
import {trace,debug} from "../services/logging"
import PoolStore from '../stores/pool_store'
import Pool from '../services/pool'

export class Cinema extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {url: null};
    this.fetchData(props.pool)
  }

  componentWillReceiveProps(props) {
    this.fetchData(props.pool);
  }

  fetchData(pool) {
    Pool.getPoolBuffers(pool).then((arrayBuffers) => {
      let blob = new Blob(arrayBuffers);
      let url = URL.createObjectURL(blob);

      this.setState({
        url: url
      });
      this.render();
    });
  }

  playVideo(pool) {
    let showVideo = !this.state.showVideo;

    this.setState({
      showVideo: showVideo
    });
  }

  render() {
    if (!this.state.url) {
      return (<div className="cinema loading">Pulling the curtains...</div>);
    }

    var cinema = [];

    cinema.push(<a key="download" className="btn btn-default btn-lg" href={this.state.url} download={this.props.pool.description}>Download</a>);
    
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

    return <div className="cinema">{cinema}</div>;
  }
}
