import dynamic from 'next/dynamic'

const ResetPasswordForm = dynamic(
  () => import('./reset-password-form').then((m) => m.ResetPasswordForm),
  { ssr: false }
)

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
