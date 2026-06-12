import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

export interface Link {
  id?: number;
  title: string;
  url: string;
  description?: string;
}

export const getLinks = async (): Promise<Link[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/links`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar links úteis:', error);
    throw error;
  }
};
