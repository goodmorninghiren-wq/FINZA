export type QboSettingsPayload = {
    client_id: string;
    client_secret: string;
    environment: string;
    source: 'database' | 'environment' | null;
    updated_at?: string | null;
};
