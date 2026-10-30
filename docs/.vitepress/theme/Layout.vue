<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, provide } from 'vue'
import BouncyBrand from './components/BouncyBrand.vue'

const { isDark } = useData()

const enableTransitions = () =>
  typeof document !== 'undefined' &&
  'startViewTransition' in document &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches

provide('toggle-appearance', async ({ clientX, clientY }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const x = clientX ?? window.innerWidth / 2
  const y = clientY ?? window.innerHeight / 2
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // @ts-expect-error View Transitions API
  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  })

  await transition.ready

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${endRadius}px at ${x}px ${y}px)`
  ]

  document.documentElement.animate(
    {
      clipPath: isDark.value ? [...clipPath].reverse() : clipPath
    },
    {
      duration: 500,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      pseudoElement: isDark.value
        ? '::view-transition-old(root)'
        : '::view-transition-new(root)'
    }
  )
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-title-after>
      <BouncyBrand />
    </template>
  </DefaultTheme.Layout>
</template>
