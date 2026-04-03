import type { Language } from './translations'

export type AboutCopy = {
  metaTitle: string
  hero: {
    tag: string
    h1: string
    h1Em: string
    lead: string
  }
  founder: {
    label: string
    name: string
    role: string
    quoteParas: string[]
    sigLine: string
    sigName: string
  }
  values: {
    title: string
    subtitle: string
    cards: { icon: string; title: string; body: string }[]
  }
  testimonials: {
    title: string
    subtitle: string
    items: { quote: string; name: string; role: string }[]
  }
  how: {
    title: string
    subtitle: string
    tech: { title: string; steps: { title: string; sub: string }[]; cta: string }
    company: { title: string; steps: { title: string; sub: string }[]; cta: string }
  }
  faqTitle: string
  faq: { q: string; a: string }[]
  cta: {
    eyebrow: string
    title: string
    lead: string
    btnTech: string
    btnCompany: string
    emailNote: string
  }
  footer: {
    line1: string
    line2: string
  }
  navBack: string
}

const ABOUT_ES: AboutCopy = {
  metaTitle: 'Sobre aeroMatch — Built by techs, for techs',
  hero: {
    tag: 'Built by techs · For techs',
    h1: 'Construido',
    h1Em: 'desde dentro.',
    lead:
      'No somos una startup tecnológica que descubrió la aviación. Somos técnicos que construyeron la herramienta que necesitábamos.',
  },
  founder: {
    label: 'El fundador',
    name: 'Raúl Sánchez Burgos',
    role: 'Técnico B1.1 / B2 / C · Air Europa · Las Palmas (LPA)',
    quoteParas: [
      'Soy Raúl, técnico B1, B2, C en Air Europa con 20 años de experiencia.',
      'He visto compañeros con 15 años de experiencia enviar CVs durante semanas sin respuesta.',
      'He visto empresas rechazar candidatos excelentes porque llegaron cuando ya habían contratado.',
      'El problema nunca fue la falta de técnicos o trabajo. El problema es cómo nos conectamos.',
      'Por eso construí aeroMatch.',
      'Un lugar donde técnicos y empresas se encuentran en tiempo real. Sin papeleos. Sin intermediarios. Sin comisiones.',
    ],
    sigLine: 'Built by un técnico, para técnicos.',
    sigName: '— Raúl, Founder',
  },
  values: {
    title: 'Lo que no cambia.',
    subtitle: 'Tres principios que guían cada decisión de producto.',
    cards: [
      {
        icon: '⭐',
        title: 'Visibility is earned, not bought',
        body:
          'Tu posición la determinan tus licencias, tu experiencia y las valoraciones de las empresas con las que has trabajado. Sin pay-to-win. Sin agencias que cobren por ponerte en primera fila.',
      },
      {
        icon: '🛡️',
        title: 'Real verification, not automated',
        body:
          'Revisamos manualmente cada documento subido y lo contrastamos con las licencias y skills declarados por el técnico. No certificamos la validez legal del documento — eso es competencia de la autoridad correspondiente — pero sí verificamos que lo que el técnico declara está respaldado por documentación real y coherente.',
      },
      {
        icon: '🔧',
        title: 'Construido por técnicos, para técnicos',
        body:
          'Cada decisión de producto ha pasado por el punto de vista de técnicos que han apoyado este proyecto con sus experiencias reales. aeroMatch no es una plataforma de RRHH con terminología aeronáutica — es una herramienta construida desde el hangar.',
      },
    ],
  },
  testimonials: {
    title: 'Lo que dicen.',
    subtitle: 'Técnicos y empresas que ya usan aeroMatch.',
    items: [
      {
        quote:
          '"Me parece una herramienta perfecta para aprovechar los días libres y vivir una experiencia diferente sin dejar tu puesto fijo. Tener el perfil preparado y la documentación organizada te permite reaccionar rápido si surge algo interesante, y además es una forma realista de ganar experiencia y generar ingresos extra."',
        name: 'José María',
        role: 'Licencia + Especialidades · B1 · A320/B737 · España',
      },
      {
        quote:
          '"Ahora es mucho más fácil tener todo preparado según mi disponibilidad. Desde la plataforma puedo organizar mi perfil y la documentación sin los de correos ni archivos sueltos. Es cómodo y ordenado, que al final es lo que necesitamos."',
        name: 'Leo',
        role: 'B2 Aviónica · España',
      },
      {
        quote:
          '"Tener el perfil técnico preparado y la documentación organizada en un solo lugar me da tranquilidad. Si algún día surge una oportunidad interesante, sé que puedo reaccionar rápido sin empezar desde cero."',
        name: 'B1',
        role: 'A320/B737 · España',
      },
      {
        quote:
          '"La posibilidad de ver técnicos disponibles por fechas y con documentación estructurada facilita mucho el proceso. Poder centralizar disponibilidad y requisitos técnicos en una sola plataforma tiene sentido para proyectos puntuales."',
        name: 'MRO Maintenance Manager',
        role: 'EU',
      },
    ],
  },
  how: {
    title: 'Cómo funciona.',
    subtitle: 'Dos flujos, una sola plataforma.',
    tech: {
      title: 'Para técnicos',
      steps: [
        { title: 'Crea tu perfil (2 min)', sub: 'Licencias + especialidades' },
        { title: 'Sube documentación', sub: 'Verificamos tu perfil · obtienes AMX' },
        { title: 'Define disponibilidad', sub: 'Cuándo estás libre · tipo contrato' },
        { title: 'Recibe ofertas', sub: 'Empresas te contactan directamente' },
      ],
      cta: 'Completar perfil técnico →',
    },
    company: {
      title: 'Para empresas',
      steps: [
        { title: '2 min · Datos de empresa', sub: 'Datos empresa + requisitos del proyecto' },
        { title: 'Filtra candidatos', sub: 'Por licencia, experiencia, disponibilidad' },
        { title: 'Contacta directamente', sub: 'Sin intermediarios' },
        { title: 'Contrata', sub: 'Acuerdo directo técnico–empresa' },
      ],
      cta: 'Buscar técnicos ahora →',
    },
  },
  faqTitle: 'Preguntas frecuentes.',
  faq: [
    {
      q: '¿Cuánto cuesta?',
      a:
        'Durante la fase de pre-lanzamiento, aeroMatch es completamente gratuito para técnicos. Las empresas tienen acceso a las primeras búsquedas sin coste. Los planes premium con funcionalidades avanzadas estarán disponibles próximamente.',
    },
    {
      q: '¿Cómo verificáis las licencias?',
      a:
        'Revisamos manualmente cada documento subido por el técnico — licencias EASA, logbook y certificados de cursos. Una vez verificados, el técnico recibe su Certificado AMX, que acredita que sus documentos han sido revisados por el equipo de aeroMatch. No somos la autoridad competente, pero sí garantizamos que hemos visto los originales.',
    },
    {
      q: '¿Sois una agencia de colocación?',
      a:
        'No. aeroMatch es una plataforma de conexión directa. No cobramos comisiones por contrato, no intermediamos en las negociaciones y no gestionamos contratos. El acuerdo es siempre directo entre el técnico y la empresa.',
    },
    {
      q: '¿Qué beneficios tienen los registrados en pre-lanzamiento?',
      a:
        'Los técnicos que se registren ahora durante la fase de pre-lanzamiento tendrán beneficios especiales cuando se activen los planes premium: acceso prioritario, descuentos en los planes de pago y el badge de "Founding Member" en su perfil.',
    },
    {
      q: '¿Puedo usar aeroMatch si no tengo Right to Work en UK?',
      a:
        'Sí. Próximamente tendremos colaboradores especializados en visado de trabajo UK y umbrella companies que facilitan el proceso. Por ahora, si tienes dudas sobre tu situación específica, escríbenos a hola@aeromatch.eu y te orientamos.',
    },
  ],
  cta: {
    eyebrow: 'aeromatch.eu · Early access',
    title: '¿Listo para conectar?',
    lead: 'Regístrate una vez. Define tu disponibilidad. Recibe ofertas directas.',
    btnTech: 'Soy técnico · Registrarme',
    btnCompany: 'Busco técnicos · Acceder',
    emailNote: 'hola@aeromatch.eu',
  },
  footer: {
    line1: 'Connecting talent with opportunity · aeromatch.eu',
    line2:
      'Datos protegidos bajo GDPR · Built by técnicos aeronáuticos activos · © 2025 aeroMatch',
  },
  navBack: '← Volver al inicio',
}

