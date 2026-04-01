<template>
  <footer class="app-footer">
    <p class="footer-text">TP VueJS</p>
    <p class="footer-subtext">Réalise par <a href="https://alexanc.fr" target="_blank">Alexandre Ancelle</a></p>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-50);
  border: 1px solid var(--color-200);
  border-radius: 14px;
  padding: 0.75rem 1rem;
}

.footer-text {
  color: var(--color-800);
  font-weight: 600;
}

.footer-subtext {
  color: var(--color-700);
  font-size: 0.8rem;
}

.footer-subtext a {
  color: var(--color-600);
}

.footer-subtext a:hover {
  color: var(--color-700);
}
</style>
