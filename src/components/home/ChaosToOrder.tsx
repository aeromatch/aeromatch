'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  CreditCard,
  FileText,
  Grid3X3,
  Search,
  ShieldCheck,
  Upload,
  MessageCircle,
  Check,
} from 'lucide-react'

type Act =
  | 'act1_docs'
  | 'bridge1'
  | 'act2_solution_docs'
  | 'act3_hiring_chaos'
  | 'bridge2'
  | 'act4_solution_hiring'

const COLORS = {
  navy950: '#0B132B',
  navy900: '#1A2642',
  navy800: '#263666',
  gold500: '#C9A24D',
  steel400: '#8899AA',
  steel200: '#C2CED9',
  teal: '#1D9E75',
  blue: '#378ADD',
  white: '#FFFFFF',
  border: '#3A4A6B',
}

function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])
  return isMobile
}

function ChaosPaperCard(props: {
  show: boolean
  dropDelayMs: number
  rotationDeg: number
  left: number
  top: number
  children: React.ReactNode
  dim?: boolean
  collapse?: boolean
}) {
  const base = {
    left: `${props.left}%`,
    top: `${props.top}%`,
    transform: `rotate(${props.rotationDeg}deg)`,
  } as React.CSSProperties

  const collapseStyle = props.collapse
    ? ({
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(0.7) rotate(${props.rotationDeg}deg)`,
        transition: 'transform 400ms ease-in, left 400ms ease-in, top 400ms ease-in, opacity 200ms ease-in',
      } as React.CSSProperties)
    : ({} as React.CSSProperties)

  return (
    <div
      className={`paper absolute w-[160px] ${props.show ? 'paperShow' : 'paperHide'}`}
      style={{
        ...base,
        ...(props.show ? {} : { pointerEvents: 'none' }),
        opacity: props.show ? (props.dim ? 0.85 : 1) : 0,
        animationDelay: `${props.dropDelayMs}ms`,
        ['--r' as any]: `${props.rotationDeg}deg`,
        ...(props.collapse ? collapseStyle : {}),
      }}
    >
      {props.children}
    </div>
  )
}

function SolutionCard(props: {
  show: boolean
  delayMs: number
  widthPx: number
  children: React.ReactNode
  hide?: boolean
  stronger?: boolean
}) {
  return (
    <div
      className={`solutionCard ${props.show ? 'slideUpFade' : 'hidden'} ${props.hide ? 'solutionExit' : ''} ${
        props.stronger ? 'solutionStrong' : ''
      }`}
      style={{ width: `${props.widthPx}px`, animationDelay: `${props.delayMs}ms` }}
    >
      {props.children}
    </div>
  )
}

function Chip(props: { children: React.ReactNode; show: boolean; delayMs?: number }) {
  return (
    <span
      className={`chip ${props.show ? 'fadeIn' : 'chipHidden'}`}
      style={{ animationDelay: `${props.delayMs || 0}ms` }}
    >
      {props.children}
    </span>
  )
}

function CursorSvg(props: { active: boolean }) {
  return (
    <svg
      className={`cursorSvg ${props.active ? 'cursorMove' : ''}`}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3l14 8-8 2-2 8-4-18z"
        fill={COLORS.white}
        stroke={COLORS.border}
        strokeWidth="1"
      />
    </svg>
  )
}

export function ChaosToOrderLegacy() {
  const isMobile = useMobile()
  const [loopKey, setLoopKey] = useState(0)
  const [act, setAct] = useState<Act>('act1_docs')

  // Act 1
  const [docCount, setDocCount] = useState(0) // 0..5
  const [collapseDocs, setCollapseDocs] = useState(false)
  const [showDropzone, setShowDropzone] = useState(false)
  const [progressOn, setProgressOn] = useState(false)

  // Bridge
  const [bridgeText, setBridgeText] = useState<string | null>(null)

  // Act 2
  const [solDocCount, setSolDocCount] = useState(0) // 0..3
  const [solDocExit, setSolDocExit] = useState(false)

  // Act 3
  const [hireChaosCount, setHireChaosCount] = useState(0) // 0..5
  const [hireShake, setHireShake] = useState(false)
  const [hireVanish, setHireVanish] = useState(false)

  // Act 4
  const [filtersCount, setFiltersCount] = useState(0) // 0..3
  const [searchFound, setSearchFound] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [cursorGo, setCursorGo] = useState(false)
  const [btnPulse, setBtnPulse] = useState(false)
  const [btnChecked, setBtnChecked] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  const scale = isMobile ? 0.78 : 1
  const rotMax = isMobile ? 4 : 8

  const paperRotations = useMemo(() => {
    const base = [-6, 4, -3, 7, -5]
    return base.map((d) => Math.max(-rotMax, Math.min(rotMax, d)))
  }, [rotMax])

  useEffect(() => {
    // reset all state for loop
    setAct('act1_docs')
    setDocCount(0)
    setCollapseDocs(false)
    setShowDropzone(false)
    setProgressOn(false)
    setBridgeText(null)
    setSolDocCount(0)
    setSolDocExit(false)
    setHireChaosCount(0)
    setHireShake(false)
    setHireVanish(false)
    setFiltersCount(0)
    setSearchFound(false)
    setShowMatch(false)
    setCursorGo(false)
    setBtnPulse(false)
    setBtnChecked(false)
    setShowNotif(false)

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    // ACT 1 (0..4.5s)
    at(0, () => setAct('act1_docs'))
    ;[0, 350, 700, 1050, 1400].forEach((ms, idx) => at(ms, () => setDocCount(idx + 1)))
    at(4000, () => setCollapseDocs(true))
    at(4050, () => setShowDropzone(true))
    at(4150, () => setProgressOn(true))
    at(4650, () => setProgressOn(false))

    // Bridge 1 (4.5..5.5)
    at(4500, () => {
      setAct('bridge1')
      setBridgeText('La evolución natural es muy lenta.')
    })
    at(5500, () => {
      setBridgeText(null)
    })

    // ACT 2 (5.5..9.5)
    at(5500, () => {
      setAct('act2_solution_docs')
      setSolDocExit(false)
      setSolDocCount(0)
    })
    ;[0, 250, 500].forEach((ms, idx) => at(5500 + ms, () => setSolDocCount(idx + 1)))
    at(9000, () => setSolDocExit(true))
    at(9500, () => {
      setSolDocCount(0)
    })

    // ACT 3 (9.5..14)
    at(9500, () => {
      setAct('act3_hiring_chaos')
      setHireChaosCount(0)
      setHireShake(false)
      setHireVanish(false)
    })
    ;[0, 500, 1000, 1500, 2000].forEach((ms, idx) => at(9500 + ms, () => setHireChaosCount(idx + 1)))
    at(13500, () => setHireShake(true))
    at(13800, () => setHireVanish(true))

    // Bridge 2 (14..15)
    at(14000, () => {
      setAct('bridge2')
      setBridgeText('Hay una forma mejor.')
    })
    at(15000, () => setBridgeText(null))

    // ACT 4 (15..20)
    at(15000, () => {
      setAct('act4_solution_hiring')
      setFiltersCount(0)
      setSearchFound(false)
      setShowMatch(false)
      setCursorGo(false)
      setBtnPulse(false)
      setBtnChecked(false)
      setShowNotif(false)
    })
    // chips fade in
    ;[0, 300, 600].forEach((ms, idx) => at(15000 + ms, () => setFiltersCount(idx + 1)))
    at(16000, () => setSearchFound(true))
    at(16500, () => setShowMatch(true))
    at(17100, () => setCursorGo(true))
    at(17900, () => setBtnPulse(true))
    at(18150, () => setBtnPulse(false))
    at(18200, () => setBtnChecked(true))
    at(18500, () => setShowNotif(true))

    // loop (20s)
    at(20000, () => {
      setLoopKey((k) => k + 1)
    })

    return () => {
      for (const t of timers) window.clearTimeout(t)
    }
  }, [loopKey])

  const containerHeight = isMobile ? 300 : 420

  const act1Visible = act === 'act1_docs'
  const act2Visible = act === 'act2_solution_docs'
  const act3Visible = act === 'act3_hiring_chaos'
  const act4Visible = act === 'act4_solution_hiring'
  const bridgeVisible = act === 'bridge1' || act === 'bridge2'

  return (
    <div className="w-full">
      <div
        className="relative w-full max-w-[560px] mx-auto lg:mx-0 overflow-hidden"
        style={{
          height: `${containerHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          background: 'transparent',
        }}
      >
        {/* ACTO 1 — caos documental */}
        {act1Visible && (
          <div className="absolute inset-0">
            <ChaosPaperCard
              show={docCount >= 1}
              dropDelayMs={0}
              rotationDeg={paperRotations[0]}
              left={18}
              top={18}
              dim
              collapse={collapseDocs}
            >
              <div className="paperInner">
                <div className="paperHead">
                  <FileText size={14} color="#666" />
                  <span className="paperTitle">curriculum_final_v3.pdf</span>
                </div>
                <div className="paperLines">
                  <div className="paperLine" />
                  <div className="paperLine" />
                  <div className="paperLine short" />
                </div>
                <div className="paperFoot">Enviado hace 12 días · sin respuesta</div>
              </div>
            </ChaosPaperCard>

            <ChaosPaperCard
              show={docCount >= 2}
              dropDelayMs={350}
              rotationDeg={paperRotations[1]}
              left={52}
              top={16}
              dim
              collapse={collapseDocs}
            >
              <div className="paperInner">
                <div className="paperHead">
                  <Grid3X3 size={14} color="#666" />
                  <span className="paperTitle">Logbook_2023.xlsx</span>
                </div>
                <div className="miniGrid">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="miniCell">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="paperFoot">104 páginas · impreso y firmado</div>
              </div>
            </ChaosPaperCard>

            <ChaosPaperCard
              show={docCount >= 3}
              dropDelayMs={700}
              rotationDeg={paperRotations[2]}
              left={30}
              top={44}
              dim
              collapse={collapseDocs}
            >
              <div className="paperInner">
                <div className="paperHead">
                  <CreditCard size={14} color="#666" />
                  <span className="paperTitle">Part-66 B1.1 — escaneada</span>
                </div>
                <div className="scanBlock" />
                <div className="paperFoot">Caducidad: ¿?</div>
              </div>
            </ChaosPaperCard>

            <ChaosPaperCard
              show={docCount >= 4}
              dropDelayMs={1050}
              rotationDeg={paperRotations[3]}
              left={62}
              top={48}
              dim
              collapse={collapseDocs}
            >
              <div className="paperInner">
                <div className="paperHead">
                  <Award size={14} color="#666" />
                  <span className="paperTitle">B787 Type Rating</span>
                </div>
                <div className="paperLines serif">
                  <div className="paperLine" />
                  <div className="paperLine short" />
                </div>
                <div className="paperFoot">Guardado en un cajón</div>
              </div>
            </ChaosPaperCard>

            <ChaosPaperCard
              show={docCount >= 5}
              dropDelayMs={1400}
              rotationDeg={paperRotations[4]}
              left={22}
              top={68}
              dim
              collapse={collapseDocs}
            >
              <div className="paperInner">
                <div className="paperHead">
                  <MessageCircle size={14} color={COLORS.teal} />
                  <span className="paperTitle">Grupo Técnicos LPA ✈️</span>
                </div>
                <div className="paperMsg">¿sigues disponible el mes que viene?</div>
                <div className="paperFoot">hace 2 días · sin responder</div>
              </div>
            </ChaosPaperCard>

            {/* Dropzone */}
            {showDropzone && (
              <div className="dropzone">
                <div className="dropzoneRow">
                  <Upload size={16} color={COLORS.gold500} />
                  <span className="dropzoneText">Subiendo documentos...</span>
                </div>
                <div className="progressTrack">
                  <div className={`progressBar ${progressOn ? 'progressOn' : ''}`} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* FRASE PUENTE */}
        {bridgeVisible && bridgeText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bridgeWrap">
              <div className="bridgeLine" />
              <div className="bridgeTitle">{bridgeText}</div>
              <div className="bridgeSub">
                {act === 'bridge1' ? 'Tu trayectoria merece más que un PDF.' : 'aeroMatch.'}
              </div>
            </div>
          </div>
        )}

        {/* ACTO 2 — solución documental */}
        {act2Visible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <SolutionCard show={solDocCount >= 1} delayMs={0} widthPx={190} hide={solDocExit}>
              <div className="solHeader goldHeader">✓ AMX Verified · aeroMatch</div>
              <div className="solBody">
                <div className="solName">J. Lorenzo Méndez</div>
                <div className="badgeRow">
                  <span className="licBadge">B1.1</span>
                  <span className="licBadge">B2</span>
                </div>
                <div className="solMeta">Documentos verificados</div>
                <div className="solMeta small">Emitido: Nov 2022</div>
              </div>
            </SolutionCard>

            <SolutionCard show={solDocCount >= 2} delayMs={250} widthPx={190} hide={solDocExit}>
              <div className="solHeader">
                <BarChart3 size={14} color={COLORS.gold500} />
                <span>Logbook360</span>
              </div>
              <div className="solBody">
                <div className="bars">
                  {[6, 10, 8, 12, 7, 11].map((h, i) => (
                    <div
                      key={i}
                      className="bar"
                      style={{
                        height: `${h}px`,
                        background: i % 2 === 0 ? COLORS.gold500 : COLORS.blue,
                      }}
                    />
                  ))}
                </div>
                <div className="years">
                  {['2016', '2017', '2018', '2019', '2020', '2021'].map((y) => (
                    <span key={y}>{y}</span>
                  ))}
                </div>
                <div className="solMeta steel200">12 años · 3 flotas · 3.262 entradas</div>
              </div>
            </SolutionCard>

            <SolutionCard show={solDocCount >= 3} delayMs={500} widthPx={190} hide={solDocExit}>
              <div className="solHeader">
                <span className="blinkDot" />
                <span>En línea</span>
              </div>
              <div className="solBody">
                <div className="solLineWhite">Disponible: Mar → May 2025</div>
                <div className="chipRow">
                  {['LPA', 'MAD', 'PMI'].map((c) => (
                    <span key={c} className="baseChip">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="stars">★★★★★</div>
                <div className="solTeal">Visible para 12 empresas</div>
              </div>
            </SolutionCard>
          </div>
        )}

        {/* ACTO 3 — caos contratación */}
        {act3Visible && (
          <div className={`absolute inset-0 ${hireShake ? 'shake' : ''} ${hireVanish ? 'vanish' : ''}`}>
            {/* 1 LinkedIn */}
            {hireChaosCount >= 1 && (
              <div className="hireCard hireLeft" style={{ transform: 'rotate(-3deg)' }}>
                <div className="hireHeader">
                  <span className="avatar" />
                  <span className="hireMeta">MRO Recruiter · 2ª</span>
                  <span className="hireTime">hace 3h</span>
                </div>
                <div className="hireText">
                  🚨 URGENTE — Técnico B1 737NG
                  <br />
                  Base LPA · Incorporación INMEDIATA
                  <br />
                  Interesados enviar CV a info@...
                </div>
                <div className="hireFooter">👍 34&nbsp;&nbsp; 💬 91 · 847 candidatos aplicaron</div>
              </div>
            )}

            {/* 2 Email */}
            {hireChaosCount >= 2 && (
              <div className="hireCard hireRight" style={{ transform: 'rotate(4deg)' }}>
                <div className="gmailHead">
                  <div className="gmailFrom">De: recruiting@mro-solutions.eu</div>
                  <div className="gmailSubj">
                    <strong>Oportunidad — ¿estás disponible?</strong>
                  </div>
                </div>
                <div className="gmailPrev">Hola, me pongo en contacto porque tu perfil...</div>
                <div className="hireFooter">Hace 4 días · [3 emails más]</div>
              </div>
            )}

            {/* 3 WhatsApp */}
            {hireChaosCount >= 3 && (
              <div className="hireCard hireLeft2" style={{ transform: 'rotate(-5deg)' }}>
                <div className="waHead">Técnicos B1 LPA ✈️ · 847 miembros</div>
                <div className="waBubbles">
                  {[
                    '¿alguien libre para marzo en MAD?',
                    'yo solo puedo 2 semanas',
                    'necesitan B1 y B2, ¿long term?',
                    'no dice la empresa...',
                  ].map((t) => (
                    <div key={t} className="waBubble">
                      {t}
                    </div>
                  ))}
                </div>
                <div className="hireFooter">+34 mensajes sin leer</div>
              </div>
            )}

            {/* 4 Email chain */}
            {hireChaosCount >= 4 && (
              <div className="hireCard hireRight2" style={{ transform: 'rotate(3deg)' }}>
                <div className="gmailFrom">De: ops@handler-aviation.com</div>
                <div className="gmailSubj">
                  <strong>RE: RE: RE: RE: Disponibilidad</strong>
                </div>
                <div className="chainLines">
                  {['— ¿Puedes del 3 al 17?', '— Solo puedo del 10', '— ¿Long term o short?', '— Aún no lo sabemos', '— Ok, avísame'].map(
                    (l) => (
                      <div key={l} className="chainLine">
                        {l}
                      </div>
                    )
                  )}
                </div>
                <div className="hireFooter">14 emails · iniciado hace 3 semanas</div>
              </div>
            )}

            {/* 5 Post-it */}
            {hireChaosCount >= 5 && (
              <div className="postit" style={{ transform: 'rotate(-6deg)' }}>
                <div className="postitText">
                  B1 · 737 · LPA
                  <br />
                  ¿cuándo puedes?
                  <br />
                  long o short?
                  <br />
                  llámame
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTO 4 — solución contratación */}
        {act4Visible && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Subpaso A: búsqueda */}
            {!showMatch && !showNotif && (
              <div className="solutionCardWrap" style={{ width: 220 }}>
                <div className="solHeader">
                  <Search size={14} color={COLORS.gold500} />
                  <span>Jetinnova · buscando técnico</span>
                </div>
                <div className="solBody">
                  <div className="filterRow">
                    <Chip show={filtersCount >= 1} delayMs={0}>
                      737 NG ×
                    </Chip>
                    <Chip show={filtersCount >= 2} delayMs={300}>
                      LPA ×
                    </Chip>
                    <Chip show={filtersCount >= 3} delayMs={600}>
                      Disponible marzo ×
                    </Chip>
                  </div>
                  <div className="searchRow">
                    {!searchFound ? (
                      <>
                        <span className="spinner" />
                        <span className="searchText">Buscando...</span>
                      </>
                    ) : (
                      <span className="foundText">3 técnicos encontrados ✓</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subpaso B: match */}
            {showMatch && !showNotif && (
              <div className="matchStage">
                <div className="solutionCardWrap companyUp" style={{ width: 220 }}>
                  <div className="solHeader">
                    <Search size={14} color={COLORS.gold500} />
                    <span>Jetinnova · buscando técnico</span>
                  </div>
                  <div className="solBody">
                    <div className="searchRow">
                      <span className="foundText">3 técnicos encontrados ✓</span>
                    </div>
                  </div>
                </div>

                <div className="techRow">
                  <div className="techCard techStrong">
                    <div className="techTop">
                      <div className="initials">JL</div>
                      <div className="techInfo">
                        <div className="techLine">B1 · 737NG · LPA</div>
                        <div className="techMetaRow">
                          <span className="amxBadge">✓ AMX</span>
                          <span className="stars">★★★★★</span>
                        </div>
                        <div className="techAvail">Disponible ✓</div>
                      </div>
                    </div>
                    <button className={`sendBtn ${btnPulse ? 'pulse' : ''}`}>
                      {btnChecked ? (
                        <span className="btnInner">
                          <Check size={14} color={COLORS.navy950} /> Enviar solicitud
                        </span>
                      ) : (
                        'Enviar solicitud'
                      )}
                    </button>
                  </div>

                  <div className="techCard techDim">
                    <div className="techTop">
                      <div className="initials">MR</div>
                      <div className="techInfo">
                        <div className="techLine">B1 · 737NG · MAD</div>
                        <div className="stars">★★★★☆</div>
                      </div>
                    </div>
                  </div>
                </div>

                <CursorSvg active={cursorGo} />
              </div>
            )}

            {/* Subpaso C: notificación */}
            {showNotif && (
              <div className="notifCard">
                <div className="notifHeader">✉ Nueva oferta recibida</div>
                <div className="notifSep" />
                <div className="notifLine">737 NG · MAD · 3 semanas</div>
                <div className="notifCompany">Jetinnova</div>
                <div className="notifMeta">Condiciones: ver oferta</div>
                <button className="notifBtn">Ver oferta →</button>
                <div className="notifTimeRow">
                  <span className="tealDot" />
                  <span>Hace un momento</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          .paperInner {
            font-size: 8px;
          }
          .hireCard {
            font-size: 8px;
          }
          .postitText {
            font-size: 11px;
          }
          .chip {
            font-size: 9px;
          }
          .solBody {
            font-size: 8px;
          }
        }

        .paper {
          background: ${COLORS.white};
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .paperShow {
          opacity: 0.85;
          animation: paperDrop 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }
        .paperHide {
          opacity: 0;
        }
        .paperInner {
          padding: 10px 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
            monospace;
          font-size: 9px;
          color: #333;
        }
        .paperHead {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .paperTitle {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .paperLines {
          display: grid;
          gap: 5px;
          margin: 6px 0 8px;
        }
        .paperLines.serif {
          font-family: Georgia, 'Times New Roman', Times, serif;
        }
        .paperLine {
          height: 4px;
          background: #eee;
          border-radius: 2px;
        }
        .paperLine.short {
          width: 70%;
        }
        .paperFoot {
          color: #666;
        }
        .miniGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin: 6px 0 8px;
        }
        .miniCell {
          height: 12px;
          border: 1px solid #e6e6e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #777;
          border-radius: 2px;
        }
        .scanBlock {
          height: 34px;
          background: #e9e9e9;
          border-radius: 3px;
          transform: rotate(-2deg);
          margin: 6px 0 8px;
        }
        .paperMsg {
          margin: 6px 0 8px;
          color: #444;
        }
        .dropzone {
          position: absolute;
          left: 50%;
          top: 52%;
          transform: translate(-50%, -50%);
          border: 2px dashed ${COLORS.gold500};
          border-radius: 8px;
          padding: 12px 20px;
          background: rgba(201, 162, 77, 0.1);
          width: 230px;
        }
        .dropzoneRow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${COLORS.gold500};
          font-size: 11px;
          font-weight: 600;
        }
        .progressTrack {
          height: 6px;
          border-radius: 999px;
          background: rgba(201, 162, 77, 0.18);
          overflow: hidden;
          margin-top: 10px;
        }
        .progressBar {
          height: 100%;
          width: 0%;
          background: ${COLORS.gold500};
          border-radius: 999px;
        }
        .progressOn {
          animation: fill 500ms ease-out forwards;
        }
        @keyframes fill {
          to {
            width: 100%;
          }
        }
        .bridgeWrap {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          text-align: center;
          opacity: 0;
          animation: bridgeWrap 2700ms ease-in-out forwards;
        }
        .bridgeLine {
          width: 40px;
          height: 2px;
          background: ${COLORS.gold500};
          margin: 0 auto 16px auto;
          opacity: 0;
          animation: bridgeIn 500ms ease-out forwards;
        }
        .bridgeTitle {
          color: ${COLORS.white};
          font-style: normal;
          font-weight: 600;
          line-height: 1.3;
          font-size: 28px;
        }
        .bridgeSub {
          margin-top: 10px;
          color: ${COLORS.gold500};
          font-style: italic;
          font-weight: 400;
          font-size: 14px;
          opacity: 0;
          animation: bridgeIn 500ms ease-out forwards;
          animation-delay: 400ms;
        }
        @media (max-width: 767px) {
          .bridgeTitle {
            font-size: 22px;
          }
        }
        @keyframes bridgeWrap {
          0% {
            opacity: 0;
          }
          18.5% {
            opacity: 1;
          } /* 500ms */
          85.2% {
            opacity: 1;
          } /* +1800ms */
          100% {
            opacity: 0;
          } /* +400ms */
        }
        @keyframes bridgeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .solutionCardWrap,
        .solutionCard {
          background: ${COLORS.navy900};
          border: 1.5px solid ${COLORS.gold500};
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 0 16px rgba(201, 162, 77, 0.15);
          color: ${COLORS.steel400};
        }
        .solutionStrong {
          box-shadow: 0 0 22px rgba(201, 162, 77, 0.22);
        }
        .solHeader {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: ${COLORS.gold500};
          background: transparent;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .goldHeader {
          background: rgba(201, 162, 77, 0.2);
          border-radius: 8px;
          padding: 6px 8px;
        }
        .solBody {
          font-size: 9px;
        }
        .solName {
          color: ${COLORS.white};
          font-weight: 800;
          font-size: 11px;
        }
        .badgeRow {
          display: flex;
          gap: 6px;
          margin-top: 6px;
          margin-bottom: 6px;
        }
        .licBadge {
          background: ${COLORS.navy800};
          border: 1px solid ${COLORS.border};
          color: ${COLORS.white};
          border-radius: 999px;
          padding: 2px 6px;
          font-size: 8px;
          line-height: 1;
        }
        .solMeta {
          color: ${COLORS.steel400};
          margin-top: 5px;
        }
        .solMeta.small {
          font-size: 8px;
        }
        .solMeta.steel200 {
          color: ${COLORS.steel200};
          font-size: 9px;
          margin-top: 8px;
        }
        .bars {
          display: flex;
          gap: 6px;
          align-items: flex-end;
          height: 16px;
          margin-top: 2px;
        }
        .bar {
          width: 10px;
          border-radius: 3px;
        }
        .years {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          color: ${COLORS.steel400};
          font-size: 8px;
          opacity: 0.9;
        }
        .blinkDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${COLORS.teal};
          box-shadow: 0 0 10px rgba(29, 158, 117, 0.35);
          animation: blink 900ms ease-in-out infinite;
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        .solLineWhite {
          color: ${COLORS.white};
          font-size: 10px;
          margin-top: 2px;
        }
        .chipRow {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .baseChip {
          background: ${COLORS.navy800};
          border: 1px solid ${COLORS.border};
          color: ${COLORS.steel200};
          border-radius: 999px;
          padding: 2px 6px;
          font-size: 8px;
        }
        .stars {
          color: ${COLORS.gold500};
          font-size: 10px;
          margin-top: 8px;
          letter-spacing: 1px;
        }
        .solTeal {
          color: ${COLORS.teal};
          font-size: 9px;
          margin-top: 6px;
          font-weight: 700;
        }
        .slideUpFade {
          opacity: 0;
          transform: translateY(20px);
          animation: slideUpFade 400ms ease-out forwards;
        }
        .solutionExit {
          animation: solExit 300ms ease-in forwards;
        }
        @keyframes solExit {
          to {
            transform: translateY(-14px);
            opacity: 0;
          }
        }
        @keyframes slideUpFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Act 3 cards (paper style) */
        .hireCard {
          position: absolute;
          width: 220px;
          background: ${COLORS.white};
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 10px 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
            monospace;
          font-size: 9px;
          color: #333;
          opacity: 0.9;
          animation-duration: 420ms;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }
        .hireLeft {
          left: 8%;
          top: 14%;
          animation-name: slideInLeft;
        }
        .hireRight {
          right: 7%;
          top: 12%;
          animation-name: slideInRight;
        }
        .hireLeft2 {
          left: 12%;
          top: 44%;
          animation-name: slideInLeft;
        }
        .hireRight2 {
          right: 10%;
          top: 46%;
          animation-name: slideInRight;
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .hireHeader {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          color: #555;
        }
        .avatar {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #d9d9d9;
          display: inline-block;
        }
        .hireMeta {
          font-weight: 700;
          flex: 1;
        }
        .hireTime {
          color: #777;
        }
        .hireText {
          color: #333;
          line-height: 1.25;
        }
        .hireFooter {
          margin-top: 8px;
          color: #666;
        }
        .gmailHead {
          display: grid;
          gap: 4px;
          margin-bottom: 6px;
        }
        .gmailFrom {
          color: #555;
        }
        .gmailSubj {
          color: #222;
        }
        .gmailPrev {
          color: #555;
          line-height: 1.25;
        }
        .waHead {
          background: #2e7d32;
          color: #fff;
          padding: 4px 6px;
          border-radius: 4px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .waBubbles {
          display: grid;
          gap: 5px;
        }
        .waBubble {
          background: #dcf8c6;
          border-radius: 8px;
          padding: 5px 7px;
          color: #2b2b2b;
        }
        .chainLines {
          display: grid;
          gap: 4px;
          margin-top: 6px;
          color: #555;
          line-height: 1.2;
        }
        .postit {
          position: absolute;
          left: 38%;
          top: 22%;
          width: 170px;
          background: #fff9c4;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          padding: 12px;
          animation: dropDown 420ms ease-out both;
        }
        @keyframes dropDown {
          from {
            opacity: 0;
            transform: translateY(-18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .postitText {
          font-family: 'Segoe Script', 'Comic Sans MS', cursive;
          color: #4a4a4a;
          font-size: 12px;
          line-height: 1.2;
        }
        .shake {
          animation: shake 300ms ease-in-out both;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-4px);
          }
          40% {
            transform: translateX(4px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
        .vanish {
          animation: vanish 400ms ease-in forwards;
        }
        @keyframes vanish {
          to {
            transform: scale(0);
            opacity: 0;
          }
        }

        /* Act 4 */
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 999px;
          background: ${COLORS.navy800};
          border: 1px solid ${COLORS.border};
          color: ${COLORS.steel200};
          font-size: 10px;
          opacity: 0;
        }
        .chipHidden {
          opacity: 0;
        }
        .fadeIn {
          animation: fadeIn 300ms ease-out forwards;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        .filterRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .searchRow {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: ${COLORS.steel400};
        }
        .spinner {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 2px solid rgba(201, 162, 77, 0.3);
          border-top-color: ${COLORS.gold500};
          animation: spin 700ms linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .foundText {
          color: ${COLORS.teal};
          font-weight: 800;
          font-size: 10px;
          animation: fadeIn 300ms ease-out both;
        }
        .matchStage {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .companyUp {
          position: absolute;
          left: 50%;
          top: 12%;
          transform: translateX(-50%);
        }
        .techRow {
          position: absolute;
          left: 50%;
          top: 42%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
        }
        .techCard {
          width: 190px;
          background: ${COLORS.navy900};
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 0 16px rgba(201, 162, 77, 0.15);
          border: 1.5px solid ${COLORS.gold500};
          color: ${COLORS.steel400};
        }
        .techStrong {
          box-shadow: 0 0 22px rgba(201, 162, 77, 0.22);
          border-color: rgba(201, 162, 77, 0.85);
        }
        .techDim {
          opacity: 0.7;
          border-color: rgba(201, 162, 77, 0.35);
        }
        .techTop {
          display: flex;
          gap: 10px;
        }
        .initials {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: ${COLORS.navy800};
          border: 1px solid ${COLORS.border};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: ${COLORS.gold500};
          font-size: 12px;
        }
        .techLine {
          color: ${COLORS.white};
          font-size: 10px;
          font-weight: 800;
        }
        .techMetaRow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }
        .amxBadge {
          background: rgba(201, 162, 77, 0.2);
          border: 1px solid rgba(201, 162, 77, 0.35);
          color: ${COLORS.gold500};
          font-size: 8px;
          border-radius: 999px;
          padding: 2px 6px;
          font-weight: 800;
        }
        .techAvail {
          color: ${COLORS.teal};
          font-size: 9px;
          font-weight: 800;
          margin-top: 6px;
        }
        .sendBtn {
          margin-top: 10px;
          width: 100%;
          background: ${COLORS.gold500};
          color: ${COLORS.navy950};
          font-size: 9px;
          font-weight: 900;
          border-radius: 4px;
          padding: 6px 8px;
        }
        .btnInner {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }
        .pulse {
          animation: pulse 420ms ease-in-out both;
          box-shadow: 0 0 18px rgba(201, 162, 77, 0.35);
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        .cursorSvg {
          position: absolute;
          left: 52%;
          top: 56%;
          transform: translate(-50%, -50%);
          opacity: 0.95;
        }
        .cursorMove {
          transition: transform 800ms ease-in-out;
          transform: translate(105px, 44px);
        }
        .notifCard {
          position: absolute;
          right: 10%;
          top: 36%;
          width: 200px;
          background: ${COLORS.navy900};
          border: 1.5px solid ${COLORS.teal};
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
          animation: slideInRight 420ms ease-out both;
        }
        .notifHeader {
          color: ${COLORS.white};
          font-weight: 900;
          font-size: 11px;
        }
        .notifSep {
          height: 1px;
          background: ${COLORS.border};
          margin: 8px 0;
          opacity: 0.6;
        }
        .notifLine {
          color: ${COLORS.steel200};
          font-size: 10px;
        }
        .notifCompany {
          margin-top: 6px;
          color: ${COLORS.gold500};
          font-weight: 900;
          font-size: 10px;
        }
        .notifMeta {
          margin-top: 6px;
          color: ${COLORS.steel400};
          font-size: 9px;
        }
        .notifBtn {
          margin-top: 10px;
          background: ${COLORS.gold500};
          color: ${COLORS.navy950};
          font-size: 9px;
          font-weight: 900;
          border-radius: 4px;
          padding: 6px 10px;
        }
        .notifTimeRow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          color: ${COLORS.steel400};
          font-size: 9px;
        }
        .tealDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${COLORS.teal};
          animation: blink 900ms ease-in-out infinite;
        }

        @keyframes paperDrop {
          0% {
            opacity: 0;
            transform: translateY(-22px) rotate(var(--r, 0deg));
          }
          70% {
            opacity: 0.85;
            transform: translateY(2px) rotate(var(--r, 0deg));
          }
          100% {
            opacity: 0.85;
            transform: translateY(0) rotate(var(--r, 0deg));
          }
        }
      `}</style>
    </div>
  )
}

export { default } from './ChaosToOrderGSAP'

