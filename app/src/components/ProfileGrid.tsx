import { useState, useCallback } from 'preact/hooks'
import { memo } from 'preact/compat'
import { useCrafty } from '../hooks/useCrafty'
import { useSettings } from '../store/settings'
import { useProfileStore, type Profile } from '../store/profiles'
import { ProfileEditCard } from './ProfileEditCard'

interface ProfileGridProps {
  activeProfileId: string | null
  onActivate: (profile: Profile) => void
  onDeactivate: () => void
}

const DeleteConfirmCard = memo(function DeleteConfirmCard({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div class="bg-surface-container-low relative flex flex-col items-center justify-center rounded-2xl p-4 py-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-150">
      <div class="text-danger mb-2 text-sm font-semibold">Delete profile?</div>
      <div class="text-text-secondary mb-4 text-center text-xs">
        "{name}" will be permanently deleted.
      </div>
      <div class="flex w-full gap-2">
        <button
          type="button"
          onClick={onConfirm}
          class="bg-danger flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onCancel}
          class="bg-surface-container-high text-text-secondary flex-1 rounded-xl py-2.5 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  )
})

const CompactCard = memo(function CompactCard({
  profile: p,
  active,
  onActivate,
  onDeactivate,
}: {
  profile: Profile
  active: boolean
  onActivate: (p: Profile) => void
  onDeactivate: () => void
}) {
  const { isCelsius, unit, formatTemp } = useSettings()

  return (
    <button
      type="button"
      onClick={active ? onDeactivate : () => onActivate(p)}
      class={`active:bg-surface-container relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.98] ${
        active
          ? 'bg-accent/10 shadow-[0_0_20px_rgba(255,87,34,0.15),inset_0_1px_1px_rgba(255,87,34,0.3)]'
          : 'bg-surface-container-low shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]'
      }`}
    >
      {active && (
        <div class="bg-accent/10 absolute top-0 right-0 h-12 w-12 translate-x-6 -translate-y-6 rotate-45" />
      )}
      <div class="relative z-10 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="font-headline truncate pr-2 text-[13px] leading-tight font-bold">
            {p.name}
          </span>
          {active && <span class="bg-accent h-1.5 w-1.5 rounded-full" />}
        </div>
        <div class="flex items-end justify-between">
          <div class="flex flex-col">
            <span class="text-text-secondary/55 text-[10px] font-bold tracking-widest uppercase">
              Temp
            </span>
            <span class="text-[13px] font-bold">{formatTemp(p.setTemp)}</span>
          </div>
          <div class="flex flex-col items-end text-right">
            <span class="text-text-secondary/55 text-[10px] font-bold tracking-widest uppercase">
              Boost
            </span>
            <span class={`text-[13px] font-bold ${active ? 'text-accent' : ''}`}>
              +{isCelsius ? p.boostTemp : Math.round((p.boostTemp * 9) / 5)}
              {unit}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
})

const ExpandedCard = memo(function ExpandedCard({
  profile: p,
  active,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
}: {
  profile: Profile
  active: boolean
  onActivate: (p: Profile) => void
  onDeactivate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { formatTemp, isCelsius, unit } = useSettings()

  // Note: For boost we show it as a relative step.
  // 10°C boost = 18°F boost.
  const displayBoost = isCelsius ? p.boostTemp : Math.round((p.boostTemp * 9) / 5)

  const stats = [
    ['Temp', formatTemp(p.setTemp)],
    ['Boost', `+${displayBoost}${unit}`],
  ] as const

  return (
    <div
      class={`relative rounded-2xl p-4 transition-all duration-150 ${
        active
          ? 'bg-accent/10 shadow-[0_0_20px_rgba(255,87,34,0.15),inset_0_1px_1px_rgba(255,87,34,0.3)]'
          : 'bg-surface-container-low shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]'
      }`}
    >
      <button
        type="button"
        onClick={() => onDelete(p.id)}
        class="text-text-muted hover:text-danger hover:bg-danger/10 absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors"
      >
        ✕
      </button>
      <div class="mb-3 flex items-center gap-2 pr-8">
        <span class={`text-sm font-semibold ${active ? 'text-accent' : 'text-text-primary'}`}>
          {p.name}
        </span>
        <button
          type="button"
          onClick={() => onEdit(p.id)}
          class="text-text-muted hover:text-text-secondary text-[10px] transition-colors"
        >
          ✎
        </button>
      </div>
      <div class="mb-4 grid grid-cols-3 gap-2">
        {stats.map(([l, v]) => (
          <div key={l} class="bg-surface-container rounded-lg px-2 py-2 text-center">
            <div class="text-text-muted mb-0.5 text-[9px] tracking-wider uppercase">{l}</div>
            <div class="text-text-primary text-sm font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={active ? onDeactivate : () => onActivate(p)}
        class={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-accent/15 text-accent' : 'bg-surface-container text-text-secondary hover:bg-surface-hover'}`}
      >
        {active ? '✓ Active' : 'Activate'}
      </button>
    </div>
  )
})

export function ProfileGrid({ activeProfileId, onActivate, onDeactivate }: ProfileGridProps) {
  const { state } = useCrafty()
  const profiles = useProfileStore((s) => s.profiles)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const handleAdd = useCallback(() => {
    const { addProfile, profiles } = useProfileStore.getState()
    const p = addProfile({
      name: `Profile ${profiles.length + 1}`,
      setTemp: state.setTemp,
      boostTemp: state.boostTemp,
    })
    setEditingId(p.id)
    setShowAll(true)
  }, [state.setTemp, state.boostTemp])

  const handleDelete = useCallback(
    (id: string) => {
      useProfileStore.getState().deleteProfile(id)
      setDeleteId(null)
      if (activeProfileId === id) onDeactivate()
    },
    [activeProfileId, onDeactivate],
  )

  const handleSave = useCallback(
    (id: string, updates: Partial<Omit<Profile, 'id'>>) => {
      useProfileStore.getState().updateProfile(id, updates)
      setEditingId(null)
    },
    [],
  )

  const visibleProfiles = showAll ? profiles : profiles.slice(0, 3)

  // Memoize stable callbacks for child components to avoid re-renders
  const handleActivate = useCallback((p: Profile) => onActivate(p), [onActivate])
  const handleEdit = useCallback((id: string) => setEditingId(id), [])
  const handleDeleteConfirm = useCallback((id: string) => setDeleteId(id), [])
  const handleCancelEdit = useCallback(() => setEditingId(null), [])
  const handleCancelDelete = useCallback(() => setDeleteId(null), [])

  return (
    <div>
      <div class="mb-3.5 flex items-center justify-between">
        <h3 class="text-text-secondary font-headline text-sm font-extrabold tracking-wider uppercase">
          Quick Profiles
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          class="text-accent hover:text-accent-hover -mr-1 rounded-full p-1 text-lg leading-none transition-colors"
        >
          <span class="material-symbols-outlined text-base">add_circle</span>
        </button>
      </div>

      {showAll ? (
        <div class="fade-in space-y-3">
          {profiles.map((p) => {
            const active = activeProfileId === p.id
            if (editingId === p.id)
              return (
                <ProfileEditCard
                  key={p.id}
                  profile={p}
                  onSave={(u) => handleSave(p.id, u)}
                  onCancel={handleCancelEdit}
                />
              )
            if (deleteId === p.id)
              return (
                <DeleteConfirmCard
                  key={p.id}
                  name={p.name}
                  onConfirm={() => handleDelete(p.id)}
                  onCancel={handleCancelDelete}
                />
              )
            return (
              <ExpandedCard
                key={p.id}
                profile={p}
                active={active}
                onActivate={handleActivate}
                onDeactivate={onDeactivate}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
              />
            )
          })}
          <button
            type="button"
            onClick={() => setShowAll(false)}
            class="text-text-muted hover:text-text-secondary w-full py-2.5 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            ▲ Show less
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-2 gap-3.5">
          {visibleProfiles.map((p) => (
            <CompactCard
              key={p.id}
              profile={p}
              active={activeProfileId === p.id}
              onActivate={handleActivate}
              onDeactivate={onDeactivate}
            />
          ))}
          {profiles.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              class="bg-surface-container-low/30 hover:bg-surface-container-low group flex cursor-pointer items-center justify-center rounded-2xl p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all"
            >
              <div class="flex flex-col items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
                <span class="material-symbols-outlined text-lg">grid_view</span>
                <span class="text-[10px] font-bold tracking-[0.14em] uppercase">More</span>
              </div>
            </button>
          ) : profiles.length < 4 ? (
            <button
              type="button"
              onClick={handleAdd}
              class="bg-surface-container-low/20 hover:bg-surface-container-low/40 group flex cursor-pointer items-center justify-center rounded-2xl p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] transition-all"
            >
              <div class="flex flex-col items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
                <span class="material-symbols-outlined text-lg">add</span>
                <span class="text-[10px] font-bold tracking-[0.14em] uppercase">New</span>
              </div>
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
