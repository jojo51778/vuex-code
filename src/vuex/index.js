let Vue
let forEach = (obj, callback) => {
  Object.keys(obj).forEach(key => {
    callback(key, obj[key])
  })
}
class ModuleCollection {
  constructor(options) {
    // 深度遍历将所有子模块都遍历一遍
    this.register([], options)
  }
  register(path, rootModule) {
    let rawModule = {
      _raw: rootModule,
      _children: {},
      state: rootModule.state
    }
    rootModule.rawModule = rawModule //双向记录
    if(!this.root) {
      this.root = rawModule
    } else {
      let parentModule = path.slice(0, -1).reduce((root, current) => {
        return root._children[current]
      }, this.root)
      parentModule._children[path[path.length-1]] = rawModule
    }

    if(rootModule.modules) {
      forEach(rootModule.modules, (moduleName, module) => {
        this.register(path.concat(moduleName), module)
      })
    }
  }
}
function getState(store, path) {
  let local = path.reduce((newState, current) => {
    return newState[current] //获取最新状态
  }, store.state)
  return local
}
function installModule(store, rootState, path, rawModule) {
  let getters = rawModule._raw.getters
  // 根据当前用户传入的配置， 算一下他需不需要增加一个前缀
  let root = store.modules.root //获取到了最终整个格式化的结果
  //[a,b]  a/b
  let namespace = path.reduce((str, current) => {
    root = root._children[current]
    str = str + (root._raw.namespaced ? current + '/' : '')
    return str
  }, '')
  // 没有安装我们的状态，我们需要把子模块状态定义到rootState上
  if(path.length > 0) {
    let parentState = path.slice(0, -1).reduce((root, current) => {
      return rootState[current]
    }, rootState)
    store._withCommit(() => {
      Vue.set(parentState, path[path.length - 1], rawModule.state)
    })
  }
  if(getters) { //定义getters
    forEach(getters, (getterName, value) => {
      if(!store.getters[getterName]) {
        Object.defineProperty(store.getters, namespace + getterName, {
          get: () => {
            return value(getState(store, path))
          }
        })
      }
    })
  }
  let mutations = rawModule._raw.mutations
  if(mutations) {
    forEach(mutations, (mutationName, value) => { // [fn, fn, fn] 订阅
      let arr = store.mutations[namespace + mutationName] || (store.mutations[namespace + mutationName] = [])
      arr.push((payload) => {
        value(getState(store, path), payload)
        store.subs.forEach(fn => fn({type: namespace + mutationName, payload: payload},
        store.state))
      })
    })
  }
  let actions = rawModule._raw.actions // 取actions
  if(actions) {
    forEach(actions, (actionName, value) => { // [fn, fn, fn] 订阅
      let arr = store.actions[namespace + actionName] || (store.actions[namespace + actionName] = [])
      arr.push((payload) => {
        value(store, payload)
      })
    })
  }
  forEach(rawModule._children, (moduleName, rawModule) => {
    installModule(store, rootState, path.concat(moduleName), rawModule)
  })
}
class Store {
  constructor(options) {
    this.strict = options.strict || false
    this._committing = false
    this.vm = new Vue({ //创建vue实例，响应式刷新视图
      data: {
        state: options.state
      }
    })
    // let getters = options.getters

    this.getters = {}
    this.mutations = {}
    this.actions = {}
    this.subs = []
    // 需要将用户传入的数据格式化操作
    this.modules = new ModuleCollection(options) //格式化想要的数据结构
    // 递归安装模块 store 
    installModule(this, this.state, [], this.modules.root)

    let plugins = options.plugins
    if(plugins) {
      plugins.forEach(plugin => plugin(this))
    }
    if(this.strict) {
      this.vm.$watch(() => { return this.vm.state }, () => {
        console.assert(this._committing, '严格模式下不能异步调用')
      }, { deep: true, sync: true })
    }
  }

  _withCommit(fn) {
    const committing = this._committing // 保留false
    this._committing = true
    fn()
    this._committing = committing
  }
  replaceState(newState) {
    this._withCommit(() => {
      this.vm.state = newState
    })
  }
  subscribe(fn) {
    this.subs.push(fn)
  }
  commit = (mutationName, payload) => {
    this._withCommit(() => {
      this.mutations[mutationName].forEach(fn => fn(payload))
    })
  }

  dispatch = (actionName, payload) => {
    this.actions[actionName].forEach(fn => fn(payload))
  }

  get state() {
    return this.vm.state
  }

  //动态注册模块
  registerModule(moduleName, module) {
    if(!Array.isArray(moduleName)) {
      moduleName = [moduleName]
    }
    this._withCommit(() => {
      this.modules.register(moduleName, module) // 将模块进行格式化
      // 将当前的这个模块进行安装
      installModule(this, this.state, moduleName, module.rawModule)
    })
  }
}

const install = (_Vue) => {
  Vue = _Vue
  Vue.mixin({
    beforeCreate() {
      if(this.$options.store) {
        this.$store = this.$options.store
      } else {
        this.$store = this.$parent && this.$parent.$store
      }
    }
  })
}
export const mapState = (stateArr) => {
  let obj = {}
  stateArr.forEach(stateName => {
    obj[stateName] = function() {
      return this.$store.state[stateName]
    }
  })
  return obj
}
export const mapGetters = (gettersArr) => {
  let obj = {}
  gettersArr.forEach(getterName => {
    obj[getterName] = function() {
      return this.$store.getters[getterName]
    }
  })
  return obj
}
export const mapMutations = (obj) => {
  let res = {}
  Object.entries(obj).forEach(([key ,value]) => {
    res[key] = function(...args) {
      this.$store.commit(value, ...args)
    }
  })
  return res
}
export const mapActions = (obj) => {
  let res = {}
  Object.entries(obj).forEach(([key ,value]) => {
    res[key] = function(...args) {
      this.$store.dispatch(value, ...args)
    }
  })
  return res
}
export default {
  Store,
  install
}