<template>
  <div class="item-inner">
    <div class="head">
      <span># {{ index }}</span>
      <span>{{ name }}</span>
    </div>
    <div class="desc">{{ desc }}</div>
  </div>
</template>

<script>

export default {
  name: 'dynamic-size-item',

  props: {
    index: Number,
    name: String,
    desc: String
  }
}
</script>

<style lang="less" scoped>
.item-inner {
  .head {
    font-weight: 500;
  }
  span:first-child {
    margin-right: 1em;
  }
  .desc {
    text-align: justify;
  }
}
</style>