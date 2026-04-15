-- ============================================================
-- Family Tree App — Phase 6 SQL Migration
-- Add symbol column to family_trees
-- Run this in your Supabase project → SQL Editor
-- ============================================================

alter table public.family_trees
  add column if not exists symbol text not null default '🌳';
