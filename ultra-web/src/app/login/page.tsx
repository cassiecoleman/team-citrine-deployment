import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata = {
  title: 'Sign In • Ultra',
  description: 'Sign in to your Ultra account',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ultra</h1>
          <p className="mt-2 text-gray-600">Predictable, affordable rides</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign in to your account</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
