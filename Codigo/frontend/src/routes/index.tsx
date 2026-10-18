import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8080/users') //URL do backend local, verificar se a sua tá correta ou não!!!!
      return await res.json()
    },
    retry: false,
  })

  return (
    <div className='p-8 space-y-5'>
      <div>
        <h1 className='text-2xl font-bold'>Usuários do Bolsu</h1>
        <h2 className='text-lg text-zinc-400 font-medium'>Sendo puxados do backend e MongoDB</h2>
      </div>
      {query.data?.map((user: { id: string, name: string; email: string }) => (
        <div key={user.id} className='p-4 bg-zinc-800 w-max rounded-lg'>
          <p className='text-lg font-semibold'>{user.name}</p>
          <p className='text-zinc-400'>{user.email}</p>

          <p className='text-[0.8rem] mt-4 text-zinc-500'>ID {user.id}</p>
        </div>
      ))}
    </div>
  )
}
