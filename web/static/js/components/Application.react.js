import React from '../react'
import PoolList from './PoolList.react'
import PoolStore from '../stores/PoolStore'
// import PoolViewActions from '../actions/PoolViewActions'
import ImmutableRenderMixin from 'react-immutable-render-mixin'

export default class Application extends React.Component {
  mixins: [ ImmutableRenderMixin ]

  constructor(props) {
    super(props)
    this.state = { pools: PoolStore.getAll() }
  }

  componentDidMount() {
    PoolStore.addChangeListener(this.onChange.bind(this))
  }

  componentWillUnmount() {
    PoolStore.removeChangeListener(this.onChange.bind(this))
  }

  onChange() {
    this.setState({ pools: PoolStore.getAll() })
  }

  onAddClick() {
    // PoolViewActions.addQuote()
  }

  render() {
    const count = this.state.pools.count()
    return (
      <div>
        <p style={{textAlign:'left'}}>{count === 0 ? 'no' : count} pool{count === 1 ? '' : 's'}</p>
        <input type="button" value="Add a random pool" onClick={this.onAddClick}/>
        <hr/>
        <PoolList data={this.state}/>
      </div>
    )
  }
}