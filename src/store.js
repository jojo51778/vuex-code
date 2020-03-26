import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)
// function logger(store) {
//   let prevState = JSON.stringify(store.state)
//   store.subscribe((mutation, newState) => {
//     console.log(prevState)
//     console.log(mutation)
//     console.log(JSON.stringify(newState))
//     prevState = JSON.stringify(newState)
//   })
// }
function presists(store) {
  let local = localStorage.getItem('VUEX:state')
  if(local) {
    store.replaceState(JSON.parse(local)) //替换状态
  }
  store.subscribe((mutation, state) => {
    localStorage.setItem('VUEX:state', JSON.stringify(state))
  })
}
let store = new Vuex.Store({
  strict: true,
  plugins: [
    // logger
    presists
  ],
  modules: {
    a: {
      namespaced: true,
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
          namespaced: true,
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
  getters: {
    myAge(state) {
      return state.age + 20
    }
  },
  mutations: {
    syncChange(state, payload) {
      setTimeout(() => {
        state.age += payload
      },1000)
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
store.registerModule(['b', 'd'], {
  state: {
    age: 'd100'
  }
})
export default store