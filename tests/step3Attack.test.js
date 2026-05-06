import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Step3Attack from '../src/components/steps/Step3Attack.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('Step3Attack', () => {
  it('renders 6 preset chips for each player', () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night' } })
    const chips = wrapper.findAll('.chip')
    expect(chips.length).toBe(12) // 6 presets × 2 players
  })

  it('shows two steppers (one per player)', () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night' } })
    const steppers = wrapper.findAll('.stepper')
    expect(steppers.length).toBe(2)
  })

  it('selecting a night preset chip emits update:nightAttack', async () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night', nightAttack: 0, dayAttack: 0 } })
    const nightChips = wrapper.findAll('.chip-row')[0].findAll('.chip')
    await nightChips[3].trigger('click') // chip "50" is at index 3 (PRESETS=[0,10,30,50,100,150])
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([50])
    expect(nightChips[3].classes()).toContain('chip-active-night')
  })

  it('+10 stepper increments nightAttack and emits', async () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night', nightAttack: 80, dayAttack: 0 } })
    const steppers = wrapper.findAll('.stepper')
    const plusBtn = steppers[0].findAll('.stepper-btn')[1] // +10
    await plusBtn.trigger('click')
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([90])
  })

  it('–10 stepper clamps at 0', async () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night', nightAttack: 5, dayAttack: 0 } })
    const steppers = wrapper.findAll('.stepper')
    const minusBtn = steppers[0].findAll('.stepper-btn')[0] // –10
    await minusBtn.trigger('click')
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([0])
  })

  it('continue button is always enabled', () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night' } })
    const btn = wrapper.find('button.btn-primary')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('back button emits back event', async () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night' } })
    await wrapper.find('button.btn-secondary').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('shows phase hero with Night text and icon when phase is night', () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'night', position: 3 } })
    expect(wrapper.find('.phase-hero').exists()).toBe(true)
    expect(wrapper.find('.phase-hero').classes()).toContain('phase-hero-night')
    expect(wrapper.find('.phase-hero-text').text()).toBe('NIGHT')
    expect(wrapper.find('.phase-hero-icon').find('svg').exists()).toBe(true)
  })

  it('shows phase hero with Day text and icon when phase is day', () => {
    const wrapper = mount(Step3Attack, { props: { phase: 'day', position: 9 } })
    expect(wrapper.find('.phase-hero').classes()).toContain('phase-hero-day')
    expect(wrapper.find('.phase-hero-text').text()).toBe('DAY')
    expect(wrapper.find('.phase-hero-icon').find('svg').exists()).toBe(true)
  })
})
