import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

export default async function AIAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <AIOptionsForm chatTypeId={id} />
}
