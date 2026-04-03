import type { Language } from './translations'

/** Copy for homepage infographic sections (Story, How it works, etc.) */
export type LandingCopy = {
  story: {
    warnTag: string
    h2: string
    p: string
    colTech: string
    emailFrom: string
    emailSubject: string
    emailStatus: string
    waHeader: string
    wa1: string
    wa2: string
    wa3: string
    wa4: string
    waUnread: string
    colDates: string
    chainSubject: string
    chainLines: [string, string, string, string, string]
    chainFooter: string
    postitLines: [string, string, string, string]
    postitNoData: string
    colCompany: string
    liCompany: string
    liTitle: string
    liSub: string
    liStat: string
    liWarn: string
    red1: { strong: string; sub: string }
    red2: { strong: string; sub: string }
    red3: { strong: string; sub: string }
    ts1: string
    ts2: string
    ts3: string
  }
  share: {
    soon: string
    title: string
    desc: string
    urlPrefix: string
  }
  ecosystem: {
    tag: string
    title: string
    sub: string
    active: string
    beta: string
    next: string
    cards: {
      training: { title: string; body: string; bullets: string[] }
      logbook: { title: string; body: string; bullets: string[] }
      appLog: { title: string; body: string; bullets: string[] }
      match147: { title: string; body: string; bullets: string[] }
      camo: { title: string; body: string; bullets: string[] }
      uk: { title: string; body: string; bullets: string[] }
    }
    radar: string
    radarItems: string[]
  }
  stats: {
    t1: string
    t2: string
    t3: string
    t4: string
    note: string
  }
  finalCta: {
    eyebrow: string
    title: string
    sub: string
    btnTech: string
    btnCompany: string
    note: string
  }
  how: {
    stepLabel: (n: number) => string
    s1: { title: string; desc: string; btn: string; formTitle: string; labels: [string, string, string, string]; chips: { row: number; labels: string[] }[] }
    s2: {
      title: string
      descPart1: string
      descPart2: string
      descPart3: string
      uploadHint: string
      uploadBtn: string
      becomes: string
      cert: string
      analysis: string
      profileLine1: string
      profileLine2: string
      amxBadge: string
      viewAmx: string
      request: string
      tools: string
      licenses: string
      aircraft: string
      specialties: string
    }
    midCta: { title: string; sub: string; btn: string }
    s3: { title: string; desc: string; btn: string; calNav: string; calDays: string[]; save: string; status: string; note: string }
    s4: { title: string; desc: string; searchTitle: string; chips: string[]; avail: string; send: string; lock: string }
    s5: {
      title: string
      desc: string
      pushApp: string
      pushTime: string
      pushTitle: string
      pushSub: string
      q: string
      b1: string
      b2: string
      b3: string
      success: string
      successSubLine1: string
      successSubLine2: string
    }
  }
}

