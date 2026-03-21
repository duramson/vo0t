/**
 * Combined radial temperature control:
 *  - Outer ring: set temperature (draggable handle)
 *  - Inner ring: heat-up progress (current / target)
 *  - Center: current temp (big), target temp (small)
 *  - Optional boost markers on outer ring
 *
 * 270° open-bottom arc for both rings.
 */
import { useRef, useCallback, useMemo, memo, useState } from 'preact/compat'
import { TEMP_MIN, TEMP_MAX } from '../ble/uuids'
import { useSettings } from '../store/settings'

type Props = {
  /** Current device temperature °C */
  current: number
  /** Set (target) temperature °C – also the draggable value */
  target: number
  /** Boost 1× temperature (absolute) */
  boost1?: number
  /** Boost 2× temperature (absolute) */
  boost2?: number
  /** Whether boost 1× is currently active */
  boostActive?: boolean
  /** Whether super boost (2×) is currently active */
  superBoostActive?: boolean
  /** Whether the device heater is actually on */
  heaterActive?: boolean
  /** Status label shown above the temperature */
  label?: string
  /** Called continuously while dragging */
  onChange: (val: number) => void
  /** Called once when drag ends (commit to BLE) */
  onCommit?: (val: number) => void
  min?: number
  max?: number
  size?: number
}

// ── Arc geometry ─────────────────────────────────────────

const ARC_START = -135 // degrees (12 o'clock = 0)
const ARC_END = 135
const ARC_SWEEP = 270 // = ARC_END - ARC_START

const BOOST_COLOR_1 = 'var(--color-accent-hover)'
const BOOST_COLOR_2 = 'var(--color-accent)'

const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180

