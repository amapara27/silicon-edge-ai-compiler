-- Migration: Create saved_models table
-- Run this in your Supabase SQL Editor

create table public.saved_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Identity
  name text not null,
  version integer default 1,
  
  -- Hardware Context
  target_chip text not null default 'STM32F401',
  
  -- Metrics (JSONB for flexibility)
  metrics jsonb default '{}'::jsonb,
  
  -- Storage Paths
  onnx_path text not null,
  c_code_path text,
  gui_state_path text,
  
  -- Status
  is_deployed boolean default false,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraints
  unique(user_id, name, version)
);

-- Enable Security
alter table public.saved_models enable row level security;

-- Policies
create policy "Users can view own models" on saved_models 
  for select using (auth.uid() = user_id);

create policy "Users can create models" on saved_models 
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own models" on saved_models 
  for delete using (auth.uid() = user_id);

create policy "Users can update own models" on saved_models 
  for update using (auth.uid() = user_id);
