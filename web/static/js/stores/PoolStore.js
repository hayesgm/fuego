import AppDispatcher from '../dispatcher/AppDispatcher'
// import {EventEmitter} from 'events'
import FuegoConstants from '../constants/FuegoConstants'
import Immutable from '../immutable'

const CHANGE_EVENT = 'change'

class PoolStore extends EventEmitter {

  constructor() {
    super();
    this.pools = Immutable.Map()
    this.register()
  }

  register() {
    AppDispatcher.register( action => {
      switch(action.actionType) {
      case FuegoConstants.POOL_UPDATE:
        this.update(action.pool)
        this.emitChange()
        break
      default:
        break
      }
    })
  }

  update(pool) {
    this.pools = this.pools.set(pool.name, Immutable.Map(pool))
  }

  getAll() {
    return this.pools
  }

  emitChange() {
    this.emit(CHANGE_EVENT)
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

export default new PoolStore()