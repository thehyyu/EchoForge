export default async function N8nHandbookLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>
}) {
  const { from, error } = await searchParams

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-2 text-xl font-semibold">n8n 組內操作手冊</h1>
      <p className="mb-6 text-sm text-gray-500">請輸入密碼繼續</p>
      {error && <p className="mb-4 text-sm text-red-600">密碼錯誤，請再試一次</p>}
      <form action="/api/n8n-handbook-login" method="POST" className="flex flex-col gap-3">
        <input type="hidden" name="from" value={from || '/n8n-handbook/'} />
        <input
          type="password"
          name="password"
          placeholder="密碼"
          autoFocus
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          進入
        </button>
      </form>
    </main>
  )
}
