'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_OPTIONS } from '@/lib/status'

type Model = {
  name: string
  image_url: string
  status?: string | null
}

export default function ModelPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const name = decodeURIComponent((params.name as string) || '')
  const pageParam = searchParams.get('page') || '1'

  const [imageUrl, setImageUrl] = useState(searchParams.get('image_url') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [showVideo, setShowVideo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (imageUrl && status) return

    const loadModel = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/models?limit=40&page=${pageParam}`)
        if (!res.ok) throw new Error('Failed to load model')

        const data: Model[] = await res.json()
        const found = data.find((model) => model.name === name)

        if (found) {
          setImageUrl(found.image_url)
          setStatus(found.status || '')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (name) {
      loadModel()
    }
  }, [name, pageParam, imageUrl, status])

  const saveStatus = async () => {
    if (!status) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status }),
      })

      if (!res.ok) throw new Error('Save failed')

      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] p-4">
      <a
        href="/"
        className="mb-3 inline-block text-[12px] font-bold text-[#0b6c99] hover:underline"
      >
        Back to list
      </a>

      <div className="mx-auto max-w-md overflow-hidden border border-[#c9c9c9] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-video bg-[#111]">
          {showVideo ? (
            <iframe
              src={`https://chaturbate.com/embed/${encodeURIComponent(name)}/?join_overlay=1&campaign=GeOP2&embed_video_only=1&disable_sound=1&tour=9oGW&mobileRedirect=never&disable_autoplay=1`}
              className="h-full w-full"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title={`${name} Live Cam`}
              loading="lazy"
            />
          ) : (
            <>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <span className="text-[11px] text-[#777]">No image</span>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
                aria-label="Watch live"
              >
                <Play className="h-12 w-12 fill-white text-white" />
              </button>
            </>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between">
            <h1 className="text-[18px] font-black tracking-[-0.5px] text-[#333]">
              {name}
            </h1>

            <Button
              onClick={() => setShowVideo((current) => !current)}
              size="sm"
              className="h-7 rounded-[2px] bg-[#333] px-2.5 text-[11px] font-bold text-white shadow-none hover:bg-[#222]"
            >
              {showVideo ? (
                <Square className="mr-1 h-3 w-3" />
              ) : (
                <Play className="mr-1 h-3 w-3" />
              )}
              {showVideo ? 'Stop' : 'Watch live'}
            </Button>
          </div>

          <a
            href={`https://chaturbate.com/${name}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-[12px] font-bold text-[#0b6c99] hover:underline"
          >
            Open on Chaturbate
          </a>

          <div className="mt-3">
            <Select value={status} onValueChange={(value) => setStatus(value || '')}>
              <SelectTrigger className="h-8 w-full rounded-[2px] border-[#cfcfcf] bg-white px-2 text-[12px] shadow-none focus:ring-1 focus:ring-[#f47321]">
                <SelectValue placeholder="Set status..." />
              </SelectTrigger>
              <SelectContent className="min-w-[150px] rounded-[2px] border border-[#cfcfcf] bg-white text-[#333] shadow-md">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-1 text-[12px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={saveStatus}
            disabled={saving || !status}
            className="mt-3 h-8 w-full rounded-[2px] bg-[#f47321] text-[12px] font-bold uppercase text-white shadow-none hover:bg-[#dd6419] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Save status
          </Button>

          {saved && (
            <div className="mt-2 text-[12px] font-bold text-[#3d9b49]">
              Saved successfully
            </div>
          )}

          {error && (
            <div className="mt-2 text-[12px] text-red-700">{error}</div>
          )}
        </div>
      </div>
    </div>
  )
}
