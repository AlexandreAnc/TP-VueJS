import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import AvisView from '../views/AvisView.vue'
import BackOfficeView from '../views/BackOfficeView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuth } from '../composables/useAuth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/projets', name: 'projects', component: ProjectsView },
    { path: '/a-propos', name: 'about', component: AboutView },
    { path: '/contact', name: 'contact', component: ContactView },
    { path: '/avis', name: 'avis', component: AvisView },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/back-office',
      name: 'back-office',
      component: BackOfficeView,
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

const { isLoggedIn } = useAuth()

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }
  return true
})

/**
 * View Transitions API : anime le changement de vue lors des navigations programmées
 * (RouterLink, router.push, router.replace). Retrait si non supporté.
 */
function wrapWithViewTransition(originalNavigate) {
  return function navigateWithTransition(to) {
    if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
      return originalNavigate(to)
    }
    return new Promise((resolve, reject) => {
      document.startViewTransition(async () => {
        try {
          const result = await originalNavigate(to)
          await nextTick()
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
    })
  }
}

const originalPush = router.push.bind(router)
const originalReplace = router.replace.bind(router)
router.push = wrapWithViewTransition(originalPush)
router.replace = wrapWithViewTransition(originalReplace)

export default router
