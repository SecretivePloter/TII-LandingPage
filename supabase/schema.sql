-- =============================================================================
-- Trading Insights Indonesia — Supabase schema
-- Jalankan seluruh isi file ini di Supabase Dashboard → SQL Editor → New query → Run.
-- =============================================================================

-- Extension untuk gen_random_uuid() (biasanya sudah aktif di project baru, tapi
-- kita pastikan biar aman).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: assets
-- Menyimpan metadata setiap gambar bukti (testimoni, hasil TP, winrate, analyst).
-- File gambar-nya sendiri hidup di Storage bucket `proof-assets`; di sini kita
-- cuma simpan URL publik + caption + urutan tampil.
-- -----------------------------------------------------------------------------
create table if not exists assets (
  id            uuid primary key default gen_random_uuid(),
  category      text not null check (category in ('testimoni', 'hasil-tp', 'winrate', 'analyst')),
  file_url      text not null,
  caption       text default '',
  display_order integer not null default 0,
  created_at    timestamptz default now()
);

-- Index untuk mempercepat query "ambil per kategori, urut display_order".
create index if not exists assets_category_order_idx
  on assets (category, display_order);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- Publik (anon key di browser) HANYA boleh SELECT. Semua tulis (insert/update/
-- delete) ditolak untuk anon; operasi tulis dilakukan lewat serverless function
-- yang memakai service_role key (service_role otomatis bypass RLS).
-- -----------------------------------------------------------------------------
alter table assets enable row level security;

drop policy if exists "public read" on assets;
create policy "public read"
  on assets
  for select
  using (true);

-- Sengaja TIDAK ada policy insert/update/delete untuk anon → operasi tulis dari
-- browser dengan anon key akan gagal. Itu memang tujuannya.

-- -----------------------------------------------------------------------------
-- Table: tickers
-- Daftar kode saham yang tampil di running ticker (header). Harga TIDAK disimpan
-- di sini; harga ditarik on-the-fly dari Yahoo Finance oleh /api/quotes lalu
-- di-cache di edge. Di sini cuma simpan kode + urutan tampil.
-- Kelola lewat /admin.html (tambah/hapus/urutkan).
-- -----------------------------------------------------------------------------
create table if not exists tickers (
  id            uuid primary key default gen_random_uuid(),
  symbol        text not null,                 -- kode IDX tanpa akhiran, mis. BBCA
  display_order integer not null default 0,
  created_at    timestamptz default now()
);

create unique index if not exists tickers_symbol_uidx on tickers (upper(symbol));
create index if not exists tickers_order_idx on tickers (display_order);

alter table tickers enable row level security;

drop policy if exists "public read tickers" on tickers;
create policy "public read tickers"
  on tickers
  for select
  using (true);

-- Sama seperti assets: tulis hanya lewat serverless (service_role). Anon read-only.

-- =============================================================================
-- CATATAN STORAGE (tidak bisa lewat SQL biasa — lakukan di Dashboard):
--   1. Storage → New bucket → nama: proof-assets → centang "Public bucket".
--   2. Public bucket sudah otomatis mengizinkan read publik untuk file di dalamnya.
--   3. Upload/delete file dilakukan lewat serverless function pakai service_role
--      key, jadi tidak perlu bikin storage policy tambahan untuk anon.
-- Detail langkahnya ada di DEPLOY.md.
-- =============================================================================
