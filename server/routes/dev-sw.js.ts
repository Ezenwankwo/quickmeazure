export default defineEventHandler(event => {
  // Return an empty JavaScript file for dev-sw.js requests
  // This prevents Vue Router warnings in development mode
  setResponseHeader(event, 'Content-Type', 'application/javascript')
  return ''
})