const ES: LandingCopy = {
  story: {
    warnTag: 'Así funciona el sector hoy',
    h2: 'Esto no es eficiencia.',
    p: '¿Te suena de algo?',
    colTech: 'El técnico',
    emailFrom: 'De: recruiter@mro-handler.eu',
    emailSubject: 'Oportunidad B1 — ¿disponible?',
    emailStatus: 'Sin respuesta · 8 días',
    waHeader: 'Técnicos B1 LPA ✈ · 847 miembros',
    wa1: '¿alguien libre para marzo?',
    wa2: 'yo solo puedo 2 semanas',
    wa3: '¿long o short term?',
    wa4: 'no dice la empresa...',
    waUnread: '+34 mensajes sin leer',
    colDates: 'Las fechas',
    chainSubject: 'RE: RE: RE: RE: Disponibilidad',
    chainLines: [
      '— ¿Puedes del 3 al 17?',
      '— Solo puedo del 10',
      '— ¿Long term o short?',
      '— Aún no lo sabemos',
      '— Ok, avísame cuando sepáis',
    ],
    chainFooter: '14 emails · 3 semanas · Sin resolución',
    postitLines: ['B1 · 737 · LPA', '¿cuándo puedes?', '¿long o short?', 'llámame'],
    postitNoData: 'Sin empresa. Sin fechas. Sin contrato.',
    colCompany: 'La empresa',
    liCompany: 'LinkedIn Empleo',
    liTitle: '🚨 URGENTE — B1.1 para PMI · INMEDIATA',
    liSub: 'Air Nostrum Engineering · Mallorca · Hace 3h',
    liStat: '847 candidatos aplicaron',
    liWarn: 'Hace 3 días · Todavía abierto',
    red1: { strong: '⏱ 3 semanas', sub: 'tiempo medio de contratación' },
    red2: { strong: '📋 847 CVs', sub: 'para una posición' },
    red3: { strong: '❌ 0 verificados', sub: 'sin validación previa' },
    ts1: 'La evolución natural',
    ts2: 'es muy lenta.',
    ts3: '¡Podemos hacerlo mejor!',
  },
  share: {
    soon: 'Próximamente',
    title: 'Tu perfil. En cualquier sitio.',
    desc:
      'Comparte tu certificado AMX y tu logBook360 con cualquier empresa o plataforma mediante un enlace directo. Una visión completa de ti como técnico.',
    urlPrefix: 'aeromatch.eu/technician/',
  },
  ecosystem: {
    tag: 'En crecimiento continuo',
    title: 'Más que una plataforma de empleo.',
    sub: 'aeroMatch crece con el sector. Cada módulo nuevo es una herramienta real para técnicos y empresas.',
    active: '● Activo',
    beta: 'Beta',
    next: 'Próximo',
    cards: {
      training: {
        title: 'Zona Training',
        body: 'Preparación real para el examen Part-66 y el día a día del sector aeronáutico.',
        bullets: ['Simulacros EASA Part-66 B1/B2', 'Banco de preguntas por módulos', 'Guías técnicas descargables'],
      },
      logbook: {
        title: 'logBook360',
        body: 'Tu historial técnico analizado automáticamente con IA. Un vistazo vale más que 104 páginas de PDF.',
        bullets: ['Análisis de flotas y ATAs', 'Gráfico de actividad por año', 'Exportable y compartible'],
      },
      appLog: {
        title: 'App Technical Logbook',
        body: 'Registro continuado desde el móvil. Cierra el logbook, la empresa lo firma y logBook360 se actualiza.',
        bullets: ['Registro directo en vuelo', 'PDF firmado digitalmente', 'Sync con logBook360'],
      },
      match147: {
        title: 'Match 147',
        body: 'Conexión con organizaciones Part-147 para formación, habilitaciones y cursos de continuación.',
        bullets: ['Cursos de continuación', 'Habilitaciones de tipo', 'Formación relacionada'],
      },
      camo: {
        title: 'CAMO / Ingeniería',
        body: 'Segunda vertical para ingenieros y personal CAMO. Misma plataforma, nuevo mercado.',
        bullets: ['Perfiles de ingeniería', 'Organizaciones CAMO', 'Skills e instructores'],
      },
      uk: {
        title: 'UK & Umbrella',
        body: 'Partners verificados para trabajar en UK y con umbrella companies europeas sin complicaciones.',
        bullets: ['Partners umbrella verificados', 'Soporte visado UK', 'Seguro de accidentes'],
      },
    },
    radar: 'En el radar',
    radarItems: ['Panel métricas empresa', 'Búsqueda proactiva IA', 'API integración MRO', 'BIMI Gmail'],
  },
  stats: {
    t1: 'técnicos verificados',
    t2: 'empresa activa',
    t3: 'crecimiento orgánico',
    t4: 'anuncios de pago',
    note: 'Sin anuncios · Sin agencias · Built by técnicos aeronáuticos activos',
  },
  finalCta: {
    eyebrow: 'aeromatch.eu · Early access · EASA Part-66',
    title: '¿Listo para dejar de enviar CVs que nadie lee?',
    sub: 'Regístrate una vez. Define tu disponibilidad. Recibe ofertas directas. Sin intermediarios.',
    btnTech: 'Soy técnico · Registrarme',
    btnCompany: 'Busco técnicos · Acceder',
    note: 'Plataforma gratuita para técnicos durante el lanzamiento.',
  },
  how: {
    stepLabel: (n) => `Paso ${n}`,
    s1: {
      title: 'Define tu perfil técnico.',
      desc:
        'Indica tus licencias EASA, los tipos de avión en los que tienes experiencia, especialidades y cursos. aeroMatch solo te mostrará ofertas que encajan exactamente con tu perfil.',
      btn: 'Crear mi perfil →',
      formTitle: 'Mi perfil técnico',
      labels: ['Licencia EASA', 'Tipos de aeronave', 'Base preferida', 'Modalidad'],
      chips: [
        { row: 0, labels: ['B1.1', 'B2', 'B1.3'] },
        { row: 1, labels: ['737 NG', '787', 'A320', 'ATR72'] },
        { row: 2, labels: ['LPA', 'MAD', 'PMI'] },
        { row: 3, labels: ['Short term', 'Long term'] },
      ],
    },
    s2: {
      title: 'Sube tu documentación.',
      descPart1:
        'Licencias, logbook y certificados de cursos. Los verificamos manualmente antes de que seas visible para ninguna empresa. Obtienes tu ',
      descPart2: ' y tu perfil ',
      descPart3: ' — tu expediente técnico completo y verificado.',
      uploadHint: 'sube tus documentos',
      uploadBtn: 'Subir documentación',
      becomes: 'se convierte en',
      cert: 'Certificado',
      analysis: 'Análisis IA',
      profileLine1: 'Tu perfil',
      profileLine2: 'completo',
      amxBadge: 'AMX verificado',
      viewAmx: 'Ver AMX',
      request: 'Solicitar',
      tools: 'Herramientas',
      licenses: 'Licencias',
      aircraft: 'Aeronaves',
      specialties: 'Especialidades',
    },
    midCta: {
      title: '¿Eres técnico? Tu próxima oferta te está esperando.',
      sub: '66 técnicos verificados ya tienen su perfil activo. Sin CV, sin agencias.',
      btn: 'Registrarme gratis →',
    },
    s3: {
      title: 'Activa tu disponibilidad.',
      desc:
        'Como Airbnb para técnicos. Defines exactamente cuándo puedes trabajar — rango de fechas, duración y base. Las empresas solo ven técnicos disponibles para sus fechas concretas. Nada de llamadas, nada de WhatsApps.',
      btn: 'Activar disponibilidad →',
      calNav: '◀   Marzo 2025   ▶',
      calDays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      save: 'Guardar disponibilidad →',
      status: 'Visible para ofertas',
      note: 'La visibilidad activa es gratuita.',
    },
    s4: {
      title: 'La empresa te encuentra.',
      desc:
        'MROs y operadoras filtran por licencia, tipo de aeronave, base y disponibilidad. Eres completamente anónimo — solo ven tu código AMX, licencias y valoraciones — hasta que tú decides aceptar.',
      searchTitle: 'MRO Technics — buscando técnico',
      chips: ['B1.1 ×', '737NG ×', 'PMI ×', 'Mar–Abr ×'],
      avail: 'Libre ✓',
      send: 'Enviar solicitud',
      lock: '🔒 Identidad revelada solo al aceptar',
    },
    s5: {
      title: 'Recibes la oferta y decides.',
      desc:
        'Te llega una notificación con todos los detalles: empresa, tipo de avión, duración y condiciones. Tú eliges cómo trabajar — con umbrella, como autónomo, o la rechazas. Sin presión. Sin intermediarios.',
      pushApp: 'aeroMatch',
      pushTime: 'ahora',
      pushTitle: 'Nueva oferta recibida',
      pushSub: '737 NG · PMI · MRO Technics',
      q: '¿Cómo quieres trabajar?',
      b1: 'Con umbrella',
      b2: 'Soy autónomo',
      b3: 'Rechazar',
      success: 'Solicitud aceptada ✓',
      successSubLine1: 'El equipo aeroMatch te guiará',
      successSubLine2: 'en el proceso umbrella.',
    },
  },
}

