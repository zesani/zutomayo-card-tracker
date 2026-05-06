import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Step1Time from '../src/components/steps/Step1Time.vue'
import TimeWheel from '../src/components/TimeWheel.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('Step1Time', () => {
  it('renders 7 preset chips for each player', () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    const chips = wrapper.findAll('.chip')
    expect(chips.length).toBe(14)
  })

  it('selecting a night chip sets nightTime and highlights it', async () => {
    const wrapper = mount(Step1Time, {
      props: { currentPosition: 0, nightTime: 0, dayTime: 0 },
    })
    const nightChips = wrapper.findAll('.chip-row')[0].findAll('.chip')
    await nightChips[3].trigger('click') // chip "3" is now at index 3 (CHIPS=[0,1,2,3,...])
    expect(nightChips[3].classes()).toContain('chip-active-night')
    expect(wrapper.emitted('update:nightTime')?.[0]).toEqual([3])
  })

  it('continue button is always enabled (0,0 is valid — time stays the same)', () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    const btn = wrapper.find('button.btn-primary')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('TimeWheel is always shown', () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    expect(wrapper.findComponent(TimeWheel).exists()).toBe(true)
  })

  it('TimeWheel previewPosition is null when both values are 0', () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    expect(wrapper.findComponent(TimeWheel).props('previewPosition')).toBeNull()
  })

  it('TimeWheel receives previewPosition when a chip is selected', async () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    const nightChips = wrapper.findAll('.chip-row')[0].findAll('.chip')
    await nightChips[3].trigger('click') // chip "3" → nightTime=3, previewPos=3
    expect(wrapper.findComponent(TimeWheel).props('previewPosition')).toBe(3)
  })

  it('back button emits back', async () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 0 } })
    await wrapper.find('button.btn-secondary').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('TimeWheel previewPosition wraps around correctly at end of wheel', async () => {
    const wrapper = mount(Step1Time, { props: { currentPosition: 15 } })
    const nightChips = wrapper.findAll('.chip-row')[0].findAll('.chip')
    await nightChips[3].trigger('click') // chip "3" → (15+3)%18 = 0
    expect(wrapper.findComponent(TimeWheel).props('previewPosition')).toBe(0)
  })
})