/** SVG arc path from startDeg → endDeg on circle (cx, cy, r) */
function arc(start: number, end: number, r: number, cx: number, cy: number): string {
  if (Math.abs(end - start) < 0.5) return ''
  const x1 = cx + r * Math.cos(toRad(start))
  const y1 = cy + r * Math.sin(toRad(start))
  const x2 = cx + r * Math.cos(toRad(end))
  const y2 = cy + r * Math.sin(toRad(end))
  const large = Math.abs(end - start) > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

function valToAngle(v: number, min: number, max: number) {
  return ARC_START + ((v - min) / (max - min)) * ARC_SWEEP
}

function angleToVal(angle: number, min: number, max: number) {
  const clamped = Math.max(ARC_START, Math.min(ARC_END, angle))
  const pct = (clamped - ARC_START) / ARC_SWEEP
  return Math.round(min + pct * (max - min))
}

function ptOnArc(angle: number, r: number, cx: number, cy: number) {
  const rad = toRad(angle)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function getClientPos(
  e: MouseEvent | TouchEvent | Event,
): { clientX: number; clientY: number } | null {
  if ('touches' in e) {
    const touchE = e as TouchEvent
    if (touchE.touches.length > 0) {
      const touch = touchE.touches[0]
      if (!touch) return { clientX: 0, clientY: 0 }
      return { clientX: touch.clientX, clientY: touch.clientY }
    }
    return null
  }
  const mouseE = e as MouseEvent
  return { clientX: mouseE.clientX, clientY: mouseE.clientY }
}

function BoostMarker({
  temp,
  color,
  min,
  max,
  outerR,
  cx,
  cy,
  outerStroke,
}: {
  temp?: number
  color: string
  min: number
  max: number
  outerR: number
  cx: number
  cy: number
  outerStroke: number
}) {
  if (!temp || temp <= min || temp > max) return null
  const a = valToAngle(temp, min, max)
  const p1 = ptOnArc(a, outerR - outerStroke / 2 - 1, cx, cy)
  const p2 = ptOnArc(a, outerR + outerStroke / 2 + 1, cx, cy)
  return (
    <line
      x1={p1.x}
      y1={p1.y}
      x2={p2.x}
      y2={p2.y}
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      opacity="0.7"
    />
  )
}

function CenterText({
  cx,
  cy,
  label,
  current,
  effectiveTarget,
  isBoosting,
  superBoostActive,
  isDragging,
  isHeating,
}: {
  cx: number
  cy: number
  current: number
  effectiveTarget: number
  isBoosting: boolean
  superBoostActive: boolean
  isDragging: boolean
  isHeating: boolean
  label?: string
}) {
  const { formatTemp, unit, isCelsius } = useSettings()

  const currentFormatted = isCelsius ? `${current.toFixed(1)}${unit}` : formatTemp(current)

  const targetColorClass = isBoosting
    ? superBoostActive
      ? 'fill-[#ff5722] drop-shadow-[0_0_6px_#ff5722]'
      : 'fill-[#ffb5a0] drop-shadow-[0_0_6px_#ffb5a0]'
    : 'fill-accent'

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {label && (
        <text
          y="-45"
          text-anchor="middle"
          class={`fill-text-secondary/60 text-[10px] font-black tracking-[0.2em] uppercase transition-opacity duration-300 ${isDragging ? 'opacity-0' : 'opacity-100'} ${isHeating ? 'animate-pulse' : ''}`}
        >
          {label}
        </text>
      )}

      {/* Target Temperature (Dimm in center when not dragging, Big when dragging) */}
      <text
        y={isDragging ? '5' : '35'}
        text-anchor="middle"
        class={`origin-center font-black transition-all duration-300 ${
          isDragging ? 'text-5xl tracking-tighter' : 'text-2xl'
        } ${targetColorClass}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTemp(effectiveTarget)}
      </text>

      {/* Current Temperature (Big in center when not dragging, Small when dragging) */}
      <text
        y={isDragging ? '45' : '5'}
        text-anchor="middle"
        class={`origin-center font-extrabold transition-all duration-300 ${
          isDragging
            ? 'fill-text-secondary text-[16px] tracking-widest'
            : 'fill-text-primary text-5xl tracking-tighter'
        }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {isDragging ? 'ACTUAL ' : ''}
        {currentFormatted}
      </text>
    </g>
  )
}

function BoostArcActive({
  isBoosting,
  superBoostActive,
  target,
  targetAngle,
  boost1,
  boost2,
  min,
  max,
  outerR,
  cx,
  cy,
  outerStroke,
}: {
  isBoosting: boolean
  superBoostActive: boolean
  target: number
  targetAngle: number
  boost1?: number
  boost2?: number
  min: number
  max: number
  outerR: number
  cx: number
  cy: number
  outerStroke: number
}) {
  if (!isBoosting) return null
  const boostTarget = superBoostActive && boost2 ? boost2 : boost1
  if (!boostTarget || boostTarget <= target) return null
  const boostAngle = valToAngle(Math.min(boostTarget, max), min, max)
  const color = superBoostActive ? BOOST_COLOR_2 : BOOST_COLOR_1
  return (
    <path
      d={arc(targetAngle, boostAngle, outerR, cx, cy)}
      fill="none"
      stroke={color}
      stroke-width={outerStroke}
      stroke-linecap="round"
      opacity="0.8"
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
    />
  )
}

// ──────────────────────────────────────────────────────────

export const TemperatureControl = memo(function TemperatureControl({
  current,
  target,
  boost1,
  boost2,
  boostActive = false,
  superBoostActive = false,
  heaterActive = false,
  label,
  onChange,
  onCommit,
  min = TEMP_MIN,
  max = TEMP_MAX,
  size = 280,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const cx = size / 2
  const cy = size / 2
  const outerStroke = 8
  const innerStroke = 10
  const gap = 14 // space between rings
  const outerR = cx - outerStroke / 2 - 2 // small margin to prevent clip
  const innerR = outerR - gap - innerStroke / 2

  // Crop SVG height: bottom of arc ≈ cy + r·sin(45°)
  const svgH = Math.ceil(cy + outerR * 0.78 + outerStroke)

  const [isDragging, setIsDragging] = useState(false)

  // ── Angles ─────────────────────────────────────────────

  const targetAngle = valToAngle(target, min, max)

  // Effective target: boost temp when boosting, base temp otherwise
  const effectiveTarget =
    superBoostActive && boost2 ? boost2 : boostActive && boost1 ? boost1 : target
  const isBoosting = boostActive || superBoostActive
  const isHeating = heaterActive && current < effectiveTarget - 2

  const progress = useMemo(() => {
    if (target <= 0) return 0
    return Math.min(Math.max(current / target, 0), 1)
  }, [current, target])

  // Inner ring: map current temp on same scale as outer ring, clamped to effective target
  const progressAngle = useMemo(() => {
    const clamped = Math.max(min, Math.min(current, effectiveTarget))
    return valToAngle(clamped, min, max)
  }, [current, effectiveTarget, min, max])

  const progressColor = useMemo(() => {
    if (effectiveTarget > 0 && current >= effectiveTarget) return 'var(--color-success)'
    if (effectiveTarget > 0 && current >= effectiveTarget * 0.9) return 'var(--color-warning)'
    return 'var(--color-accent)'
  }, [current, effectiveTarget])

  // ── Drag logic (outer ring only) ──────────────────────

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    return Math.atan2(dx, -dy) * (180 / Math.PI)
  }, [])

  const move = useCallback(
    (clientX: number, clientY: number) => {
      let angle = getAngle(clientX, clientY)
      // Prevent jumping in the "dead zone" at the bottom (between 135 and 225 / -135 degrees)
      if (angle > 135 && angle < 180) {
        angle = 135
      } else if (angle < -135 || angle > 180) {
        angle = -135
      }
      const val = angleToVal(angle, min, max)
      // Haptic feedback on whole integer change
      if (navigator.vibrate && Math.abs(val - target) >= 1) {
        navigator.vibrate(5)
      }
      onChange(val)
    },
    [getAngle, onChange, min, max, target],
  )

  const onStart = useCallback(
    (e: MouseEvent | TouchEvent | Event) => {
      e.preventDefault()
      const pos = getClientPos(e)
      if (!pos) return
      dragging.current = true
      setIsDragging(true)
      if (navigator.vibrate) navigator.vibrate(10)
      move(pos.clientX, pos.clientY)
    },
    [move],
  )

  const onMove = useCallback(
    (e: MouseEvent | TouchEvent | Event) => {
      if (!dragging.current) return
      e.preventDefault()
      const pos = getClientPos(e)
      if (!pos) return
      move(pos.clientX, pos.clientY)
    },
    [move],
  )

  const onEnd = useCallback(() => {
    if (dragging.current) {
      if (onCommit) onCommit(target)
      setIsDragging(false)
      if (navigator.vibrate) navigator.vibrate(20)
    }
    dragging.current = false
  }, [onCommit, target])

  // ── Handle position ────────────────────────────────────

  const handle = ptOnArc(targetAngle, outerR, cx, cy)

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="auto"
      viewBox={`0 0 ${size} ${svgH}`}
      overflow="visible"
      class="w-full cursor-pointer touch-none select-none"
      style={{ maxWidth: `${size}px`, marginInline: 'auto' }}
      role="slider"
      aria-valuenow={target}
      aria-valuemin={min}
      aria-valuemax={max}
      onMouseDown={onStart as unknown as preact.JSX.MouseEventHandler<SVGSVGElement>}
      onMouseMove={onMove as unknown as preact.JSX.MouseEventHandler<SVGSVGElement>}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart as unknown as preact.JSX.TouchEventHandler<SVGSVGElement>}
      onTouchMove={onMove as unknown as preact.JSX.TouchEventHandler<SVGSVGElement>}
      onTouchEnd={onEnd}
    >
      {/* ── Outer ring: track ─────────────────────────────── */}
      <path
        d={arc(ARC_START, ARC_END, outerR, cx, cy)}
        fill="none"
        stroke="var(--color-border)"
        stroke-width={outerStroke}
        stroke-linecap="round"
      />
      {/* Outer ring: filled to target angle */}
      {target > min && (
        <path
          d={arc(ARC_START, targetAngle, outerR, cx, cy)}
          fill="none"
          stroke="var(--color-accent-hover)"
          stroke-width={outerStroke}
          stroke-linecap="round"
        />
      )}

      {/* Boost markers on outer ring */}
      <BoostMarker
        temp={boost1}
        color={BOOST_COLOR_1}
        min={min}
        max={max}
        outerR={outerR}
        cx={cx}
        cy={cy}
        outerStroke={outerStroke}
      />
      <BoostMarker
        temp={boost2}
        color={BOOST_COLOR_2}
        min={min}
        max={max}
        outerR={outerR}
        cx={cx}
        cy={cy}
        outerStroke={outerStroke}
      />

      {/* Boost active arc: handle → active boost marker */}
      <BoostArcActive
        isBoosting={isBoosting}
        superBoostActive={superBoostActive}
        target={target}
        targetAngle={targetAngle}
        boost1={boost1}
        boost2={boost2}
        min={min}
        max={max}
        outerR={outerR}
        cx={cx}
        cy={cy}
        outerStroke={outerStroke}
      />

      {/* Outer ring: draggable handle */}
      <circle
        cx={handle.x}
        cy={handle.y}
        r={12}
        fill="var(--color-accent)"
        stroke="var(--color-bg)"
        stroke-width="3"
        class={isHeating ? 'animate-pulse' : ''}
        style={{ filter: 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.4))' }}
      />

      {/* ── Inner ring: track ─────────────────────────────── */}
      <path
        d={arc(ARC_START, ARC_END, innerR, cx, cy)}
        fill="none"
        stroke="var(--color-border)"
        stroke-width={innerStroke}
        stroke-linecap="round"
        opacity="0.5"
      />
      {/* Inner ring: progress (current/target) */}
      {progress > 0.005 && (
        <path
          d={arc(ARC_START, progressAngle, innerR, cx, cy)}
          fill="none"
          stroke={progressColor}
          stroke-width={innerStroke}
          stroke-linecap="round"
          class={`transition-colors duration-1000 ${isHeating ? 'animate-pulse' : ''}`}
          style={{ filter: `drop-shadow(0 0 6px ${progressColor})` }}
        />
      )}

      {/* ── Center text ───────────────────────────────────── */}

      <CenterText
        cx={cx}
        cy={cy}
        label={label}
        current={current}
        effectiveTarget={effectiveTarget}
        isBoosting={isBoosting}
        superBoostActive={superBoostActive}
        isDragging={isDragging}
        isHeating={isHeating}
      />
    </svg>
  )
})
