'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ModelPage = dynamic(() => import('./model-page'), {
  ssr: false,
})

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
      <div className="text-[12px] text-[#777]">Loading model...</div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ModelPage />
    </Suspense>
  )
}
