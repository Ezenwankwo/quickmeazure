export default defineAppConfig({
  ui: {
    notifications: {
      position: 'top-0 bottom-[unset]'
    },
    card: {
      base: 'overflow-hidden',
      rounded: 'rounded-lg',
      divide: 'divide-y divide-gray-200',
      ring: 'ring-1 ring-gray-200',
      background: 'bg-white',
      shadow: 'shadow-sm',
      body: {
        base: 'p-2 sm:p-3',
        padding: 'p-2 sm:p-3',
      },
      header: {
        base: 'p-2 sm:p-3',
        padding: 'p-2 sm:p-3',
      },
      footer: {
        base: 'p-2 sm:p-3',
        padding: 'p-2 sm:p-3',
      }
    }
  }
}) 