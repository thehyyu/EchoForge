import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  const prefersEnglish = /^en\b/i.test(acceptLanguage) && !/zh/i.test(acceptLanguage)

  redirect(prefersEnglish ? '/en' : '/zh')
}
