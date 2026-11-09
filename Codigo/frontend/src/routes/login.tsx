import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '../components/auth-form'
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({ next: typeof search.next === 'string' ? search.next : '/inicio' }),
  component: Login,
})
function Login() { const { next } = Route.useSearch(); return <AuthForm next={next} /> }
