export const STATUS_OPTIONS = [
  { value: 'no_content', label: 'No content', badge: 'bg-[#777]' },
  { value: 'love', label: 'Love', badge: 'bg-[#d85a8a]' },
  { value: 'reject', label: 'Reject', badge: 'bg-[#c73f3f]' },
  { value: 'waiting', label: 'Waiting', badge: 'bg-[#d99a24]' },
  { value: 'asap', label: 'ASAP', badge: 'bg-[#3d9b49]' },
] as const

export type ModelStatus = (typeof STATUS_OPTIONS)[number]['value']

export const STATUS_VALUES = STATUS_OPTIONS.map(
  (option) => option.value,
) as unknown as [ModelStatus, ...ModelStatus[]]
