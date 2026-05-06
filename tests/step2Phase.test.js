import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Step2Phase from '../src/components/steps/Step2Phase.vue'

describe('Step2Phase', () => {
  it('shows night icon and label when phase is night', () => {
    const wrapper = mount(Step2Phase, { props: { position: 3, phase: 'night' } })
    expect(wrapper.find('.result-icon').find('svg').exists()).toBe(true)
    expect(wrapper.find('.result-label').text()).toBe('Night Phase')
  })

  it('shows day icon and label when phase is day', () => {
    const wrapper = mount(Step2Phase, { props: { position: 9, phase: 'day' } })
    expect(wrapper.find('.result-icon').find('svg').exists()).toBe(true)
    expect(wrapper.find('.result-label').text()).toBe('Day Phase')
  })

  it('continue button emits next event', async () => {
    const wrapper = mount(Step2Phase, { props: { position: 3, phase: 'night' } })
    await wrapper.find('button.btn-primary').trigger('click')
    expect(wrapper.emitted('next')).toBeTruthy()
  })

  it('back button emits back event', async () => {
    const wrapper = mount(Step2Phase, { props: { position: 3, phase: 'night' } })
    await wrapper.find('button.btn-secondary').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })
})
