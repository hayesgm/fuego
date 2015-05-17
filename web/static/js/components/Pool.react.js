import React from '../react'

export default class Pool extends React.Component {
  render() {
    return <li><strong>{this.props.name}</strong> &mdash; {this.props.value}</li>
  }
}