import api from '.';
import { asArray } from './response';

export interface Partner {
    id: number;
    name: string;
    logoBase64: string;
    description?: string;
    displayOrder: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePartnerData {
    name: string;
    logoBase64: string;
    description?: string;
    displayOrder?: number;
    active?: boolean;
}

export interface UpdatePartnerData {
    name?: string;
    logoBase64?: string;
    description?: string;
    displayOrder?: number;
    active?: boolean;
}

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const PartnersService = {
    /**
     * Busca todos os parceiros
     */
    async getAll(activeOnly: boolean = true): Promise<Partner[]> {
        try {
            const response = await api.get('/partners', {
                params: { activeOnly },
            });
            return asArray<Partner>(response.data);
        } catch (error) {
            console.error('Erro ao buscar parceiros:', error);
            throw error;
        }
    },

    /**
     * Busca um parceiro por ID
     */
    async getById(id: number): Promise<Partner> {
        try {
            const response = await api.get<Partner>(`/partners/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar parceiro com ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Cria um novo parceiro
     */
    async create(partnerData: CreatePartnerData, logoFile?: File): Promise<Partner> {
        try {
            let logoBase64 = partnerData.logoBase64;

            if (logoFile) {
                logoBase64 = await fileToDataUrl(logoFile);
            }

            const response = await api.post<Partner>('/partners', {
                ...partnerData,
                logoBase64,
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao criar parceiro:', error);
            throw error;
        }
    },

    /**
     * Atualiza um parceiro existente
     */
    async update(id: number, partnerData: UpdatePartnerData, logoFile?: File): Promise<Partner> {
        try {
            let updateData = { ...partnerData };

            if (logoFile) {
                const logoBase64 = await fileToDataUrl(logoFile);
                updateData = { ...updateData, logoBase64 };
            }

            const response = await api.patch<Partner>(`/partners/${id}`, updateData);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar parceiro com ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Remove um parceiro
     */
    async delete(id: number): Promise<void> {
        try {
            await api.delete(`/partners/${id}`);
        } catch (error) {
            console.error(`Erro ao excluir parceiro com ID ${id}:`, error);
            throw error;
        }
    },
};

export default PartnersService;
