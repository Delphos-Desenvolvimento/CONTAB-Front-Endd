import api from './index';
import { asArray } from './response';

// Types
export interface AboutSection {
    id: number;
    overline: string;
    title: string;
    subtitle: string;
    solutionsOverline?: string;
    solutionsTitle?: string;
    solutionsSubtitle?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Statistic {
    id: number;
    value: string;
    label: string;
    icon: string;
    iconType: 'lucide' | 'image';
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Solution {
    id: number;
    title: string;
    description: string;
    icon: string;
    iconType: 'lucide' | 'image';
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateAboutDto {
    overline?: string;
    title?: string;
    subtitle?: string;
    solutionsOverline?: string;
    solutionsTitle?: string;
    solutionsSubtitle?: string;
}

export interface CreateStatisticDto {
    value: string;
    label: string;
    icon: string;
    iconType: 'lucide' | 'image';
    order?: number;
    isActive?: boolean;
}

export interface CreateSolutionDto {
    title: string;
    description: string;
    icon: string;
    iconType: 'lucide' | 'image';
    order?: number;
    isActive?: boolean;
}

export interface ReorderDto {
    items: Array<{ id: number; order: number }>;
}

// About Section
export const getAboutSection = async (): Promise<AboutSection> => {
    const response = await api.get('/content/about');
    return response.data;
};

export const updateAboutSection = async (data: UpdateAboutDto): Promise<AboutSection> => {
    const response = await api.put('/content/about', data);
    return response.data;
};

// Statistics - Public
export const getStatistics = async (): Promise<Statistic[]> => {
    const response = await api.get('/content/statistics');
    return asArray<Statistic>(response.data);
};

// Statistics - Admin
export const getAllStatisticsAdmin = async (): Promise<Statistic[]> => {
    const response = await api.get('/content/statistics/admin');
    return response.data;
};

export const getStatisticById = async (id: number): Promise<Statistic> => {
    const response = await api.get(`/content/statistics/${id}`);
    return response.data;
};

export const createStatistic = async (data: CreateStatisticDto): Promise<Statistic> => {
    const response = await api.post('/content/statistics', data);
    return response.data;
};

export const updateStatistic = async (id: number, data: Partial<CreateStatisticDto>): Promise<Statistic> => {
    const response = await api.put(`/content/statistics/${id}`, data);
    return response.data;
};

export const deleteStatistic = async (id: number): Promise<void> => {
    await api.delete(`/content/statistics/${id}`);
};

export const reorderStatistics = async (items: Array<{ id: number; order: number }>): Promise<{ success: boolean }> => {
    const response = await api.patch('/content/statistics/reorder', { items });
    return response.data;
};

// Solutions - Public
export const getSolutions = async (): Promise<Solution[]> => {
    const response = await api.get('/content/solutions');
    return asArray<Solution>(response.data);
};

// Solutions - Admin
export const getAllSolutionsAdmin = async (): Promise<Solution[]> => {
    const response = await api.get('/content/solutions/admin');
    return response.data;
};

export const getSolutionById = async (id: number): Promise<Solution> => {
    const response = await api.get(`/content/solutions/${id}`);
    return response.data;
};

export const createSolution = async (data: CreateSolutionDto): Promise<Solution> => {
    const response = await api.post('/content/solutions', data);
    return response.data;
};

export const updateSolution = async (id: number, data: Partial<CreateSolutionDto>): Promise<Solution> => {
    const response = await api.put(`/content/solutions/${id}`, data);
    return response.data;
};

export const deleteSolution = async (id: number): Promise<void> => {
    await api.delete(`/content/solutions/${id}`);
};

export const reorderSolutions = async (items: Array<{ id: number; order: number }>): Promise<{ success: boolean }> => {
    const response = await api.patch('/content/solutions/reorder', { items });
    return response.data;
};

// Links - Types
export interface Link {
    id: number;
    title: string;
    url: string;
    description?: string;
    imageBase64?: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLinkDto {
    title: string;
    url: string;
    description?: string;
    imageBase64?: string;
    order?: number;
    isActive?: boolean;
}

// Links - Public
export const getPublicLinks = async (): Promise<Link[]> => {
    const response = await api.get('/links');
    return asArray<Link>(response.data);
};

// Links - Admin
export const getAllLinksAdmin = async (): Promise<Link[]> => {
    const response = await api.get('/admin/links');
    return response.data;
};

export const getLinkById = async (id: number): Promise<Link> => {
    const response = await api.get(`/admin/links/${id}`);
    return response.data;
};

export const createLink = async (data: CreateLinkDto): Promise<Link> => {
    const response = await api.post('/admin/links', data);
    return response.data;
};

export const updateLink = async (id: number, data: Partial<CreateLinkDto>): Promise<Link> => {
    const response = await api.patch(`/admin/links/${id}`, data);
    return response.data;
};

export const deleteLink = async (id: number): Promise<void> => {
    await api.delete(`/admin/links/${id}`);
};

export const reorderLinks = async (updates: Array<{ id: number; order: number }>): Promise<void> => {
    await api.patch('/admin/links/reorder', updates);
};
