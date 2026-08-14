import { FormEvent, useEffect, useState } from 'react'

type Member = { id: number; first_name: string; last_name: string; email?: string; phone?: string }
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export default function App() {
  const [members, setMembers] = useState<Member[]>([])
  const [error, setError] = useState('')
  const load = () => { void fetch(`${apiUrl}/members`).then(r => r.ok ? r.json() : Promise.reject()).then(setMembers).catch(() => setError('Could not reach the API.')) }
  useEffect(load, [])
  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const response = await fetch(`${apiUrl}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first_name: form.get('first_name'), last_name: form.get('last_name'), email: form.get('email') || null, phone: form.get('phone') || null }) })
    if (!response.ok) { setError('Unable to save member.'); return }
    event.currentTarget.reset(); setError(''); load()
  }
  return <main><header><h1>Ecclesia</h1><p>Church management</p></header><section><h2>Members <span>{members.length}</span></h2>{error && <p className="error">{error}</p>}<form onSubmit={addMember}><input name="first_name" placeholder="First name" required /><input name="last_name" placeholder="Last name" required /><input name="email" type="email" placeholder="Email (optional)" /><input name="phone" placeholder="Phone (optional)" /><button>Add member</button></form><ul>{members.map(member => <li key={member.id}><strong>{member.first_name} {member.last_name}</strong><small>{member.email ?? member.phone ?? 'No contact details'}</small></li>)}</ul></section></main>
}
