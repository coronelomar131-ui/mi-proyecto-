import dynamic from 'next/dynamic'

const RegisterForm = dynamic(() => import('./register-form').then(m => m.RegisterForm), { ssr: false })

export default function RegisterPage() {
  return <RegisterForm />
}
