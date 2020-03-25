<template>
  <div id="app">
    年龄{{$store.state.age}}<br>
    我的年龄{{$store.getters.myAge}}
    {{$store.state.a.age}}
    {{$store.state.d.age}}
    <button @click='syncChange'>点我更改</button>
    <button @click='asyncChange'>点我更改</button>
  </div>
</template>

<script>

export default {
  name: 'App',
  mounted() {
    console.log(this.$store.state)
  },
  methods: {
    syncChange() {
      this.$store.commit('syncChange',10)
    },
    asyncChange() {
      this.$store.dispatch('asyncChange',5)
    }
  }
}
</script>

<style>
</style>
