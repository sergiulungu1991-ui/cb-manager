'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { STATUS_OPTIONS } from '@/lib/status'
import { fetchJson, getErrorMessage } from '@/lib/fetch-json'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Model = {
  name: string
  image_url: string
  status?: string | null
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'no_status', label: 'No status' },
  ...STATUS_OPTIONS,
]

export default function Home() {
  const [models, setModels] = useState<Model[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(40)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rejecting, setRejecting] = useState(false)

  const fetchModels = useCallback(
    async (p: number) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          page: String(p),
        })

        if (statusFilter !== 'all') {
          params.set('status', statusFilter === 'no_status' ? 'null' : statusFilter)
        }

        const data = await fetchJson<Model[]>(`/api/models?${params.toString()}`)

        setModels(data)
        setStatuses(
          Object.fromEntries(
            data.map((model) => [model.name, model.status || '']),
          ),
        )
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load models'))
      } finally {
        setLoading(false)
      }
    },
    [limit, statusFilter],
  )

  useEffect(() => {
    fetchModels(page)
  }, [fetchModels, page])

  const sync = async () => {
    setSyncing(true)
    setError(null)

    try {
      await fetchJson('/api/sync', { method: 'POST' })
      await fetchModels(page)
    } catch (err) {
      setError(getErrorMessage(err, 'Sync failed'))
    } finally {
      setSyncing(false)
    }
  }

  const upsert = async (
    models: { name: string; status: string }[],
    fallbackMessage: string,
  ) => {
    await fetchJson('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models }),
    }).catch((err) => {
      setError(getErrorMessage(err, fallbackMessage))
      throw err
    })

    await fetchModels(page)
  }

  const saveStatus = async (name: string, status: string) => {
    // Optimistic update keeps the grid responsive while the request is in flight.
    setStatuses((prev) => ({ ...prev, [name]: status }))

    try {
      await upsert([{ name, status }], 'Save failed')
    } catch {
      setStatuses((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const pendingModels = useMemo(
    () => models.filter((model) => !statuses[model.name]),
    [models, statuses],
  )

  const rejectAll = async () => {
    if (pendingModels.length === 0) {
      return
    }

    setRejecting(true)
    setError(null)

    try {
      await upsert(
        pendingModels.map((model) => ({ name: model.name, status: 'reject' })),
        'Bulk reject failed',
      )
    } catch {
      // Error state is already set by `upsert`.
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#333]">
      <header className="border-b border-[#cfcfcf] bg-white">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-2.5 py-2">
          <div className="flex items-end gap-2">
            <h1 className="text-[23px] font-black leading-none tracking-[-1px] text-[#f47321]">
              CHATURBATE
            </h1>

            <span className="pb-[1px] text-[10px] font-bold uppercase tracking-wide text-[#777]">
              Manager
            </span>
          </div>

          <Button
            onClick={sync}
            disabled={syncing}
            size="sm"
            className="h-7 rounded-[2px] bg-[#f47321] px-3 text-[11px] font-bold uppercase text-white shadow-none hover:bg-[#dd6419]"
          >
            {syncing ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
            )}

            Sync
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-2.5 py-2.5">
        {error && (
          <div className="mb-2 border border-red-300 bg-red-50 px-2 py-1.5 text-[12px] text-red-700">
            {error}
          </div>
        )}

        <div className="mb-2.5 flex items-center justify-end gap-2">
          <span className="text-[11px] font-bold uppercase text-[#777]">
            Filter by status
          </span>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value || 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="h-7 w-[150px] rounded-[2px] border-[#cfcfcf] bg-white px-2 text-[11px] shadow-none focus:ring-1 focus:ring-[#f47321]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[150px] rounded-[2px] border border-[#cfcfcf] bg-white text-[#333] shadow-md">
              {FILTER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="py-1 text-[11px]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={rejectAll}
            disabled={rejecting || pendingModels.length === 0}
            size="sm"
            className="h-7 rounded-[2px] bg-[#c73f3f] px-3 text-[11px] font-bold uppercase text-white shadow-none hover:bg-[#a32d2d] disabled:opacity-50"
          >
            {rejecting ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : null}

            Reject all no status ({pendingModels.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#f47321]" />
          </div>
        ) : (
          <>
            <div
              className="
                grid
                grid-cols-2
                gap-[5px]
                sm:grid-cols-3
                md:grid-cols-4
                lg:grid-cols-5
                xl:grid-cols-6
                2xl:grid-cols-8
              "
            >
              {models.map((model) => {
                const status = STATUS_OPTIONS.find(
                  (option) => option.value === statuses[model.name],
                )

                return (
                  <article
                    key={model.name}
                    className="overflow-hidden border border-[#c9c9c9] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
                  >
                    <a
                      href={`/model?name=${encodeURIComponent(model.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block aspect-[4/3] overflow-hidden bg-[#111]"
                    >
                      <img
                        src={model.image_url}
                        alt={model.name}
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.015]"
                      />

                      {status && (
                        <span
                          className={`
                            absolute
                            bottom-0
                            right-0
                            px-1.5
                            py-[2px]
                            text-[9px]
                            font-bold
                            uppercase
                            leading-none
                            text-white
                            ${status.badge}
                          `}
                        >
                          {status.label}
                        </span>
                      )}
                    </a>

                    <div className="px-1.5 pb-1.5 pt-1">
                      <a
                        href={`/model?name=${encodeURIComponent(model.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[12px] font-bold leading-[15px] text-[#0b6c99] hover:underline"
                      >
                        {model.name}
                      </a>

                      <div className="mt-1 border-t border-[#ececec] pt-1">
                        <Select
                          value={statuses[model.name] || ''}
                          onValueChange={(value) => {
                            if (value) {
                              saveStatus(model.name, value)
                            }
                          }}
                        >
                          <SelectTrigger className="h-[24px] w-full rounded-[2px] border-[#cfcfcf] bg-white px-1.5 py-0 text-[10px] shadow-none focus:ring-1 focus:ring-[#f47321]">
                            <SelectValue placeholder="Set status..." />
                          </SelectTrigger>
                          <SelectContent className="min-w-[130px] rounded-[2px] border border-[#cfcfcf] bg-white text-[#333] shadow-md">
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="py-1 text-[11px]"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-1 pb-8">
              <Button
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={page <= 1}
                variant="outline"
                size="sm"
                className="h-7 rounded-[2px] border-[#c7c7c7] bg-white px-2.5 text-[11px] font-bold text-[#0b6c99] shadow-none"
              >
                « prev
              </Button>

              <span className="flex h-7 min-w-7 items-center justify-center bg-[#0b6c99] px-2 text-[11px] font-bold text-white">
                {page}
              </span>

              <Button
                onClick={() =>
                  setPage((current) => current + 1)
                }
                disabled={models.length < limit}
                variant="outline"
                size="sm"
                className="h-7 rounded-[2px] border-[#c7c7c7] bg-white px-2.5 text-[11px] font-bold text-[#0b6c99] shadow-none"
              >
                next »
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
