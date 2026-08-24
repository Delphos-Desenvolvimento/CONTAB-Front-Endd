import api from './index'
import { asArray } from './response'

export type PrefeituraLink = {
  id: number
  cnpj: string
  title: string
  tradeName?: string | null
  url: string
  description?: string | null
  imageBase64?: string | null
  side?: string
  order: number
  isActive: boolean
  foundedAt?: string | null
  registrationStatus?: string | null
  legalNature?: string | null
  companySize?: string | null
  mainActivity?: string | null
  phone?: string | null
  email?: string | null
  street?: string | null
  addressNumber?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  isHeadOffice?: boolean
  allowPca: boolean
  allowRetencao: boolean
  allowIa: boolean
  urlPca?: string | null
  urlRetencao?: string | null
  urlIa?: string | null
}

export type CnpjaLookupResult = {
  cnpj: string
  title: string
  tradeName: string | null
  description: string | null
  foundedAt: string | null
  registrationStatus: string | null
  legalNature: string | null
  companySize: string | null
  mainActivity: string | null
  phone: string | null
  email: string | null
  street: string | null
  addressNumber: string | null
  district: string | null
  city: string | null
  state: string | null
  zip: string | null
  isHeadOffice: boolean
  source?: unknown
}

export type CreatePrefeituraLinkDto = {
  cnpj: string
  password: string
  title?: string
  url?: string
  description?: string
  imageBase64?: string
  order?: number
  isActive?: boolean
  allowPca?: boolean
  allowRetencao?: boolean
  allowIa?: boolean
  urlPca?: string
  urlRetencao?: string
  urlIa?: string
}

export type PrefeituraLoginResponse = {
  access_token: string
  prefeitura: {
    id: number
    cnpj: string
    title: string
    tradeName?: string | null
    allowPca: boolean
    allowRetencao: boolean
    allowIa: boolean
  }
}

const PREF_TOKEN_KEY = 'prefeitura_token'
const PREF_DATA_KEY = 'prefeitura_session'

export const loginPrefeitura = async (
  cnpj: string,
  password: string,
): Promise<PrefeituraLoginResponse> => {
  const response = await api.post('/auth/prefeitura/login', { cnpj, password })
  const data = response.data as PrefeituraLoginResponse
  localStorage.setItem(PREF_TOKEN_KEY, data.access_token)
  localStorage.setItem(PREF_DATA_KEY, JSON.stringify(data.prefeitura))
  return data
}

export const logoutPrefeitura = () => {
  localStorage.removeItem(PREF_TOKEN_KEY)
  localStorage.removeItem(PREF_DATA_KEY)
}

export const getPrefeituraToken = () => localStorage.getItem(PREF_TOKEN_KEY)

export const getPrefeituraSession = () => {
  const raw = localStorage.getItem(PREF_DATA_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PrefeituraLoginResponse['prefeitura']
  } catch {
    return null
  }
}

export const getPublicPrefeituraById = async (id: number): Promise<PrefeituraLink> => {
  const response = await api.get(`/prefeitura-links/${id}`)
  return response.data
}

export const getAdminPrefeituraLinks = async (): Promise<PrefeituraLink[]> => {
  const response = await api.get('/admin/prefeitura-links')
  return asArray<PrefeituraLink>(response.data)
}

export const lookupCnpja = async (cnpj: string): Promise<CnpjaLookupResult> => {
  const digits = cnpj.replace(/\D/g, '')
  const response = await api.get(`/admin/prefeitura-links/cnpja/${digits}`)
  return response.data
}

export const createPrefeituraLink = async (
  data: CreatePrefeituraLinkDto,
): Promise<PrefeituraLink> => {
  const response = await api.post('/admin/prefeitura-links', data)
  return response.data
}

export const updatePrefeituraLink = async (
  id: number,
  data: Partial<CreatePrefeituraLinkDto> & { isActive?: boolean },
): Promise<PrefeituraLink> => {
  const response = await api.patch(`/admin/prefeitura-links/${id}`, data)
  return response.data
}

export const deletePrefeituraLink = async (id: number): Promise<void> => {
  await api.delete(`/admin/prefeitura-links/${id}`)
}

export const refreshPrefeituraCnpja = async (id: number): Promise<PrefeituraLink> => {
  const response = await api.post(`/admin/prefeitura-links/${id}/refresh-cnpja`)
  return response.data
}

export const formatCnpj = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
