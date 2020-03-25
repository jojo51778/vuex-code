import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

let store = new Vuex.Store({
  modules: {
    a: {
      state: {
        age: 'a100',
      },
      mutations: {
        syncChange() {
          console.log('a-syncChange')
        }
      }
    },
    b: {
      state: {
        age: 'b100',
      },
      mutations: {
        syncChange() {
          console.log('b-syncChange')
        }
      },
      modules: {
        c: {
          state: {
            age: 'c100'
          },
          mutations: {
            syncChange() {
              console.log('c-syncChange')
            }
          }
        }
      }
    },
  },
  state: {
    age: 10
  },
  strict: true,
  getters: {
    myAge(state) {
      return state.age + 20
    }
  },
  mutations: {
    syncChange(state, payload) {
      state.age += payload
    }
  },
  actions: {
    asyncChange({commit}, payload) {
      setTimeout(() =>{
        commit('syncChange', payload)
      },1000)
    }
  }
})
store.registerModule('d', {
  state: {
    age: 'd100'
  }
})
export default store