import dynamic from 'next/dynamic'

const LoginForm = dynamic(() => import('./login-form').then(m => m.LoginForm), { ssr: false })

export default function LoginPage() {
  return <LoginForm />
}
