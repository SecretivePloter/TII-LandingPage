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

-- -----------------------------------------------------------------------------
-- Public track record & signal journal
-- -----------------------------------------------------------------------------
-- Satu baris = ringkasan performa dalam satu minggu kalender. Return TII dan
-- IHSG sengaja diinput eksplisit oleh admin supaya basis perhitungannya bisa
-- ditulis dan diaudit, bukan diklaim dari screenshot atau angka otomatis yang
-- tidak jelas asalnya.
create table if not exists weekly_track_records (
  id              uuid primary key default gen_random_uuid(),
  week_start      date not null unique,
  week_end        date not null,
  tii_return_pct  numeric(10, 2),
  ihsg_return_pct numeric(10, 2),
  methodology     text not null default 'Rata-rata hasil sinyal yang sudah closed pada periode ini.',
  note            text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  check (week_end >= week_start)
);

create index if not exists weekly_track_records_week_idx
  on weekly_track_records (week_start desc);

-- Jurnal satu-per-satu. Nilai P/L hanya diisi untuk sinyal yang sudah selesai;
-- posisi OPEN tetap ditampilkan dengan entry, TP, dan stop loss-nya.
create table if not exists signal_journal (
  id              uuid primary key default gen_random_uuid(),
  week_start      date not null references weekly_track_records(week_start) on delete cascade,
  recommendation_date date not null default current_date,
  done_date       date,
  symbol          text not null,
  setup_type      text not null default 'Swing',
  entry_low       numeric(14, 2),
  entry_high      numeric(14, 2),
  entry_price     numeric(14, 2) not null,
  target_price    numeric(14, 2),
  high_price      numeric(14, 2),
  stop_loss_price numeric(14, 2),
  exit_price      numeric(14, 2),
  pnl_pct         numeric(10, 2),
  -- PENDING adalah "REKOM BARU" dari spreadsheet, bukan posisi floating.
  status          text not null default 'OPEN' check (status in ('PENDING', 'OPEN', 'WIN', 'LOSS', 'STOPPED', 'CANCELLED')),
  source_status   text,
  note            text default '',
  published_at    timestamptz default now(),
  created_at      timestamptz default now(),
  check (symbol ~ '^[A-Z0-9]{2,16}$')
);

create index if not exists signal_journal_week_idx
  on signal_journal (week_start desc, published_at desc);

-- Aman dijalankan lagi oleh proyek yang sudah memakai versi awal schema.
alter table signal_journal add column if not exists recommendation_date date;
alter table signal_journal add column if not exists done_date date;
alter table signal_journal add column if not exists entry_low numeric(14, 2);
alter table signal_journal add column if not exists entry_high numeric(14, 2);
alter table signal_journal add column if not exists high_price numeric(14, 2);
alter table signal_journal add column if not exists source_status text;
alter table signal_journal drop constraint if exists signal_journal_symbol_check;
alter table signal_journal add constraint signal_journal_symbol_check check (symbol ~ '^[A-Z0-9]{2,16}$');
alter table signal_journal drop constraint if exists signal_journal_status_check;
alter table signal_journal add constraint signal_journal_status_check check (status in ('PENDING', 'OPEN', 'WIN', 'LOSS', 'STOPPED', 'CANCELLED'));

alter table weekly_track_records enable row level security;
alter table signal_journal enable row level security;

drop policy if exists "public read weekly track records" on weekly_track_records;
create policy "public read weekly track records"
  on weekly_track_records for select using (true);

drop policy if exists "public read signal journal" on signal_journal;
create policy "public read signal journal"
  on signal_journal for select using (true);

-- Operasi tulis tetap eksklusif melalui Vercel Function yang terautentikasi.

-- =============================================================================
-- CATATAN STORAGE (tidak bisa lewat SQL biasa — lakukan di Dashboard):
--   1. Storage → New bucket → nama: proof-assets → centang "Public bucket".
--   2. Public bucket sudah otomatis mengizinkan read publik untuk file di dalamnya.
--   3. Upload/delete file dilakukan lewat serverless function pakai service_role
--      key, jadi tidak perlu bikin storage policy tambahan untuk anon.
-- Detail langkahnya ada di DEPLOY.md.
-- =============================================================================
