import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <>
      Olá, mundo!
      This is Bolsu.
    </>
  )
}
