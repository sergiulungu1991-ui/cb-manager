'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Model = { name: string; image_url: string }

const STATUS_OPTIONS = [
  { value: 'no_content', label: 'No content', color: 'bg-gray-500 hover:bg-gray-600' },
  { value: 'love', label: 'Love', color: 'bg-pink-600 hover:bg-pink-700' },
  { value: 'reject', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'waiting', label: 'Waiting', color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'asap', label: 'ASAP', color: 'bg-green-600 hover:bg-green-700' },
]

export default function Home() {
  const [models, setModels] = useState<Model[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/models?limit=${limit}&page=${p}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setModels(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels(page)
  }, [page])

  const sync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      await fetchModels(page)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const saveStatus = async (name: string, status: string) => {
    setStatuses(prev => ({ ...prev, [name]: status }))
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status }),
      })
      if (!res.ok) throw new Error('Save failed')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className='min-h-screen bg-[#f0f1f2] font-sans'>
      <header className='bg-white border-b border-gray-300 shadow-sm'>
        <div className='max-w-[1440px] mx-auto px-3 py-2.5 flex items-center justify-between'>
          <h1 className='text-[22px] font-extrabold tracking-tight leading-none'>
            <span className='text-[#f47321]'>CHATURBATE</span>
            <span className='text-gray-400 text-xs font-normal ml-2 align-middle'>MANAGER</span>
          </h1>
          <Button
            onClick={sync}
            disabled={syncing}
            size='sm'
            className='bg-[#f47321] hover:bg-[#e05f0f] text-white text-[13px] font-semibold rounded-sm shadow-none'
          >
            {syncing ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <RefreshCw className='w-3.5 h-3.5' />}
            SYNC
          </Button>
        </div>
        <div className='bg-[#0b5c7d]'>
          <div className='max-w-[1440px] mx-auto px-3 flex text-[13px] font-semibold'>
            <span className='px-4 py-1.5 bg-[#f47321] text-white rounded-t-sm'>FEATURED</span>
            <span className='px-4 py-1.5 text-white/80 hover:bg-white/10 cursor-default'>FEMALE</span>
            <span className='px-4 py-1.5 text-white/80 hover:bg-white/10 cursor-default'>COUPLES</span>
            <span className='px-4 py-1.5 text-white/80 hover:bg-white/10 cursor-default'>PAGE {page}</span>
          </div>
        </div>
      </header>

      <main className='max-w-[1440px] mx-auto px-3 py-3'>
        {error && <p className='text-red-600 mb-3 text-sm'>{error}</p>}

        {loading ? (
          <div className='flex justify-center p-16'>
            <Loader2 className='w-8 h-8 animate-spin text-[#f47321]' />
          </div>
        ) : (
          <>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[6px]'>
              {models.map((m, i) => {
                const st = STATUS_OPTIONS.find(o => o.value === statuses[m.name])
                return (
                  <Card
                    key={m.name}
                    className='group p-0 rounded-[3px] border-[#d6d6d6] bg-white shadow-none hover:shadow-md transition-shadow overflow-hidden'
                  >
                    <a
                      href={`https://chaturbate.com/${m.name}/`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='relative block aspect-[16/10] overflow-hidden bg-black'
                    >
                      <img src={m.image_url} alt={m.name} className='w-full h-full object-cover' />
                      <span className='absolute top-1 right-1 text-white/70 hover:text-white drop-shadow'>
                        <svg viewBox='0 0 24 24' className='w-[18px] h-[18px] fill-current'>
                          <path d='M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.2 6.55L12 17.1l-5.95 3.15 1.2-6.55L2.5 9.3l6.6-1.04L12 2z'/>
                        </svg>
                      </span>
                      {st && (
                        <Badge className={`absolute bottom-1 right-0 rounded-none rounded-tl-sm px-2 py-0.5 text-[10px] font-bold uppercase text-white border-0 ${st.color}`}>
                          {st.label}
                        </Badge>
                      )}
                    </a>
                    <CardContent className='p-1.5 space-y-0.5'>
                      <div className='flex items-center gap-1'>
                        <a
                          href={`https://chaturbate.com/${m.name}/`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-[13px] font-bold text-[#0c6a93] hover:underline truncate'
                        >
                          {m.name}
                        </a>
                        <span className='ml-auto text-[11px] text-gray-500 font-semibold'>{18 + ((i * 7) % 12)}</span>
                        <svg viewBox='0 0 24 24' className='w-3.5 h-3.5 shrink-0 fill-[#d8618f]'>
                          <path d='M12 4a4 4 0 110 8 4 4 0 010-8zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z'/>
                        </svg>
                      </div>

                      <Select
                        value={statuses[m.name] || ''}
                        onValueChange={(value) => value && saveStatus(m.name, value)}
                      >
                        <SelectTrigger className='w-full h-6 text-[11px] text-gray-700 bg-white border-gray-200 rounded-sm px-1.5 py-0.5 focus:ring-[#f47321] focus:ring-1'>
                          <SelectValue placeholder='Set status...' className='text-[11px]' />
                        </SelectTrigger>
                        <SelectContent className='min-w-[140px] text-[12px]'>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className='text-[12px] py-1'>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className='flex items-center gap-1 text-[10.5px] text-gray-500 border-t border-gray-100 pt-0.5'>
                        <svg viewBox='0 0 24 24' className='w-3 h-3 fill-gray-400'>
                          <path d='M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z'/>
                        </svg>
                        <span>{((i * 13) % 60) / 10 + 0.5} hrs, {(1000 + i * 1837).toLocaleString()} viewers</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className='flex justify-center items-center gap-1 mt-6 pb-10'>
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                variant='outline'
                size='sm'
                className='text-[#0c6a93] border-[#d6d6d6] hover:bg-gray-50 rounded-sm text-[13px] font-semibold disabled:opacity-40'
              >
                &laquo; prev
              </Button>
              <span className='px-3 py-1.5 text-[13px] bg-[#0c6a93] text-white font-bold rounded-sm'>{page}</span>
              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={models.length < limit}
                variant='outline'
                size='sm'
                className='text-[#0c6a93] border-[#d6d6d6] hover:bg-gray-50 rounded-sm text-[13px] font-semibold disabled:opacity-40'
              >
                next &raquo;
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
