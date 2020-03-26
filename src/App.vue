<template>
  <div id="app">
    年龄{{age}}<br>
    我的年龄{{myAge}}
    {{$store.state.a.age}}
    <!-- {{$store.state.d.age}} -->
    {{$store.state.b.d.age}}
    <button @click='syncChange'>点我更改</button>
    <button @click='asyncChange'>点我更改</button>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from './vuex'

export default {
  name: 'App',
  mounted() {
    console.log(this.$store.state)
  },
  computed: {
    ...mapGetters(['myAge']),
    ...mapState(['age']),
  },
  methods: {
     ...mapMutations({aaa: 'syncChange'}),
     ...mapActions({bbb: 'asyncChange'}),
    syncChange() {
      this.aaa(10)
    },
    asyncChange() {
      this.bbb(5)
    }
  }
}
</script>

<style>
</style>
