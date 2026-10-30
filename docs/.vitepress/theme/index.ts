import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h, nextTick, provide } from 'vue'
import { useData } from 'vitepress'
import CardGrid from './components/CardGrid.vue'
import Card from './components/Card.vue'
import Steps from './components/Steps.vue'
import Step from './components/Step.vue'
import CopyPage from './components/CopyPage.vue'
import EnvarList from './components/EnvarList.vue'
import BouncyBrand from './components/BouncyBrand.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-after': () => h(BouncyBrand)
    })
  },
  setup() {
    const { isDark } = useData()

    const enableTransitions = () =>
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches

    provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
      if (!enableTransitions()) {
        isDark.value = !isDark.value
        return
      }

      const right = window.innerWidth - x
      const bottom = window.innerHeight - y
      const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom))

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${maxRadius}px at ${x}px ${y}px)`
      ]

      await document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      }).ready

      document.documentElement.animate(
        {
          clipPath: isDark.value ? [...clipPath].reverse() : clipPath
        },
        {
          duration: 950,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
        }
      )
    })
  },
  enhanceApp({ app }) {
    app.component('CardGrid', CardGrid)
    app.component('Card', Card)
    app.component('Steps', Steps)
    app.component('Step', Step)
    app.component('CopyPage', CopyPage)
    app.component('EnvarList', EnvarList)
    app.component('BouncyBrand', BouncyBrand)
  }
} satisfies Theme
