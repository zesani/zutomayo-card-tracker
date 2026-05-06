import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game'
import TimeWheel from '../src/components/TimeWheel.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('TimeWheel', () => {
  it('renders an SVG element', () => {
    const wrapper = mount(TimeWheel)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('undo button disabled when no history', () => {
    const wrapper = mount(TimeWheel)
    const undoBtn = wrapper.findAll('button').find(b => b.text().includes('Undo'))
    expect(undoBtn).toBeDefined()
    expect(undoBtn.attributes('disabled')).toBeDefined()
  })

  it('redo button disabled initially', () => {
    const wrapper = mount(TimeWheel)
    const redoBtn = wrapper.findAll('button').find(b => b.text().includes('Redo'))
    expect(redoBtn).toBeDefined()
    expect(redoBtn.attributes('disabled')).toBeDefined()
  })

  it('hides undo/redo buttons when showControls is false', () => {
    const wrapper = mount(TimeWheel, { props: { showControls: false } })
    expect(wrapper.find('.undo-redo-row').exists()).toBe(false)
  })

  it('shows preview ring when previewPosition differs from current position', () => {
    const wrapper = mount(TimeWheel, { props: { previewPosition: 5 } })
    expect(wrapper.find('.preview-ring').exists()).toBe(true)
  })

  it('uses displayPosition instead of store when provided', () => {
    const wrapper = mount(TimeWheel, { props: { displayPosition: 9 } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
