-- ==========================================================
-- FILE: qbo_settings_schema.sql
-- DESCRIPTION: Creates a table to store per-user QuickBooks
-- Developer settings (Client ID, Client Secret, etc.)
-- ==========================================================

create table if not exists public.qbo_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade unique,
    client_id text not null,
    client_secret text not null,
    environment text not null default 'sandbox',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.qbo_settings enable row level security;

-- RLS: users can only read/write their own row
drop policy if exists "Users can manage their own qbo settings" on public.qbo_settings;
drop policy if exists "qbo_settings_select_own" on public.qbo_settings;
drop policy if exists "qbo_settings_insert_own" on public.qbo_settings;
drop policy if exists "qbo_settings_update_own" on public.qbo_settings;
drop policy if exists "qbo_settings_delete_own" on public.qbo_settings;

create policy "qbo_settings_select_own" on public.qbo_settings
    for select using (auth.uid() = user_id);

create policy "qbo_settings_insert_own" on public.qbo_settings
    for insert with check (auth.uid() = user_id);

create policy "qbo_settings_update_own" on public.qbo_settings
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "qbo_settings_delete_own" on public.qbo_settings
    for delete using (auth.uid() = user_id);

-- Optional: Create a trigger to automatically update the 'updated_at' column
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_qbo_settings_modtime on public.qbo_settings;
create trigger update_qbo_settings_modtime
    before update on public.qbo_settings
    for each row
    execute procedure update_modified_column();
