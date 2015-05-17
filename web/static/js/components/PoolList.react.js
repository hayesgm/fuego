import React from '../react'
import Quote from './Pool.react'

export default class PoolList extends React.Component {

  render() {
    return (
      <ul style={{textAlign: 'left'}}>{
        this.props.data.pools
          .toList()
          .sortBy(q => q.get('value'))
          .map(q =>
            <Pool key={q.get('name')}
                   name={q.get('name')}
                   value={q.get('value')} />)
      }</ul>
    )
  }
}