/**
 * virtual list default component.
 */

import Vue from 'vue'
import Virtual from './virtual'
import { Item, Slot } from './item'
import { VirtualProps } from './props'

const EVENT_TYPE = {
  ITEM: 'item_resize',
  SLOT: 'slot_resize'
}
const SLOT_TYPE = {
  HEADER: 'header', // string value also use for aria role attribute.
  FOOTER: 'footer'
}

const NAME = 'virtual-list'

const VirtualList = Vue.component(NAME, {
  props: VirtualProps,

  data () {
    return {
      range: null
    }
  },

  watch: {
    dataSources (newValue, oldValue) {
      if (newValue.length !== oldValue.length) {
        this.virtual.updateParam('uniqueIds', this.getUniqueIdFromDataSources())
        this.virtual.handleDataSourcesChange()
      }
    }
  },

  created () {
    this.isHorizontal = this.direction === 'horizontal'
    this.directionKey = this.isHorizontal ? 'scrollLeft' : 'scrollTop'

    this.virtual = new Virtual({
      size: this.size, // also could be a estimate value.
      slotHeaderSize: 0,
      slotFooterSize: 0,
      keeps: this.keeps,
      disabled: this.disabled,
      buffer: Math.round(this.keeps / 3), // recommend for a third of keeps.
      uniqueIds: this.getUniqueIdFromDataSources()
    }, this.onRangeChanged)

    // just for debug
    // window.virtual = this.virtual

    // also need sync initial range first.
    this.range = this.virtual.getRange()

    // listen item size changing.
    this.$on(EVENT_TYPE.ITEM, this.onItemResized)

    // listen slot size changing.
    if (this.$slots.header || this.$slots.footer) {
      this.$on(EVENT_TYPE.SLOT, this.onSlotResized)
    }
  },

  beforeDestroy () {
    this.virtual.destroy()
  },

  mounted () {
    // set position.
    if (this.start) {
      this.setScrollOffset(this.virtual.getOffset(this.start))
    } else if (this.offset) {
      this.setScrollOffset(this.offset)
    }
  },

  methods: {
    // event called when every item mounted or size changed.
    onItemResized (id, size) {
      this.virtual.saveSize(id, size)
    },

    // event called when slot mounted or size changed.
    onSlotResized (type, size, hasInit) {
      if (type === SLOT_TYPE.HEADER) {
        this.virtual.updateParam('slotHeaderSize', size)
      } else if (type === SLOT_TYPE.FOOTER) {
        this.virtual.updateParam('slotFooterSize', size)
      }

      if (hasInit) {
        this.virtual.handleSlotSizeChange()
      }
    },

    // here is the rerendering entry.
    onRangeChanged (range) {
      this.range = range
    },

    onScroll (evt) {
      const { root } = this.$refs
      if (!root) {
        return
      }

      const offset = root[this.directionKey]
      this.virtual.handleScroll(offset)
      this.emitEvent(offset, evt)
    },

    getUniqueIdFromDataSources () {
      return this.dataSources.map((dataSource) => dataSource[this.dataKey])
    },

    // set current scroll position to a expectant offset.
    setScrollOffset (offset) {
      const { root } = this.$refs
      if (root) {
        root[this.directionKey] = offset || 0
      }
    },

    // emit event in special position.
    emitEvent (offset, evt) {
      // ref element is definitely available here.
      const { root } = this.$refs
      const range = this.virtual.getRange()
      const isLower = this.virtual.isLower()
      const isUpper = this.virtual.isUpper()
      const offsetShape = root[this.isHorizontal ? 'clientWidth' : 'clientHeight']
      const scrollShape = root[this.isHorizontal ? 'scrollWidth' : 'scrollHeight']

      if (isUpper && !!this.dataSources.length && offset - this.upperThreshold <= 0) {
        this.$emit('totop', evt, range)
      } else if (isLower && offset + offsetShape + this.lowerThreshold >= scrollShape) {
        this.$emit('tobottom', evt, range)
      } else {
        this.$emit('scroll', evt, range)
      }
    },

    // get the real render slots based on range data.
    getRenderSlots (h) {
      const slots = []
      const start = this.disabled ? 0 : this.range.start
      const end = this.disabled ? this.dataSources.length - 1 : this.range.end

      for (let index = start; index <= end; index++) {
        const dataSource = this.dataSources[index]
        if (dataSource) {
          slots.push(h(Item, {
            class: this.itemClass,
            props: {
              tag: this.itemTag,
              event: EVENT_TYPE.ITEM,
              horizontal: this.isHorizontal,
              uniqueKey: dataSource[this.dataKey],
              source: dataSource,
              component: this.dataComponent
            }
          }))
        } else {
          console.warn(`[${NAME}]: cannot get the index ${index} from data-sources.`)
        }
      }

      return slots
    }
  },

  // render function, a closer-to-the-compiler alternative to templates.
  // https://vuejs.org/v2/guide/render-function.html#The-Data-Object-In-Depth
  render (h) {
    const { header, footer } = this.$slots
    const padding = this.isHorizontal
      ? `0px ${this.range.padBehind}px 0px ${this.range.padFront}px`
      : `${this.range.padFront}px 0px ${this.range.padBehind}px`

    return h(this.rootTag, {
      ref: 'root',
      on: {
        '&scroll': this.onScroll
      }
    }, [
      // header slot.
      header ? h(Slot, {
        class: this.headerClass,
        props: {
          tag: this.headerTag,
          event: EVENT_TYPE.SLOT,
          uniqueKey: SLOT_TYPE.HEADER
        }
      }, header) : null,

      // main list.
      h(this.wrapTag, {
        class: this.wrapClass,
        attrs: {
          role: 'group'
        },
        style: {
          padding: padding
        }
      }, this.getRenderSlots(h)),

      // footer slot.
      footer ? h(Slot, {
        class: this.footerClass,
        props: {
          tag: this.footerTag,
          event: EVENT_TYPE.SLOT,
          uniqueKey: SLOT_TYPE.FOOTER
        }
      }, footer) : null
    ])
  }
})

export default VirtualList
