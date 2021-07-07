import { KEY_PREFIX, REHYDRATE } from './constants'
import purgeStoredState from './purgeStoredState'
import stringify from 'json-stringify-safe'

export default function createPersistor (store, config) {
  // defaults
  let serializer;
  if (config.serialize === false) {
    serializer = (data) => data
  } else if (typeof config.serialize === 'function') {
    serializer = config.serialize
  } else {
    serializer = defaultSerializer
  }

  let deserializer;
  if (config.deserialize === false) {
    deserializer = (data) => data
  } else if (typeof config.deserialize === 'function') {
    deserializer = config.deserialize
  } else {
    deserializer = defaultDeserializer
  }
  const blacklist = config.blacklist || []
  const whitelist = config.whitelist || false
  const keyPrefix = config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX

  // pluggable state shape (e.g. immutablejs)
  const stateInit = {}
  function stateIterator (collection, callback) {
    return Object.keys(collection).forEach((key) => callback(key))
  }
  function stateGetter (state, key) {
    return state[key]
  }
  function stateSetter (state, key, value) {
    state[key] = value
    return state
  }

  const storage = config.storage;

  // initialize stateful values
  let lastState = stateInit
  let paused = false
  let storesToProcess = []
  let timeIterator = null

  store.subscribe(() => {
    if (paused) return

    let state = store.getState()

    stateIterator(state, (key) => {
      if (!passWhitelistBlacklist(key)) return
      if (stateGetter(lastState, key) === stateGetter(state, key)) return
      if (storesToProcess.indexOf(key) !== -1) return
      storesToProcess.push(key)
    })

    const len = storesToProcess.length

    // time iterator (read: debounce)
    if (timeIterator === null) {
      timeIterator = setInterval(() => {
        if ((paused && len === storesToProcess.length) || storesToProcess.length === 0) {
          clearInterval(timeIterator)
          timeIterator = null
          return
        }

        let key = storesToProcess.shift()
        let storageKey = createStorageKey(key)
        let endState = stateGetter(store.getState(), key)
        if (typeof endState !== 'undefined') storage.setItem(storageKey, serializer(endState)).catch(warnIfSetError(key))
      }, 0)
    }

    lastState = state
  })

  function passWhitelistBlacklist (key) {
    if (whitelist && whitelist.indexOf(key) === -1) return false
    if (blacklist.indexOf(key) !== -1) return false
    return true
  }

  function adhocRehydrate (incoming, options = {}) {
    let state = {}
    if (options.serial) {
      stateIterator(incoming, (key) => {
        const subState = incoming[key]
        try {
          let data = deserializer(subState)
          let value = data
          state = stateSetter(state, key, value)
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.warn(`Error rehydrating data for key "${key}"`, subState, err)
        }
      })
    } else state = incoming

    store.dispatch(rehydrateAction(state))
    return state
  }

  function createStorageKey (key) {
    return `${keyPrefix}${key}`
  }

  // return `persistor`
  return {
    rehydrate: adhocRehydrate,
    pause: () => { paused = true },
    resume: () => { paused = false },
    purge: (keys) => purgeStoredState({storage, keyPrefix}, keys),

    // Only used in `persistStore`, to force `lastState` to update
    // with the results of `REHYDRATE` even when the persistor is
    // paused.
    _resetLastState: () => { lastState = store.getState() }
  }
}

function warnIfSetError (key) {
  return function setError (err) {
    if (err && process.env.NODE_ENV !== 'production') { console.warn('Error storing data for key:', key, err) }
  }
}

function defaultSerializer (data) {
  return stringify(data, null, null, (k, v) => {
    if (process.env.NODE_ENV !== 'production') return null
    throw new Error(`
      redux-persist: cannot process cyclical state.
      Consider changing your state structure to have no cycles.
      Alternatively blacklist the corresponding reducer key.
      Cycle encounted at key "${k}" with value "${v}".
    `)
  })
}

function defaultDeserializer (serial) {
  return JSON.parse(serial)
}

function rehydrateAction (data) {
  return {
    type: REHYDRATE,
    payload: data
  }
}
