'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  BarChart3,
  Check,
  CreditCard,
  FileText,
  Grid3X3,
  MessageCircle,
  Search,
  Upload,
} from 'lucide-react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

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

function CursorSvg(props: { className?: string }) {
  return (
    <svg className={props.className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3l14 8-8 2-2 8-4-18z" fill={COLORS.white} stroke={COLORS.border} strokeWidth="1" />
    </svg>
  )
}

export default function ChaosToOrderGSAP() {
  const isMobile = useMobile()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const scale = isMobile ? 0.78 : 1
  const rotMax = isMobile ? 4 : 8
  const paperRotations = useMemo(() => {
    const base = [-6, 4, -3, 7, -5]
    return base.map((d) => Math.max(-rotMax, Math.min(rotMax, d)))
  }, [rotMax])

  const containerHeight = isMobile ? 300 : 420

  useGSAP(
    () => {
      const q = gsap.utils.selector(containerRef)

      const papers = q('.am-paper')
      const dropzone = q('.am-dropzone')
      const progressBar = q('.am-progressBar')
      const act2Cards = q('.am-act2Card')
      const hireCards = q('.am-hireCard')
      const postit = q('.am-postit')
      const bridge1 = q('.am-bridge1')
      const bridge2 = q('.am-bridge2')

      const act4Search = q('.am-act4Search')
      const act4Chips = q('.am-act4Chip')
      const spinner = q('.am-spinner')
      const searchText = q('.am-searchText')
      const foundText = q('.am-foundText')

      const matchStage = q('.am-matchStage')
      const techRow = q('.am-techRow')
      const cursor = q('.am-cursor')
      const sendBtn = q('.am-sendBtn')
      const btnLabel = q('.am-btnLabel')
      const btnCheck = q('.am-btnCheck')

      const notif = q('.am-notif')

      gsap.set(
        [
          papers,
          dropzone,
          progressBar,
          act2Cards,
          hireCards,
          postit,
          bridge1,
          bridge2,
          act4Search,
          act4Chips,
          foundText,
          matchStage,
          techRow,
          cursor,
          btnCheck,
          notif,
        ],
        { autoAlpha: 0 }
      )

      // base positions for papers (offsets around center)
      const offsets = [
        { x: -170, y: -130 },
        { x: 40, y: -140 },
        { x: -85, y: -20 },
        { x: 120, y: -5 },
        { x: -150, y: 110 },
      ]
      papers.forEach((el, i) => {
        const off = offsets[i] || { x: 0, y: 0 }
        gsap.set(el, {
          x: off.x,
          y: off.y,
          xPercent: -50,
          yPercent: -50,
          rotation: paperRotations[i] || 0,
          scale: 1,
        })
      })

      // base positions for act3
      gsap.set(q('.am-hireLeft'), { x: -24 })
      gsap.set(q('.am-hireRight'), { x: 24 })
      gsap.set(q('.am-hireLeft2'), { x: -24 })
      gsap.set(q('.am-hireRight2'), { x: 24 })
      gsap.set(postit, { y: -18 })

      // act4 base
      gsap.set(act4Chips, { autoAlpha: 0 })
      gsap.set(foundText, { autoAlpha: 0 })
      gsap.set(matchStage, { autoAlpha: 0 })
      gsap.set(techRow, { autoAlpha: 0 })
      gsap.set(cursor, { x: 0, y: 0, autoAlpha: 0 })
      gsap.set(btnCheck, { autoAlpha: 0 })
      gsap.set(notif, { x: 24 })

      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: 'power2.inOut' },
      })

      // ACTO 1 — papeles caen (stagger)
      tl.to(papers, {
        autoAlpha: 0.85,
        duration: 0.01,
      })
      tl.fromTo(
        papers,
        (i: number) => ({ y: (offsets[i]?.y ?? 0) - 70, autoAlpha: 0 }),
        {
          y: (i: number) => offsets[i]?.y ?? 0,
          autoAlpha: 0.85,
          duration: 0.8,
          ease: 'back.out(1.2)',
          stagger: 0.35,
        },
        0
      )

      // collapse to center + dropzone + progress
      tl.to(
        papers,
        {
          x: 0,
          y: 0,
          scale: 0.7,
          duration: 0.4,
          ease: 'power2.inOut',
        },
        4.0
      )
      tl.to(dropzone, { autoAlpha: 1, duration: 0.2 }, 4.05)
      tl.fromTo(progressBar, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', duration: 0.5 }, 4.15)

      // fade act1 out
      tl.to([papers, dropzone], { autoAlpha: 0, duration: 0.25 }, 4.5)

      // BRIDGE 1
      tl.to(bridge1, { autoAlpha: 1, duration: 0.3 }, 4.5)
      tl.to(bridge1, { autoAlpha: 0, duration: 0.3 }, 5.2)

      // ACTO 2 — solución docs
      tl.fromTo(
        act2Cards,
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.inOut', stagger: 0.25 },
        5.5
      )
      tl.to(act2Cards, { y: -14, autoAlpha: 0, duration: 0.3 }, 9.0)

      // ACTO 3 — caos contratación
      tl.fromTo(hireCards, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.01 }, 9.5)
      tl.to(q('.am-hireLeft'), { x: 0, autoAlpha: 1, duration: 0.42 }, 9.5)
      tl.to(q('.am-hireRight'), { x: 0, autoAlpha: 1, duration: 0.42 }, 10.0)
      tl.to(q('.am-hireLeft2'), { x: 0, autoAlpha: 1, duration: 0.42 }, 10.5)
      tl.to(q('.am-hireRight2'), { x: 0, autoAlpha: 1, duration: 0.42 }, 11.0)
      tl.to(postit, { y: 0, autoAlpha: 1, duration: 0.42, ease: 'back.out(1.2)' }, 11.5)

      // shake + vanish
      tl.to([hireCards, postit], { x: '-=4', duration: 0.06, ease: 'none' }, 13.5)
      tl.to([hireCards, postit], { x: '+=8', duration: 0.06, ease: 'none' }, 13.56)
      tl.to([hireCards, postit], { x: '-=8', duration: 0.06, ease: 'none' }, 13.62)
      tl.to([hireCards, postit], { x: '+=4', duration: 0.06, ease: 'none' }, 13.68)
      tl.to([hireCards, postit], { scale: 0, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, 13.8)

      // BRIDGE 2
      tl.to(bridge2, { autoAlpha: 1, duration: 0.3 }, 14.0)
      tl.to(bridge2, { autoAlpha: 0, duration: 0.3 }, 14.7)

      // ACTO 4 — solución contratación
      tl.to(act4Search, { autoAlpha: 1, duration: 0.01 }, 15.0)
      tl.fromTo(act4Chips, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.3 }, 15.0)

      // spinner rotate loop during search
      const spinTween = gsap.to(spinner, { rotation: 360, repeat: -1, ease: 'none', duration: 0.7, paused: true })
      tl.call(() => {
        spinTween.play(0)
      }, [], 15.0)
      tl.to(foundText, { autoAlpha: 1, duration: 0.25 }, 16.0)
      tl.to(searchText, { autoAlpha: 0, duration: 0.15 }, 16.0)
      tl.call(() => {
        spinTween.pause()
      }, [], 16.0)

      // match stage
      tl.to(matchStage, { autoAlpha: 1, duration: 0.01 }, 16.5)
      tl.to(techRow, { autoAlpha: 1, duration: 0.2 }, 16.6)
      tl.to(cursor, { autoAlpha: 1, duration: 0.01 }, 17.1)
      tl.to(cursor, { x: 105, y: 44, duration: 0.8, ease: 'power2.inOut' }, 17.1)
      tl.to(sendBtn, { scale: 1.08, duration: 0.2, ease: 'power2.inOut' }, 17.9)
      tl.to(sendBtn, { scale: 1, duration: 0.2, ease: 'power2.inOut' }, 18.1)
      tl.to(btnCheck, { autoAlpha: 1, duration: 0.01 }, 18.2)
      tl.to(btnLabel, { autoAlpha: 0, duration: 0.01 }, 18.2)

      // notif
      tl.to([act4Search, matchStage, cursor], { autoAlpha: 0, duration: 0.2 }, 18.5)
      tl.to(notif, { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power2.inOut' }, 18.5)

      // fade out end of loop
      tl.to(notif, { autoAlpha: 0, duration: 0.3 }, 19.8)

      // subtle blink dots (always on)
      gsap.to(q('.am-blink'), { autoAlpha: 0.4, duration: 0.45, yoyo: true, repeat: -1, ease: 'power2.inOut' })

      return () => {
        spinTween.kill()
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [isMobile, paperRotations.join(',')] }
  )

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full max-w-[560px] mx-auto lg:mx-0 overflow-hidden"
        style={{
          height: `${containerHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          background: 'transparent',
        }}
      >
        {/* ACTO 1 */}
        <div className="absolute inset-0">
          <div
            className="paper am-paper"
            style={{ left: '50%', top: '50%' }}
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
          </div>

          <div className="paper am-paper" style={{ left: '50%', top: '50%' }}>
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
          </div>

          <div className="paper am-paper" style={{ left: '50%', top: '50%' }}>
            <div className="paperInner">
              <div className="paperHead">
                <CreditCard size={14} color="#666" />
                <span className="paperTitle">Part-66 B1.1 — escaneada</span>
              </div>
              <div className="scanBlock" />
              <div className="paperFoot">Caducidad: ¿?</div>
            </div>
          </div>

          <div className="paper am-paper" style={{ left: '50%', top: '50%' }}>
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
          </div>

          <div className="paper am-paper" style={{ left: '50%', top: '50%' }}>
            <div className="paperInner">
              <div className="paperHead">
                <MessageCircle size={14} color={COLORS.teal} />
                <span className="paperTitle">Grupo Técnicos LPA ✈️</span>
              </div>
              <div className="paperMsg">¿sigues disponible el mes que viene?</div>
              <div className="paperFoot">hace 2 días · sin responder</div>
            </div>
          </div>

          <div className="dropzone am-dropzone">
            <div className="dropzoneRow">
              <Upload size={16} color={COLORS.gold500} />
              <span className="dropzoneText">Subiendo documentos...</span>
            </div>
            <div className="progressTrack">
              <div className="progressBar am-progressBar" />
            </div>
          </div>
        </div>

        {/* BRIDGES */}
        <div className="absolute inset-0 flex items-center justify-center am-bridge1">
          <div className="bridgeWrap">
            <div className="bridgeLine" />
            <div className="bridgeTitle">La evolución natural es muy lenta.</div>
            <div className="bridgeSub">Tu trayectoria merece más que un PDF.</div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center am-bridge2">
          <div className="bridgeWrap">
            <div className="bridgeLine" />
            <div className="bridgeTitle">Hay una forma mejor.</div>
            <div className="bridgeSub">aeroMatch.</div>
          </div>
        </div>

        {/* ACTO 2 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="solutionCard am-act2Card">
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
          </div>

          <div className="solutionCard am-act2Card">
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
          </div>

          <div className="solutionCard am-act2Card">
            <div className="solHeader">
              <span className="blinkDot am-blink" />
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
          </div>
        </div>

        {/* ACTO 3 */}
        <div className="absolute inset-0">
          <div className="hireCard am-hireCard am-hireLeft" style={{ transform: 'rotate(-3deg)' }}>
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

          <div className="hireCard am-hireCard am-hireRight" style={{ transform: 'rotate(4deg)' }}>
            <div className="gmailHead">
              <div className="gmailFrom">De: recruiting@mro-solutions.eu</div>
              <div className="gmailSubj">
                <strong>Oportunidad — ¿estás disponible?</strong>
              </div>
            </div>
            <div className="gmailPrev">Hola, me pongo en contacto porque tu perfil...</div>
            <div className="hireFooter">Hace 4 días · [3 emails más]</div>
          </div>

          <div className="hireCard am-hireCard am-hireLeft2" style={{ transform: 'rotate(-5deg)' }}>
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

          <div className="hireCard am-hireCard am-hireRight2" style={{ transform: 'rotate(3deg)' }}>
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

          <div className="postit am-postit">
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
        </div>

        {/* ACTO 4 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="solutionCardWrap am-act4Search" style={{ width: 220 }}>
            <div className="solHeader">
              <Search size={14} color={COLORS.gold500} />
              <span>Jetinnova · buscando técnico</span>
            </div>
            <div className="solBody">
              <div className="filterRow">
                <span className="chip am-act4Chip">737 NG ×</span>
                <span className="chip am-act4Chip">LPA ×</span>
                <span className="chip am-act4Chip">Disponible marzo ×</span>
              </div>
              <div className="searchRow">
                <span className="spinner am-spinner" />
                <span className="searchText am-searchText">Buscando...</span>
                <span className="foundText am-foundText">3 técnicos encontrados ✓</span>
              </div>
            </div>
          </div>

          <div className="matchStage am-matchStage">
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

            <div className="techRow am-techRow">
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
                <button className="sendBtn am-sendBtn">
                  <span className="btnLabel am-btnLabel">Enviar solicitud</span>
                  <span className="btnCheck am-btnCheck">
                    <Check size={14} color={COLORS.navy950} />
                  </span>
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

            <CursorSvg className="cursorSvg am-cursor" />
          </div>

          <div className="notifCard am-notif">
            <div className="notifHeader">✉ Nueva oferta recibida</div>
            <div className="notifSep" />
            <div className="notifLine">737 NG · MAD · 3 semanas</div>
            <div className="notifCompany">Jetinnova</div>
            <div className="notifMeta">Condiciones: ver oferta</div>
            <button className="notifBtn">Ver oferta →</button>
            <div className="notifTimeRow">
              <span className="tealDot am-blink" />
              <span>Hace un momento</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .paper {
          position: absolute;
          width: 160px;
          background: ${COLORS.white};
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
          width: 100%;
          background: ${COLORS.gold500};
          border-radius: 999px;
          transform: scaleX(0);
          transform-origin: left;
        }

        .bridgeWrap {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          text-align: center;
        }
        .bridgeLine {
          width: 40px;
          height: 2px;
          background: ${COLORS.gold500};
          margin: 0 auto 16px auto;
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
        }
        @media (max-width: 767px) {
          .bridgeTitle {
            font-size: 22px;
          }
        }

        .solutionCardWrap,
        .solutionCard {
          width: 190px;
          background: ${COLORS.navy900};
          border: 1.5px solid ${COLORS.gold500};
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 0 16px rgba(201, 162, 77, 0.15);
          color: ${COLORS.steel400};
        }
        .solHeader {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: ${COLORS.gold500};
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
        .blinkDot,
        .tealDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${COLORS.teal};
          box-shadow: 0 0 10px rgba(29, 158, 117, 0.35);
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
        }
        .am-hireLeft {
          left: 8%;
          top: 14%;
        }
        .am-hireRight {
          right: 7%;
          top: 12%;
        }
        .am-hireLeft2 {
          left: 12%;
          top: 44%;
        }
        .am-hireRight2 {
          right: 10%;
          top: 46%;
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
        }
        .postitText {
          font-family: 'Segoe Script', 'Comic Sans MS', cursive;
          color: #4a4a4a;
          font-size: 12px;
          line-height: 1.2;
        }

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
        }
        .foundText {
          color: ${COLORS.teal};
          font-weight: 800;
          font-size: 10px;
        }

        .matchStage {
          position: absolute;
          inset: 0;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .cursorSvg {
          position: absolute;
          left: 52%;
          top: 56%;
          transform: translate(-50%, -50%);
          opacity: 0.95;
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
      `}</style>
    </div>
  )
}