const EN: LandingCopy = {
  story: {
    warnTag: 'How the industry works today',
    h2: 'This is not efficiency.',
    p: 'Sound familiar?',
    colTech: 'The technician',
    emailFrom: 'From: recruiter@mro-handler.eu',
    emailSubject: 'B1 opportunity — available?',
    emailStatus: 'No reply · 8 days',
    waHeader: 'B1 techs LPA ✈ · 847 members',
    wa1: 'anyone free for March?',
    wa2: 'I can only do 2 weeks',
    wa3: 'long or short term?',
    wa4: 'company hasn’t said...',
    waUnread: '+34 unread messages',
    colDates: 'Dates',
    chainSubject: 'RE: RE: RE: RE: Availability',
    chainLines: [
      '— Can you do 3–17?',
      '— I can only from the 10th',
      '— Long term or short?',
      '— We don’t know yet',
      '— Ok, let me know when you do',
    ],
    chainFooter: '14 emails · 3 weeks · No resolution',
    postitLines: ['B1 · 737 · LPA', 'when can you?', 'long or short?', 'call me'],
    postitNoData: 'No company. No dates. No contract.',
    colCompany: 'The company',
    liCompany: 'LinkedIn Jobs',
    liTitle: '🚨 URGENT — B1.1 for PMI · IMMEDIATE',
    liSub: 'Air Nostrum Engineering · Mallorca · 3h ago',
    liStat: '847 applicants',
    liWarn: '3 days ago · Still open',
    red1: { strong: '⏱ 3 weeks', sub: 'average time to hire' },
    red2: { strong: '📋 847 CVs', sub: 'for one role' },
    red3: { strong: '❌ 0 verified', sub: 'no prior validation' },
    ts1: 'Natural evolution',
    ts2: 'is very slow.',
    ts3: 'We can do better!',
  },
  share: {
    soon: 'Coming soon',
    title: 'Your profile. Anywhere.',
    desc:
      'Share your AMX certificate and logBook360 with any employer or platform via one link. A complete view of you as a technician.',
    urlPrefix: 'aeromatch.eu/technician/',
  },
  ecosystem: {
    tag: 'Growing continuously',
    title: 'More than a job board.',
    sub: 'aeroMatch grows with the sector. Every new module is a real tool for technicians and companies.',
    active: '● Live',
    beta: 'Beta',
    next: 'Next',
    cards: {
      training: {
        title: 'Training zone',
        body: 'Real preparation for the Part-66 exam and day-to-day aviation work.',
        bullets: ['EASA Part-66 B1/B2 mocks', 'Question bank by module', 'Downloadable technical guides'],
      },
      logbook: {
        title: 'logBook360',
        body: 'Your technical history analysed automatically with AI. One glance beats 104 pages of PDF.',
        bullets: ['Fleet and ATA analysis', 'Activity chart by year', 'Exportable and shareable'],
      },
      appLog: {
        title: 'Technical Logbook app',
        body: 'Continuous logging from mobile. Close the logbook, the company signs it, logBook360 updates.',
        bullets: ['In-flight logging', 'Digitally signed PDF', 'Sync with logBook360'],
      },
      match147: {
        title: 'Match 147',
        body: 'Connection with Part-147 organisations for training, type ratings and continuation courses.',
        bullets: ['Continuation courses', 'Type ratings', 'Related training'],
      },
      camo: {
        title: 'CAMO / Engineering',
        body: 'A second vertical for engineers and CAMO staff. Same platform, new market.',
        bullets: ['Engineering profiles', 'CAMO organisations', 'Skills and instructors'],
      },
      uk: {
        title: 'UK & Umbrella',
        body: 'Verified partners to work in the UK and with European umbrella companies without friction.',
        bullets: ['Verified umbrella partners', 'UK visa support', 'Accident insurance'],
      },
    },
    radar: 'On the radar',
    radarItems: ['Company metrics dashboard', 'Proactive AI search', 'MRO API integration', 'Gmail BIMI'],
  },
  stats: {
    t1: 'verified technicians',
    t2: 'active company',
    t3: 'organic growth',
    t4: 'paid job ads',
    note: 'No ads · No agencies · Built by active aircraft technicians',
  },
  finalCta: {
    eyebrow: 'aeromatch.eu · Early access · EASA Part-66',
    title: 'Ready to stop sending CVs nobody reads?',
    sub: 'Register once. Set your availability. Receive direct offers. No middlemen.',
    btnTech: 'I’m a technician · Sign up',
    btnCompany: 'I need technicians · Get access',
    note: 'Free for technicians during launch.',
  },
  how: {
    stepLabel: (n) => `Step ${n}`,
    s1: {
      title: 'Define your technical profile.',
      desc:
        'List your EASA licences, aircraft types you work on, specialties and courses. aeroMatch only shows offers that match your profile.',
      btn: 'Create my profile →',
      formTitle: 'My technical profile',
      labels: ['EASA licence', 'Aircraft types', 'Preferred base', 'Mode'],
      chips: [
        { row: 0, labels: ['B1.1', 'B2', 'B1.3'] },
        { row: 1, labels: ['737 NG', '787', 'A320', 'ATR72'] },
        { row: 2, labels: ['LPA', 'MAD', 'PMI'] },
        { row: 3, labels: ['Short term', 'Long term'] },
      ],
    },
    s2: {
      title: 'Upload your documents.',
      descPart1:
        'Licences, logbook and course certificates. We verify manually before you are visible to any company. You get your ',
      descPart2: ' and your ',
      descPart3: ' profile — your complete, verified technical file.',
      uploadHint: 'upload your documents',
      uploadBtn: 'Upload documents',
      becomes: 'becomes',
      cert: 'Certificate',
      analysis: 'AI analysis',
      profileLine1: 'Your profile',
      profileLine2: 'complete',
      amxBadge: 'AMX Verified',
      viewAmx: 'View AMX',
      request: 'Request',
      tools: 'Tools',
      licenses: 'Licenses',
      aircraft: 'Aircraft',
      specialties: 'Specialties',
    },
    midCta: {
      title: 'Technician? Your next offer is waiting.',
      sub: '66 verified technicians already have an active profile. No CV spam, no agencies.',
      btn: 'Sign up free →',
    },
    s3: {
      title: 'Turn on availability.',
      desc:
        'Like Airbnb for technicians. You define exactly when you can work — date range, duration and base. Companies only see technicians available for their dates. No cold calls, no WhatsApp threads.',
      btn: 'Set availability →',
      calNav: '◀   March 2025   ▶',
      calDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      save: 'Save availability →',
      status: 'Visible for offers',
      note: 'Active visibility is free.',
    },
    s4: {
      title: 'The company finds you.',
      desc:
        'MROs and operators filter by licence, aircraft type, base and availability. You stay anonymous — they only see your AMX code, licences and ratings — until you accept.',
      searchTitle: 'MRO Technics — looking for a technician',
      chips: ['B1.1 ×', '737NG ×', 'PMI ×', 'Mar–Apr ×'],
      avail: 'Available ✓',
      send: 'Send request',
      lock: '🔒 Identity revealed only after you accept',
    },
    s5: {
      title: 'You receive the offer and decide.',
      desc:
        'You get a notification with full details: company, aircraft type, duration and terms. You choose how to work — umbrella, self-employed, or decline. No pressure. No middlemen.',
      pushApp: 'aeroMatch',
      pushTime: 'now',
      pushTitle: 'New offer received',
      pushSub: '737 NG · PMI · MRO Technics',
      q: 'How do you want to work?',
      b1: 'With umbrella',
      b2: 'I’m self-employed',
      b3: 'Decline',
      success: 'Request accepted ✓',
      successSubLine1: 'The aeroMatch team will guide you',
      successSubLine2: 'through the umbrella process.',
    },
  },
}

export function getLandingCopy(lang: Language): LandingCopy {
  return lang === 'es' ? ES : EN
}
