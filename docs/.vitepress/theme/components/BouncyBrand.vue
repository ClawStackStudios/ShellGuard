<template>
  <div class="sg-bouncy-brand">
    <span class="sg-brand-name">
      <span class="sg-char shell">S</span>
      <span class="sg-char shell">h</span>
      <span class="sg-char shell">e</span>
      <span class="sg-char shell">l</span>
      <span class="sg-char shell">l</span>
      <span class="sg-char guard">G</span>
      <span class="sg-char guard">u</span>
      <span class="sg-char guard">a</span>
      <span class="sg-char guard">r</span>
      <span class="sg-char guard">d</span>
    </span>
    <sup class="sg-tm">©™</sup>
    <span class="sg-badge">DOCS V4.1</span>
  </div>
</template>

<style scoped>
.sg-bouncy-brand {
  display: inline-flex;
  align-items: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 1.15rem;
  user-select: none;
}

.sg-brand-name {
  display: inline-flex;
  align-items: baseline;
}

.sg-char {
  display: inline-block;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.sg-char:hover {
  transform: translateY(-4px) scale(1.15);
}

.sg-char.shell {
  color: #e4048a;
}

.sg-char.guard {
  color: #06b6d4;
}

.sg-tm {
  font-size: 0.55rem;
  color: var(--vp-c-text-3, #94a3b8);
  margin-left: 2px;
  font-weight: 500;
  line-height: 1;
}

.sg-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.3);
  padding: 2px 7px;
  border-radius: 9999px;
  margin-left: 8px;
  letter-spacing: 0.04em;
  display: inline-block;
}

@media (max-width: 480px) {
  .sg-badge {
    display: none;
  }
}
</style>
