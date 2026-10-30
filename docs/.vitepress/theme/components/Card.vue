<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  title: string
  href?: string
  icon?: string
  tag?: string
}>()

const isExternal = computed(() => props.href && /^https?:\/\//.test(props.href))

// Internal links must be base-prefixed (site deploys under VITEPRESS_BASE, e.g. /ShellGuard/).
// Raw HTML href bindings are NOT auto-rewritten by VitePress — only theme-config and
// markdown links are. Without this, every Card 404s on the deployed site.
const normalizedHref = computed(() => {
  if (!props.href || isExternal.value || props.href.startsWith('#')) return props.href
  return withBase(props.href)
})
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="normalizedHref"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noreferrer noopener' : undefined"
    class="sg-card"
    :class="{ 'is-link': !!href }"
  >
    <div class="sg-card-header">
      <div class="sg-card-icon-wrap" v-if="icon || $slots.icon">
        <slot name="icon">
          <!-- Fallback or emoji icon -->
          <span class="sg-card-icon">{{ icon }}</span>
        </slot>
      </div>
      <div class="sg-card-title-wrap">
        <h4 class="sg-card-title">{{ title }}</h4>
        <span v-if="tag" class="sg-card-tag">{{ tag }}</span>
      </div>
    </div>
    <div class="sg-card-body">
      <slot />
    </div>
    <div v-if="href" class="sg-card-arrow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>
  </component>
</template>

<style scoped>
.sg-card {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 1.4rem;
  border-radius: 22px;
  background: var(--sg-card-bg, rgba(23, 28, 33, 0.72));
  border: 1px solid var(--sg-card-border, rgba(228, 4, 138, 0.18));
  backdrop-filter: blur(16px);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.3);
}

.sg-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(228, 4, 138, 0.12) 0%, transparent 70%);
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.sg-card.is-link {
  cursor: pointer;
}

.sg-card.is-link:hover {
  border-color: rgba(228, 4, 138, 0.45);
  background: var(--sg-card-hover-bg, rgba(23, 28, 33, 0.95));
  transform: translateY(-4px);
  box-shadow: 0 18px 36px -10px rgba(228, 4, 138, 0.18), 0 0 1px 1px rgba(228, 4, 138, 0.25);
}

.sg-card.is-link:hover::after {
  opacity: 1;
}

.sg-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.sg-card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(228, 4, 138, 0.12);
  border: 1px solid rgba(228, 4, 138, 0.28);
  color: #e4048a;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.sg-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
}

.sg-card-title {
  margin: 0 !important;
  font-family: 'Outfit', sans-serif !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.sg-card-tag {
  font-size: 0.65rem;
  font-weight: 600;
  font-family: var(--vp-font-family-mono, monospace);
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 9999px;
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.sg-card-body {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
}

.sg-card-body :deep(p) {
  margin: 0;
}

.sg-card-arrow {
  position: absolute;
  top: 1.4rem;
  right: 1.4rem;
  color: var(--vp-c-text-3);
  transition: all 0.2s ease;
  opacity: 0.5;
}

.sg-card:hover .sg-card-arrow {
  color: #e4048a;
  transform: translateX(3px);
  opacity: 1;
}
</style>