const ABOUT_EN: AboutCopy = {
  metaTitle: 'About aeroMatch — Built by techs, for techs',
  hero: {
    tag: 'Built by techs · For techs',
    h1: 'Built',
    h1Em: 'from the inside.',
    lead:
      'We are not a tech startup that “discovered” aviation. We are technicians who built the tool we actually needed.',
  },
  founder: {
    label: 'The founder',
    name: 'Raúl Sánchez Burgos',
    role: 'B1.1 / B2 / C technician · Air Europa · Las Palmas (LPA)',
    quoteParas: [
      'I’m Raúl, B1, B2, C technician at Air Europa with 20 years of experience.',
      'I’ve seen colleagues with 15 years of experience send CVs for weeks with no reply.',
      'I’ve seen companies turn down great candidates because they arrived after hiring was already done.',
      'The problem was never a lack of technicians or jobs. The problem is how we connect.',
      'That’s why I built aeroMatch.',
      'A place where technicians and companies meet in real time. No paperwork. No middlemen. No commissions.',
    ],
    sigLine: 'Built by a technician, for technicians.',
    sigName: '— Raúl, Founder',
  },
  values: {
    title: 'What does not change.',
    subtitle: 'Three principles behind every product decision.',
    cards: [
      {
        icon: '⭐',
        title: 'Visibility is earned, not bought',
        body:
          'Your position reflects your licences, experience, and ratings from companies you have worked with. No pay-to-win. No agencies charging to put you first.',
      },
      {
        icon: '🛡️',
        title: 'Real verification, not automated',
        body:
          'We manually review every uploaded document and cross-check it with the licences and skills the technician declares. We do not certify the legal validity of a document—that belongs to the competent authority—but we do verify that what the technician claims is backed by real, consistent documentation.',
      },
      {
        icon: '🔧',
        title: 'Built by technicians, for technicians',
        body:
          'Every product decision has been shaped by technicians who supported this project with real-world experience. aeroMatch is not an HR platform with aviation buzzwords—it is a tool built from the hangar.',
      },
    ],
  },
  testimonials: {
    title: 'What people say.',
    subtitle: 'Technicians and companies already using aeroMatch.',
    items: [
      {
        quote:
          '"For me it’s a great way to use days off and try something different without leaving a permanent role. Having your profile and documents ready lets you move fast when something interesting appears—and it’s a realistic way to gain experience and extra income."',
        name: 'José María',
        role: 'Licence + ratings · B1 · A320/B737 · Spain',
      },
      {
        quote:
          '"It’s much easier to keep everything aligned with my availability. From the platform I can organise my profile and documents without scattered emails and files. Comfortable and tidy—exactly what we need."',
        name: 'Leo',
        role: 'B2 Avionics · Spain',
      },
      {
        quote:
          '"Having my technical profile and documents in one place gives me peace of mind. If a good opportunity comes up, I know I can react quickly without starting from zero."',
        name: 'B1',
        role: 'A320/B737 · Spain',
      },
      {
        quote:
          '"Seeing technicians available by date with structured documentation makes the process much easier. Centralising availability and technical requirements on one platform makes sense for short-term projects."',
        name: 'MRO Maintenance Manager',
        role: 'EU',
      },
    ],
  },
  how: {
    title: 'How it works.',
    subtitle: 'Two flows, one platform.',
    tech: {
      title: 'For technicians',
      steps: [
        { title: 'Create your profile (2 min)', sub: 'Licences + specialties' },
        { title: 'Upload documentation', sub: 'We verify your profile · you get AMX' },
        { title: 'Set availability', sub: 'When you are free · contract type' },
        { title: 'Receive offers', sub: 'Companies contact you directly' },
      ],
      cta: 'Complete technician profile →',
    },
    company: {
      title: 'For companies',
      steps: [
        { title: '2 min · Company details', sub: 'Company data + project requirements' },
        { title: 'Filter candidates', sub: 'By licence, experience, availability' },
        { title: 'Contact directly', sub: 'No middlemen' },
        { title: 'Hire', sub: 'Direct technician–company agreement' },
      ],
      cta: 'Search technicians now →',
    },
  },
  faqTitle: 'Frequently asked questions.',
  faq: [
    {
      q: 'How much does it cost?',
      a:
        'During the pre-launch phase, aeroMatch is completely free for technicians. Companies get access to initial searches at no cost. Premium plans with advanced features will be available soon.',
    },
    {
      q: 'How do you verify licences?',
      a:
        'We manually review every document the technician uploads—EASA licences, logbooks, and course certificates. Once verified, the technician receives their AMX certificate, showing our team has reviewed the files. We are not the competent authority, but we confirm we have seen the originals.',
    },
    {
      q: 'Are you a recruitment agency?',
      a:
        'No. aeroMatch is a direct connection platform. We do not charge contract commissions, we do not sit in the middle of negotiations, and we do not manage contracts. The agreement is always between the technician and the company.',
    },
    {
      q: 'What benefits do pre-launch users get?',
      a:
        'Technicians who register now during pre-launch will receive special benefits when premium plans go live: priority access, discounts on paid plans, and a “Founding Member” badge on their profile.',
    },
    {
      q: 'Can I use aeroMatch without UK Right to Work?',
      a:
        'Yes. We will soon partner with specialists in UK work visas and umbrella companies to streamline the process. If you are unsure about your situation, email hola@aeromatch.eu and we will guide you.',
    },
  ],
  cta: {
    eyebrow: 'aeromatch.eu · Early access',
    title: 'Ready to connect?',
    lead: 'Register once. Set your availability. Receive direct offers.',
    btnTech: 'I’m a technician · Sign up',
    btnCompany: 'I need technicians · Get access',
    emailNote: 'hola@aeromatch.eu',
  },
  footer: {
    line1: 'Connecting talent with opportunity · aeromatch.eu',
    line2:
      'Data protected under GDPR · Built by active aviation technicians · © 2025 aeroMatch',
  },
  navBack: '← Back to home',
}

export function getAboutCopy(lang: Language): AboutCopy {
  return lang === 'es' ? ABOUT_ES : ABOUT_EN
}
