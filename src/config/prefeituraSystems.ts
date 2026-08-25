export type PrefeituraSystemKey = 'pca' | 'retencao' | 'ia'

export type PrefeituraSystemDef = {
  key: PrefeituraSystemKey
  name: string
  shortDescription: string
  /** Used when admin did not set a custom URL */
  placeholderUrl: string
  /** Visual accent for the card */
  accent: string
  /** Optional logo shown instead of text initials */
  iconSrc?: string
}

/** Catalog of Contab systems that can be enabled per prefeitura. */
export const PREFEITURA_SYSTEMS: PrefeituraSystemDef[] = [
  {
    key: 'pca',
    name: 'PCA',
    shortDescription: 'Portal de Controle e Acesso',
    placeholderUrl: 'https://pca.iarm.dev.br/login',
    accent: '#2979ff',
    iconSrc: '/images/pca-logo.png',
  },
  {
    key: 'retencao',
    name: 'Retenção',
    shortDescription: 'Gestão de retenções',
    placeholderUrl: 'https://retencao.contab-pi.com.br/control_cliente/',
    accent: '#00c853',
  },
  {
    key: 'ia',
    name: 'I.A',
    shortDescription: 'Assistente e automações',
    placeholderUrl: 'https://tax-ia.iarm.dev.br/login',
    accent: '#ffab00',
  },
]

export const DEFAULT_SYSTEM_URLS = {
  pca: PREFEITURA_SYSTEMS.find((s) => s.key === 'pca')!.placeholderUrl,
  retencao: PREFEITURA_SYSTEMS.find((s) => s.key === 'retencao')!.placeholderUrl,
  ia: PREFEITURA_SYSTEMS.find((s) => s.key === 'ia')!.placeholderUrl,
} as const

export const DEFAULT_SYSTEM_DESCRIPTIONS = {
  pca: PREFEITURA_SYSTEMS.find((s) => s.key === 'pca')!.shortDescription,
  retencao: PREFEITURA_SYSTEMS.find((s) => s.key === 'retencao')!.shortDescription,
  ia: PREFEITURA_SYSTEMS.find((s) => s.key === 'ia')!.shortDescription,
} as const
