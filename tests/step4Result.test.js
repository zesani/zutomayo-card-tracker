import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Step4Result from '../src/components/steps/Step4Result.vue'

const cardLimit = { night: 1, day: 1 }

describe('Step4Result', () => {
  it('shows combat winner', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    expect(wrapper.find('.result-winner').text()).toContain('Night')
  })

  it('renders HP bars for both players', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    expect(wrapper.findAll('.hp-bar-track').length).toBe(2)
  })

  it('day damage chunk width = 20% when day loses 10 of 50 HP', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    // order: night bar first, day bar second
    const dayDamage = wrapper.findAll('.hp-damage')[1]
    expect(dayDamage.attributes('style')).toContain('20%')
  })

  it('night damage chunk width = 0% when night takes no damage', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    const nightDamage = wrapper.findAll('.hp-damage')[0]
    expect(nightDamage.attributes('style')).toContain('0%')
  })

  it('back button emits back', async () => {
    const combat = { winner: null, damage: 0, nightHp: 50, dayHp: 50 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    await wrapper.find('button.btn-secondary').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('end turn button emits endTurn', async () => {
    const combat = { winner: null, damage: 0, nightHp: 50, dayHp: 50 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    await wrapper.find('button.btn-primary').trigger('click')
    expect(wrapper.emitted('endTurn')).toBeTruthy()
  })
})
