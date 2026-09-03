import ModelClient from './model-client'
import { getModel } from '@/lib/api/models'
import type { Model } from '@/lib/api/schemas'

type PageProps = {
  searchParams: {
    name?: string | string[]
  }
}

function getParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.[0] ?? '')
}

function Message({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2] px-4">
      <div className="text-center text-[12px] text-red-700">{text}</div>
    </div>
  )
}

export default async function ModelPage({ searchParams }: PageProps) {
  const name = decodeURIComponent(getParam(searchParams.name) || '').trim()

  if (!name) {
    return <Message text="Missing model name" />
  }

  let model: Model

  try {
    model = await getModel(name)
  } catch {
    return <Message text={`Model "${name}" was not found`} />
  }

  return (
    <ModelClient
      name={model.name}
      imageUrl={model.image_url ?? ''}
      status={model.status ?? ''}
    />
  )
}
