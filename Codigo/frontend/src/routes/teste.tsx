import { createFileRoute } from '@tanstack/react-router';


export const Route = createFileRoute('/teste')({
  component: Teste,
})

function Teste() {

  return (
    <>
      Olá!
    </>
  )
}
