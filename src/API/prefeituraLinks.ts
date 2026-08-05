import api from './index'
import { asArray } from './response'

export type PrefeituraLink = {
  id: number
  title: string
  url: string
  description?: string | null
  imageBase64?: string | null
  side?: string
  order: number
  isActive: boolean
  allowPca: boolean
  allowRetencao: boolean
  allowIa: boolean
  urlPca?: string | null
  urlRetencao?: string | null
  urlIa?: string | null
}

export type CreatePrefeituraLinkDto = {
  title: string
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

export const getPublicPrefeituraLinks = async (): Promise<PrefeituraLink[]> => {
  const response = await api.get('/prefeitura-links')
  return asArray<PrefeituraLink>(response.data)
}

export const getPublicPrefeituraById = async (id: number): Promise<PrefeituraLink> => {
  const response = await api.get(`/prefeitura-links/${id}`)
  return response.data
}

export const getAdminPrefeituraLinks = async (): Promise<PrefeituraLink[]> => {
  const response = await api.get('/admin/prefeitura-links')
  return asArray<PrefeituraLink>(response.data)
}

export const createPrefeituraLink = async (
  data: CreatePrefeituraLinkDto,
): Promise<PrefeituraLink> => {
  const response = await api.post('/admin/prefeitura-links', data)
  return response.data
}

export const updatePrefeituraLink = async (
  id: number,
  data: Partial<CreatePrefeituraLinkDto>,
): Promise<PrefeituraLink> => {
  const response = await api.patch(`/admin/prefeitura-links/${id}`, data)
  return response.data
}

export const deletePrefeituraLink = async (id: number): Promise<void> => {
  await api.delete(`/admin/prefeitura-links/${id}`)
}
