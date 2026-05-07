<script setup>
defineProps({
  message: { type: String, required: true },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="confirm-backdrop" @click.self="$emit('cancel')">
    <div class="confirm-box">
      <p class="confirm-msg">{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn-danger" @click="$emit('confirm')">Confirm</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
.confirm-box {
  background: var(--surface-2);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 1.5rem;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.confirm-msg {
  font-size: 0.95rem;
  color: var(--text);
  text-align: center;
  line-height: 1.5;
}
.confirm-actions {
  display: flex;
  gap: 0.5rem;
}
.confirm-actions button { flex: 1; }
.btn-danger {
  background: #be123c;
  color: white;
  font-weight: 700;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}
.btn-danger:hover { background: #e11d48; }
</style>
