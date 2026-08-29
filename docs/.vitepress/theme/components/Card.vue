<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  href?: string
  icon?: string
  tag?: string
}>()

const isExternal = computed(() => props.href && /^https?:\/\//.test(props.href))
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
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
  padding: 1.25rem;
  border-radius: 14px;
  background: var(--sg-card-bg, rgba(15, 23, 42, 0.6));
  border: 1px solid var(--sg-card-border, rgba(228, 4, 138, 0.15));
  backdrop-filter: blur(12px);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.sg-card.is-link {
  cursor: pointer;
}

.sg-card.is-link:hover {
  border-color: rgba(228, 4, 138, 0.45);
  background: var(--sg-card-hover-bg, rgba(228, 4, 138, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(228, 4, 138, 0.12), 0 0 1px 1px rgba(228, 4, 138, 0.2);
}

.sg-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.sg-card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(228, 4, 138, 0.12);
  border: 1px solid rgba(228, 4, 138, 0.25);
  color: #e4048a;
  font-size: 1.15rem;
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
  font-size: 1rem !important;
  font-weight: 700 !important;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.sg-card-tag {
  font-size: 0.65rem;
  font-weight: 700;
  font-family: monospace;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.sg-card-body {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.sg-card-body :deep(p) {
  margin: 0;
}

.sg-card-arrow {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
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
