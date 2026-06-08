
// Helper interface matching DB schema
export interface QBOTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
    createdAt: number;
    companyName?: string;
    is_active?: boolean;
}

export const tokenStorage = {
    // Save tokens to Supabase
    save: async (supabase: any, tokens: any, realmId: string, companyName?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found while saving tokens');
                return;
            }

            // Prepare data for DB
            const dataToSave = {
                id: realmId,
                user_id: user.id,
                name: companyName || `Company ${realmId}`,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.expires_in,
                x_refresh_token_expires_in: tokens.x_refresh_token_expires_in,
                is_active: true,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('quickbooks_clients')
                .upsert(dataToSave, { onConflict: 'id' });

            if (error) {
                console.error('Error saving tokens to DB:', error);
            } else {
                console.log('Tokens saved to DB for', realmId, 'user:', user.id);
            }
        } catch (error) {
            console.error('Unexpected error saving tokens:', error);
        }
    },

    load: async (supabase: any, realmId?: string): Promise<QBOTokens | null> => {
        try {
            // Always scope by the currently authenticated user to prevent cross-user token access
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found while loading tokens');
                return null;
            }

            let query = supabase
                .from('quickbooks_clients')
                .select('*')
                .eq('user_id', user.id); // ← CRITICAL: scope to current user only

            if (realmId) {
                query = query.eq('id', realmId);
            } else {
                query = query.eq('is_active', true).limit(1);
            }

            const { data, error } = await query;

            if (error || !data || data.length === 0) {
                return null;
            }

            const row = data[0];
            return {
                realmId: row.id,
                companyName: row.name,
                access_token: row.access_token,
                refresh_token: row.refresh_token,
                expires_in: row.expires_in,
                x_refresh_token_expires_in: row.x_refresh_token_expires_in,
                is_active: row.is_active,
                createdAt: new Date(row.created_at).getTime()
            };

        } catch (error) {
            console.error('Error loading tokens from DB:', error);
            return null;
        }
    },

    // Fetch connected companies for UI — scoped to the authenticated user
    getCompanies: async (supabase: any, includeInactive = false) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found while fetching companies');
                return [];
            }

            let query = supabase
                .from('quickbooks_clients')
                .select('id, name')
                .eq('user_id', user.id); // ← CRITICAL: scope to current user only

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching companies from DB:", error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error("Error fetching companies:", error);
            return [];
        }
    },

    // Deactivate tokens — scoped to the authenticated user to prevent cross-user disconnects
    clear: async (supabase: any, realmId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found while clearing tokens');
                return;
            }

            if (realmId) {
                const { error } = await supabase
                    .from('quickbooks_clients')
                    .update({ is_active: false })
                    .eq('id', realmId)
                    .eq('user_id', user.id); // ← scope to current user only
                if (error) console.error('Error deactivating tokens:', error);
                else console.log('Tokens deactivated in DB for user:', user.id);
            } else {
                const { error } = await supabase
                    .from('quickbooks_clients')
                    .update({ is_active: false })
                    .eq('user_id', user.id) // ← scope to current user only
                    .neq('id', 'placeholder');
                if (error) console.error('Error clearing all tokens:', error);
                else console.log('All tokens deactivated in DB for user:', user.id);
            }
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },

    isAuthenticated: async (supabase: any, realmId?: string): Promise<boolean> => {
        const tokens = await tokenStorage.load(supabase, realmId);
        return !!tokens && !!tokens.access_token && tokens.is_active !== false;
    }
};
