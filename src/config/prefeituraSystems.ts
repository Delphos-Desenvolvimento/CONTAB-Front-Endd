export type PrefeituraSystemKey = 'pca' | 'retencao' | 'ia'

export type PrefeituraSystemDef = {
  key: PrefeituraSystemKey
  name: string
  shortDescription: string
  /** Used when admin did not set a custom URL */
  placeholderUrl: string
  /** Visual accent for the card */
  accent: string
}

/** Catalog of Contab systems that can be enabled per prefeitura. */
export const PREFEITURA_SYSTEMS: PrefeituraSystemDef[] = [
  {
    key: 'pca',
    name: 'PCA',
    shortDescription: 'Portal de Controle e Acesso',
    placeholderUrl: 'https://pca.iarm.dev.br/login',
    accent: '#2979ff',
  },
  {
    key: 'retencao',
    name: 'Retenção',
    shortDescription: 'Gestão de retenções (em breve)',
    placeholderUrl: '#',
    accent: '#00c853',
  },
  {
    key: 'ia',
    name: 'I.A',
    shortDescription: 'Assistente e automações (em breve)',
    placeholderUrl: '#',
    accent: '#ffab00',
  },
]
