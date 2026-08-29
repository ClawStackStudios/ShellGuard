<script setup lang="ts">
defineProps<{
  title: string
  number?: number | string
}>()
</script>

<template>
  <div class="sg-step">
    <div class="sg-step-indicator">
      <span class="sg-step-number">{{ number }}</span>
    </div>
    <div class="sg-step-content">
      <h3 class="sg-step-title">{{ title }}</h3>
      <div class="sg-step-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sg-step {
  display: flex;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.sg-step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #080c14;
  border: 2px solid #e4048a;
  color: #e4048a;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(228, 4, 138, 0.35);
}

.sg-step-content {
  flex-grow: 1;
  padding-top: 0.25rem;
}

.sg-step-title {
  margin: 0 0 0.5rem 0 !important;
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: var(--vp-c-text-1);
}

.sg-step-body {
  color: var(--vp-c-text-2);
}

.sg-step-body :deep(p:first-child) {
  margin-top: 0;
}
</style>
