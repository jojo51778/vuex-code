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
function installModule(store, rootState, path, rawModule) {
  let getters = rawModule._raw.getters

  // 没有安装我们的状态，我们需要把子模块状态定义到rootState上
  if(path.length > 0) {
    let parentState = path.slice(0, -1).reduce((root, current) => {
      return rootState[current]
    }, rootState)
    Vue.set(parentState, path[path.length - 1], rawModule.state)
  }
  if(getters) { //定义getters
    forEach(getters, (getterName, value) => {
      if(!store.getters[getterName]) {
        Object.defineProperty(store.getters, getterName, {
          get: () => {
            return value(rawModule.state)
          }
        })
      }
    })
  }
  let mutations = rawModule._raw.mutations
  if(mutations) {
    forEach(mutations, (mutationName, value) => { // [fn, fn, fn] 订阅
      let arr = store.mutations[mutationName] || (store.mutations[mutationName] = [])
      arr.push((payload) => {
        value(rawModule.state, payload)
      })
    })
  }
  let actions = rawModule._raw.actions // 取actions
  if(actions) {
    forEach(actions, (actionName, value) => { // [fn, fn, fn] 订阅
      let arr = store.actions[actionName] || (store.actions[actionName] = [])
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
    this.vm = new Vue({ //创建vue实例，响应式刷新视图
      data: {
        state: options.state
      }
    })
    // let getters = options.getters

    this.getters = {}
    this.mutations = {}
    this.actions = {}

    // 需要将用户传入的数据格式化操作
    this.modules = new ModuleCollection(options)
    // 递归安装模块 store 
    installModule(this, this.state, [], this.modules.root)
  }

  commit = (mutationName, payload) => {
    this.mutations[mutationName].forEach(fn => fn(payload))
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
    this.modules.register(moduleName, module) // 将模块进行格式化
    installModule(this, this.state, [], this.modules.root)
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

export default {
  Store,
  install
}