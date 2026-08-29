<template>
  <div class="sg-steps">
    <slot />
  </div>
</template>

<style scoped>
.sg-steps {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.sg-steps::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  left: 17px;
  width: 2px;
  background: linear-gradient(to bottom, #e4048a, #06b6d4);
  opacity: 0.3;
}
</style>
