import { parse, parseSetCookie, serialize } from 'cookie-es'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip refresh for unauthenticated routes or during client navigation
  if (to.path.startsWith('/auth/') || process.client) {
    return
  }
  
  // Get the runtime config
  const runtimeConfig = useRuntimeConfig()

  // Get the server event for SSR requests
  const serverEvent = useRequestEvent()
  
  // Get the user session
  const { loggedIn } = useUserSession()
  
  // If user is logged in, try to refresh the token during SSR
  if (loggedIn.value && serverEvent) {
    try {
      await useRequestFetch()('/api/auth/refresh', {
        method: 'POST',
        onResponse({ response: { headers } }) {
          // Forward the Set-Cookie header to the main server event
          if (process.server && serverEvent) {
            for (const setCookie of headers.getSetCookie()) {
              appendResponseHeader(serverEvent, 'Set-Cookie', setCookie)
              
              // Update session cookie for next fetch requests
              const { name, value } = parseSetCookie(setCookie)
              if (name === runtimeConfig.session?.name) {
                // Update headers.cookie for future requests
                const cookies = parse(serverEvent.headers.get('cookie') || '')
                // Set or overwrite existing cookie
                cookies[name] = value
                // Update cookie event header for future requests
                serverEvent.headers.set('cookie', 
                  Object.entries(cookies)
                    .map(([name, value]) => serialize(name, value))
                    .join('; ')
                )
                
                // Also apply to serverEvent.node.req.headers if it exists
                if (serverEvent.node?.req?.headers) {
                  serverEvent.node.req.headers['cookie'] = serverEvent.headers.get('cookie') || ''
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('Failed to refresh session:', error)
      // Don't throw or redirect here, let the auth middleware handle unauthorized access
    }
  }
}) 