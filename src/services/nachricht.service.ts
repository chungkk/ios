import api from './api';
import type { Nachricht, NachrichtenResponse } from '../types/lesson.types';

export const fetchNachrichten = async (
  level?: string,
  page: number = 1,
  limit: number = 20
): Promise<NachrichtenResponse> => {
  try {
    const params: any = { page, limit };
    if (level) params.level = level;

    const response = await api.get<NachrichtenResponse>('/api/nachrichten', { params });
    return response.data;
  } catch (error) {
    console.error('[NachrichtService] Error fetching nachrichten:', error);
    throw error;
  }
};

export const fetchNachrichtById = async (id: string): Promise<Nachricht> => {
  try {
    const response = await api.get<{ nachricht: Nachricht }>(`/api/nachrichten/${id}`);
    return response.data.nachricht;
  } catch (error) {
    console.error('[NachrichtService] Error fetching nachricht:', error);
    throw error;
  }
};

export const nachrichtService = {
  fetchNachrichten,
  fetchNachrichtById,
};

export default nachrichtService;
