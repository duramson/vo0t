import { useMainPageLogic } from '../hooks/useMainPageLogic'
import { ProfileGrid } from '../components/ProfileGrid'
import { Slider } from '../components/Slider'
import { TemperatureControl } from '../components/TemperatureControl'
import { useSettings } from '../store/settings'

export function MainPage() {
  const {
    state,
    canHeaterControl,
    activeProfile,
    displaySetTemp,
    displayBoost,
    boostTemp1,
    boostTemp2,
    label,
    commitTemp,
    commitBoost,
    handleTempChange,
    handleBoostChange,
    handleActivateProfile,
    handleDeactivateProfile,
    toggleHeater,
  } = useMainPageLogic()

  const { isCelsius, unit, cToApp } = useSettings()

  return (
    <main class="pb-page-bottom flex flex-col gap-(--spacing-section) px-(--spacing-page) pt-2">
      {/* ── Gauge + heater toggle ── */}
      <section class="flex flex-col items-center pt-2">
        <div class="relative mx-auto flex w-full max-w-85 flex-col items-center">
          {/* Active profile badge inside the gauge */}
          <div class="pointer-events-none absolute top-17.5 left-1/2 z-10 flex h-6 -translate-x-1/2 items-center justify-center">
            {activeProfile && (
              <p class="bg-accent/15 text-accent rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm backdrop-blur-md">
                ● {activeProfile.name}
              </p>
            )}
          </div>

          <TemperatureControl
            current={state.currentTemp}
            target={displaySetTemp}
            boost1={boostTemp1}
            boost2={boostTemp2}
            boostActive={state.boostActive}
            superBoostActive={state.superBoostActive}
            heaterActive={state.heaterActive}
            label={label}
            onChange={handleTempChange}
            onCommit={commitTemp}
            size={320}
          />

          {/* Controls Row under Gauge */}
          <div class="z-10 -mx-4 -mt-8 flex w-full items-center justify-between pb-6">
            {/* Boost 1x Complication (Apple Watch Style) */}
            <div class="bg-surface-container-high relative flex h-14 w-14 shrink-0 -translate-x-4 flex-col items-center justify-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg class="pointer-events-none absolute inset-0" viewBox="0 0 56 56">
                <path id="curve-b1" d="M 8 32 A 20 20 0 0 1 48 32" fill="none" />
                <text
                  class="font-sans text-[7.5px] font-black tracking-[0.15em] drop-shadow-[0_0_4px_rgba(255,181,160,0.4)]"
                  fill="var(--color-accent-hover)"
                >
                  <textPath href="#curve-b1" startOffset="50%" text-anchor="middle">
                    BOOST
                  </textPath>
                </text>
              </svg>
              <span class="text-text-primary pt-2 text-[14px] font-black tabular-nums">
                {cToApp(boostTemp1)}°
              </span>
            </div>

            {/* Heater Button */}
            {canHeaterControl && (
              <button
                type="button"
                onClick={toggleHeater}
                class={`flex shrink-0 items-center gap-2 rounded-full px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none active:scale-95 ${
                  state.heaterActive
                    ? 'bg-accent/20 text-accent shadow-[0_0_20px_rgba(255,87,34,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-text-secondary bg-surface-container-high'
                }`}
              >
                <span
                  class="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span class="text-[11px] font-bold tracking-widest uppercase">
                  Heater {state.heaterActive ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Boost 2x Complication (Apple Watch Style) */}
            <div class="bg-surface-container-high relative flex h-14 w-14 shrink-0 translate-x-4 flex-col items-center justify-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg class="pointer-events-none absolute inset-0" viewBox="0 0 56 56">
                <path id="curve-b2" d="M 6 32 A 22 22 0 0 1 50 32" fill="none" />
                <text
                  class="font-sans text-[7.5px] font-black tracking-widest drop-shadow-[0_0_4px_rgba(255,87,34,0.4)]"
                  fill="var(--color-accent)"
                >
                  <textPath href="#curve-b2" startOffset="50%" text-anchor="middle">
                    S-BOOST
                  </textPath>
                </text>
              </svg>
              <span class="text-text-primary pt-2 text-[14px] font-black tabular-nums">
                {cToApp(boostTemp2)}°
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Controls: boost slider + profiles ── */}
      <section class="flex flex-col gap-(--spacing-section)">
        <div class="bg-surface-container-low rounded-[20px] p-3 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <Slider
            label="Boost Level"
            displayValue={`+${isCelsius ? displayBoost : Math.round((displayBoost * 9) / 5)}${unit}`}
            value={displayBoost}
            min={0}
            max={15}
            step={1}
            ticks={isCelsius ? ['0°', '5°', '10°', '15°'] : ['0°', '9°', '18°', '27°']}
            onChange={handleBoostChange}
            onCommit={commitBoost}
          />
        </div>

        <ProfileGrid
          activeProfileId={activeProfile?.id ?? null}
          onActivate={handleActivateProfile}
          onDeactivate={handleDeactivateProfile}
        />
      </section>
    </main>
  )
}
