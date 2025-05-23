// Accessibility fixes for Nuxt UI elements
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Fix for modal dialogs that might use aria-hidden incorrectly
    const fixModalAccessibility = () => {
      // Fix all elements that might have focus inside an aria-hidden container
      const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]')

      ariaHiddenElements.forEach(el => {
        // Check if this element contains any focusable elements
        const focusableElements = el.querySelectorAll(
          'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length > 0) {
          // If it contains focusable elements, use inert instead of aria-hidden
          el.removeAttribute('aria-hidden')
          el.setAttribute('inert', '')
        }
      })

      // Fix any canvas elements that should never have aria-hidden
      const canvasElements = document.querySelectorAll('canvas')
      canvasElements.forEach(canvas => {
        if (canvas.hasAttribute('aria-hidden')) {
          canvas.removeAttribute('aria-hidden')
        }

        // Add appropriate role if missing
        if (!canvas.hasAttribute('role')) {
          canvas.setAttribute('role', 'img')
        }
      })
    }

    // Run initial fix
    window.addEventListener('DOMContentLoaded', () => {
      // Give the UI time to render
      setTimeout(fixModalAccessibility, 500)
    })

    // Run fix after route changes
    const router = useRouter()
    router.afterEach(() => {
      // Give the UI time to render after route change
      setTimeout(fixModalAccessibility, 500)
    })

    // Fix after UI state changes by watching for DOM mutations
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        // Only run fix if we detect aria-hidden attributes being added
        const shouldFix = mutations.some(mutation => {
          return mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden'
        })

        if (shouldFix) {
          fixModalAccessibility()
        }
      })

      // Start observing once DOM is ready
      window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['aria-hidden'],
          subtree: true,
        })
      })
    }
  }
})
