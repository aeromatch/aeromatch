import { redirect } from 'next/navigation'

/** Ruta histórica /about → canonical SEO /sobre-aeromatch */
export default function AboutLegacyRedirect() {
  redirect('/sobre-aeromatch')
}
