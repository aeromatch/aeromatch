import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { AuthForm } from '@/components/auth/AuthForm'
import { LanguageSwitchServer } from '@/components/ui/LanguageSwitchServer'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Header with language switch */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <LanguageSwitchServer />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Logo size="lg" />
          </div>
          
          <AuthForm />
        </div>
      </main>
    </div>
  )
}
