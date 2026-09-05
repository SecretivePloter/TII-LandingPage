# PROMPT UNTUK CLAUDE CODE — Landing Page "Trading Insights Indonesia" (v2)

## KONTEKS BISNIS
Buatkan landing page (single-file HTML/CSS/JS utama, pakai Tailwind via CDN + vanilla JS,
tanpa framework build tools di sisi frontend) untuk bisnis bernama **Trading Insights
Indonesia** — membership premium berbasis Discord yang menyediakan sinyal trading saham
harian.

Tujuan satu-satunya halaman ini: **memaksimalkan konversi jadi subscriber bulanan aktif**.
Setiap elemen desain dan copy harus melayani tujuan ini, bukan sekadar estetika.

Link Discord (dipakai di SEMUA tombol CTA di halaman ini, ganti semua placeholder lama):
```
https://discord.gg/msJHhqFRCK
```

Logo brand sudah ada (eagle emas + panah uptrend, di atas background navy dengan tekstur
peta dunia/circuit). Gunakan logo ini sebagai referensi utama arah visual — jangan bikin
desain yang bertabrakan dengan feel logo.

## ATURAN DESAIN — HINDARI "AI SLOP"
Jangan pakai pola desain generik yang langsung ketauan buatan AI:
- JANGAN pakai gradient ungu-ke-biru generik ala SaaS template.
- JANGAN pakai layout simetris 3-kolom "feature card" khas landing page AI-generated.
- JANGAN pakai stock icon Heroicons/FontAwesome polos tanpa treatment visual.
- JANGAN pakai font default (Inter/system-ui/Poppins) tanpa treatment — lihat spesifikasi
  tipografi di bawah.

**DNA visual**: dark navy nyaris hitam + gold/emas murni sebagai warna aksen premium,
nuansa "elite trading floor / command center" — TANPA aksen cyan/tech tambahan, murni
dua warna ini biar konsisten sama logo. Gunakan asymmetric layout, depth (layered shadow,
subtle glow di elemen gold), dan micro-interaction (hover state pada pricing card, angka
yang count-up saat scroll).

### Palet warna
- Background dasar: navy nyaris hitam (`#0A0E14` – `#0D1119`), bukan hitam pekat total.
- Layer kedua/card: navy sedikit lebih terang dengan hint teal-gelap (`#131A24`).
- Aksen utama: gold, warnanya persis mengacu ke gold di logo — muted, bukan gold
  gaudy/kuning terang (`#C9A24B` – `#D4AF6A`).
- Aksen sukses/data positif: teal/emerald gelap, bukan hijau neon (dipakai secukupnya,
  bukan warna utama kedua).
- Teks body: off-white hangat (`#E8E6E1`), bukan putih pure `#FFFFFF`.

### Tipografi — WAJIB, ini poin kritis
Jangan pakai Inter, Poppins, Roboto, Montserrat, atau font default Google Fonts populer
lain yang jadi ciri khas "dibuat AI".

Arah baru: **sans-serif tech/bold**, bukan lagi editorial-serif seperti draft sebelumnya.
- **Headline/display**: `Sora`, weight 700–800 (Bold/ExtraBold). Efeknya harus terasa
  tegas, modern, sedikit "fintech app premium" — bukan startup app generik, karena tetap
  dipasangkan dengan gold accent & spacing yang lega, bukan dijejelin ala app store.
- **Body/UI text**: sans-serif netral tapi berkarakter, BUKAN Sora juga (biar ada
  hierarki), dan bukan Inter — pilih `General Sans` atau `Instrument Sans`.
- **Angka/data (harga, statistik, count-up)**: tabular figure dari font yang sama, atau
  font monospace-ringan seperti `Spline Sans Mono` / `JetBrains Mono` khusus untuk angka
  harga dan statistik.

Load font dari Google Fonts/Fontshare via CDN (sesuai lisensi masing-masing font),
definisikan sebagai CSS variable (`--font-display`, `--font-body`, `--font-mono`) supaya
konsisten dan gampang diganti kalau saya mau tukar font nanti.

## FITUR WAJIB: ANIMASI "MARKET PULSE" — INTERACTIVE PARTICLE NETWORK
Tambahkan animasi partikel interaktif di background Hero Section (canvas, bukan
video/GIF, bukan library berat seperti particles.js/tsParticles — build native pakai
`<canvas>` + vanilla JS supaya ringan dan bisa dikustomisasi persis sesuai tema).

**PENTING: kepadatan node harus terasa RAMAI/PADAT** — ini bukan ambience minimalis
tipis-tipis, tapi visual yang cukup "hidup dan penuh data" tanpa mengganggu keterbacaan
headline. Kalau ragu antara "lebih padat" atau "lebih minimalis", pilih lebih padat.

**Konsep — bukan partikel generik, harus terasa seperti visualisasi data pasar saham:**

1. **Node = harga saham/ticker.** Titik-titik partikel merepresentasikan node harga
   (bukan bintang/bola acak). Setiap node punya ukuran sedikit random (2–4px) dan warna
   dari 2 varian: gold (`#D4AF6A`, mayoritas) dan teal/emerald redup (minoritas, ~20%
   dari total node) — merepresentasikan sentimen "bullish/perhatian" vs "netral". Density
   node desktop dibikin jauh lebih banyak dari treatment particle-network yang biasa
   dipakai (target kesan "grid data pasar", bukan taburan bintang tipis).

2. **Garis penghubung = korelasi pasar.** Garis tipis (`opacity` rendah, ~0.08–0.15)
   menghubungkan node yang berjarak dekat, mensimulasikan "korelasi antar saham" — makin
   dekat node, makin solid garisnya (opacity naik seiring jarak mengecil). Karena node
   lebih padat, radius koneksi antar-node boleh sedikit lebih besar juga supaya jaringan
   garisnya kebaca sebagai satu jaring data yang menyatu, bukan cluster-cluster terpisah.

3. **Pergerakan node = fluktuasi harga, bukan gerak acak murni.** Tiap node bergerak
   dengan drift halus vertikal (naik-turun seperti candle bergerak) dikombinasikan drift
   horizontal lambat. Kecepatan pelan (ini bukan efek "wow" heboh, ini ambience premium
   yang tidak boleh mengganggu keterbacaan headline) — kepadatan boleh tinggi, tapi
   kecepatan gerak tetap pelan supaya tidak norak/berisik secara visual.

4. **Interaksi cursor = efek "spike volume".** Saat cursor mendekati sebuah node, node
   itu sedikit membesar dan garis koneksinya menguat sesaat (seperti candle yang tiba-tiba
   naik volume), lalu kembali normal — bukan node yang "kabur menghindar" atau efek magnet
   biasa. Dijelaskan dalam komentar kode sebagai metafora "volume spike".

5. **Occasional "signal flash".** Sangat sesekali (interval acak, jangan sering—biar
   tidak norak), satu node berkedip terang sesaat lalu memancarkan garis tipis ke 2-3 node
   terdekatnya sebelum meredup — merepresentasikan "sinyal trading masuk". Ini detail
   signature yang menghubungkan animasi ke identitas bisnis, jangan dihilangkan.

**Batasan teknis wajib:**
- Canvas full-bleed di belakang Hero Section saja (bukan di seluruh halaman/section
  lain) — section lain harus tetap tenang secara visual supaya fokus pembaca ke copy.
- Density node menyesuaikan lebar layar: mobile tetap harus terasa "padat" relatif ke
  layarnya, tapi jumlah absolut node dikurangi proporsional dari desktop supaya perf
  tetap wajar (jangan render jumlah node desktop mentah-mentah di layar kecil).
- Pakai `requestAnimationFrame`, pause render (`cancelAnimationFrame`) saat tab tidak
  aktif (`visibilitychange`) atau saat Hero Section di luar viewport
  (`IntersectionObserver`) — ini makin penting justru karena node-nya lebih banyak, biar
  gak makan baterai/CPU pas user sudah scroll jauh ke bawah.
- Hormati preferensi aksesibilitas: kalau `prefers-reduced-motion: reduce` aktif, animasi
  jadi statis (render satu frame node+garis diam, tanpa loop) — jangan matikan total jadi
  kosong.
- Kontras teks headline di atas canvas tetap harus lulus keterbacaan (tambahkan gradient
  overlay gelap tipis di belakang blok teks jika perlu, jangan biarkan garis partikel
  menembus tepat di atas huruf headline) — ini makin krusial dengan density node yang
  lebih tinggi.

## FITUR WAJIB: ADMIN PANEL & ASSET MANAGEMENT (SUPABASE)
Ganti total pendekatan lama (folder lokal `/assets/proof/...` + JSON manifest statis).
Semua asset (testimoni, hasil TP, winrate, foto analyst) sekarang **fully
database-driven** lewat Supabase — gambar disimpan di Supabase Storage, metadata
(caption, kategori, urutan tampil) disimpan di Supabase Database, dan semuanya diedit
lewat halaman admin terpisah, bukan edit file manual.

### 1. Struktur data Supabase
Buat skema berikut (tulis sebagai SQL migration file, `supabase/schema.sql`):

**Storage bucket**: `proof-assets` (public read).

**Table `assets`**:
```sql
create table assets (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('testimoni', 'hasil-tp', 'winrate', 'analyst')),
  file_url text not null,
  caption text default '',
  display_order integer not null default 0,
  created_at timestamptz default now()
);

-- RLS: publik cuma boleh baca, tulis/hapus hanya lewat server (service role)
alter table assets enable row level security;
create policy "public read" on assets for select using (true);
```
Insert/update/delete TIDAK dibuka untuk anon key — semua operasi tulis harus lewat
serverless function yang pakai service role key (lihat bagian Admin Panel di bawah),
supaya orang lain gak bisa iseng nulis langsung ke database dari browser.

### 2. Halaman Admin (`/admin.html` atau `/admin/index.html`)
Halaman terpisah, tidak boleh ke-index search engine (tambahkan `<meta name="robots"
content="noindex, nofollow">` dan larang di `robots.txt`).

- **Login**: form password sederhana (bukan Supabase Auth, cukup satu password admin).
  Password TIDAK boleh di-hardcode di JS client-side. Alurnya:
  1. Admin isi password di form → dikirim via `fetch POST` ke serverless function
     `/api/admin-login`.
  2. Function ini bandingkan input dengan env var `ADMIN_PASSWORD` (server-side only,
     tidak pernah dikirim ke browser).
  3. Kalau cocok, function balikin token sesi sederhana (misal signed token pakai HMAC
     dengan secret dari env var, expiry beberapa jam) → disimpan di `sessionStorage`
     browser admin.
  4. Semua request admin selanjutnya (upload/edit/hapus) sertakan token ini di header,
     divalidasi ulang di tiap serverless function sebelum eksekusi.
- **Dashboard admin** setelah login, tab per kategori (`testimoni`, `hasil-tp`,
  `winrate`, `analyst`):
  - Upload gambar baru (drag-drop atau file picker) + input caption + pilih kategori →
    kirim ke `/api/admin-upload` (serverless function, pakai `SUPABASE_SERVICE_ROLE_KEY`
    di server untuk upload ke Storage bucket & insert row ke table `assets`).
  - List asset existing per kategori, bisa edit caption, drag-to-reorder
    (`display_order`), dan hapus (hapus file di Storage + row di table sekaligus).
  - Semua aksi tulis lewat serverless function yang sama pola validasinya (cek token
    sesi dulu sebelum eksekusi apapun ke Supabase).
- UI admin cukup fungsional & rapi, gak perlu semewah landing page publik — prioritas
  kecepatan kerja buat saya sendiri, bukan estetika.

### 3. Serverless functions (folder `/api/`)
Karena landing page tetap single-file HTML/CSS/JS tanpa build tools, tapi admin panel
butuh operasi server-side yang aman, buat folder `/api/` berisi beberapa Node serverless
function kecil (kompatibel Vercel, auto-detect tanpa perlu config framework):
- `api/admin-login.js` — validasi password, keluarkan token sesi.
- `api/admin-upload.js` — validasi token, upload file ke Supabase Storage, insert row.
- `api/admin-asset.js` — validasi token, handle update caption/order & delete (bisa satu
  file dengan method GET/PATCH/DELETE, atau dipecah kalau lebih rapi).

Env var yang dibutuhkan (didaftarkan sebagai `<!-- TODO: isi di Vercel env vars -->` di
komentar kode, JANGAN di-hardcode):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
SESSION_SECRET=
```

### 4. Landing page (publik) fetch asset dari Supabase
- Landing page fetch data pakai `SUPABASE_URL` + `SUPABASE_ANON_KEY` (public, aman
  di-expose di client karena RLS cuma izinkan select) via Supabase JS client (load dari
  CDN, `@supabase/supabase-js`).
- Query per kategori, urutkan berdasarkan `display_order`, render galeri dinamis ke
  section yang relevan (lihat pemetaan section di bawah).
- Kalau hasil query kosong untuk satu kategori, section-nya tampilkan state kosong yang
  rapi (misal "Segera ditambahkan"), JANGAN broken layout atau kotak kosong aneh.
- Galeri harus punya lightbox sederhana (klik gambar → zoom, bukan buka tab baru) biar
  screenshot testimoni/TP kebaca jelas di HP.
- Alt text gambar ambil dari field `caption`, fallback ke nama kategori kalau caption
  kosong.

## STRUKTUR HALAMAN

### 1. Hero Section
- Animasi "Market Pulse" (lihat spesifikasi di atas) sebagai background.
- Headline yang agitasi masalah target market: kebanyakan trader ritel loss karena
  keputusan emosional/tanpa data, bukan karena "kurang modal".
- Sub-headline: solusi = sinyal harian dari analyst berpengalaman + komunitas Discord
  aktif.
- CTA utama: tombol besar "Join Discord Sekarang" → link
  `https://discord.gg/msJHhqFRCK`.
- Trust badge kecil: "Bukan ajakan investasi. Data historis bukan jaminan hasil ke depan."
  (disclaimer wajib, taruh kecil tapi tetap kebaca, JANGAN disembunyikan total).

### 2. Problem/Agitation Section
Bahas pain point target audience (kebanyakan noise info saham, FOMO, tidak ada sistem,
takut ambil keputusan sendiri) sebelum masuk ke solusi.

### 3. Apa yang Didapat (Fitur Harian)
Highlight 5 menu sinyal harian sebagai kartu/list dengan ikon custom (bukan stock icon
polos):
- Swing Trading
- Valid Buy — **JANGAN tulis klaim angka winrate apapun secara hardcoded di teks**
  (jangan "100%", jangan angka rekaan lain). Cukup tulis copy netral seperti "Track
  record kami transparan, lihat sendiri buktinya di bawah 👇" dan arahkan visual ke
  galeri kategori `winrate` (dari Supabase). Biarkan gambar/screenshot yang bicara.
- Day Trade
- Live Trade / Scalping
- BSJP (Beli Sore Jual Pagi)

### 4. Bukti Sosial — Testimoni & Hasil TP
Section grid yang narik data dari Supabase kategori `testimoni` dan `hasil-tp`. Render
sebagai galeri dinamis, lengkap dengan lightbox. JANGAN generate testimoni fiktif atau
screenshot palsu — semua sumbernya dari data yang saya input sendiri lewat admin panel.

### 5. Kredibilitas — Analyst & Edukasi
- Section soal analyst berpengalaman — foto ditarik dari Supabase kategori `analyst`.
  Kalau kategori masih kosong, tampilkan silhouette/placeholder avatar generik yang
  tetap terlihat rapi (bukan broken image icon).
- Poin: selain sinyal, member dapat materi edukasi saham dan konsultasi portofolio
  privat. Framing ini sebagai value tambahan yang membedakan dari "sekadar grup sinyal".

### 6. Pricing — Perbandingan Paket
Reproduksi 2 paket, redesign layout-nya biar tidak keliatan copy langsung dari gambar
sumber — buat versi web-native yang lebih clean dan scannable. Tombol pricing card juga
mengarah ke `https://discord.gg/msJHhqFRCK` (kalau belum ada sistem pembayaran terpisah,
join Discord dulu jadi entry point utama).

**Premium** — anchor pricing (harga coret Rp500.000 → Rp230.000/bulan)
Fitur: Diskusi Umum, Kalkulator Keuntungan Saham, Basic Buku Materi Saham, Media Sharing
Pembelajaran Saham, Berita Up to Date by Bot, Giveaway Random Bulanan, Random Stockpick,
Voice Arahan Trading, Bot Media Saham Autopost, Stockpick (swing/BSJP/daytrade/live
scalping), Rekomendasi Trading Harian, Insight Index/IHSG harian, Analisis IPO Hunter
(badge NEW), Analisa FCA (badge NEW), Analisa Right Issue (badge NEW).
Tidak termasuk: Bedah Emiten, Konsultasi Porto, Bot Alarm Trigger Price, Request Analisis
Teknikal/Fundamental — tampilkan sebagai X, tapi framing halus sebagai "upgrade ke
Platinum buat ini".

**Platinum** — Rp850.000/bulan
Semua fitur Premium + Bedah Emiten, Konsultasi Porto, Bot Alarm Trigger Price, Request
Analisis Teknikal/Fundamental. Posisikan sebagai paket "serius/full-service".

Gunakan psikologi anchoring: taruh Platinum di kanan dengan badge "Paling
Direkomendasikan" — bikin mata tertarik ke situ dulu, lalu Premium jadi terasa "value
pick" yang lebih murah.

### 7. FAQ
Jawab keberatan umum: "Ini bukan judi kan?", "Kalau signal loss gimana?", "Bisa cancel
kapan aja?", "Gimana cara masuk Discord setelah bayar?". Framing jujur, bukan defensif.

### 8. CTA Akhir + Footer
- CTA terakhir sebelum footer: ulangi tombol "Join Discord Sekarang" →
  `https://discord.gg/msJHhqFRCK`.
- Footer: disclaimer risiko trading, bukan rekomendasi resmi OJK/lembaga keuangan,
  kontak, copyright.

## SEO
- Title tag & meta description fokus keyword: "sinyal saham harian", "rekomendasi saham
  Indonesia", "membership trading saham", "grup sinyal saham terpercaya".
- Gunakan heading hierarchy semantik (satu H1 di hero, H2 per section).
- Alt text deskriptif di semua gambar (ambil dari `caption` di Supabase kalau ada,
  fallback ke nama kategori kalau caption kosong).
- Open Graph tags untuk share di sosmed.
- Schema markup Product/Service kalau relevan.
- Halaman `/admin.html` WAJIB `noindex, nofollow`, dikecualikan dari sitemap.

## TEKNIS
- Landing page: single file HTML utama, Tailwind via CDN, vanilla JS untuk interaksi
  (smooth scroll, count-up angka non-winrate seperti jumlah member, mobile nav toggle,
  lightbox galeri, animasi Market Pulse canvas, fetch + render dari Supabase).
- Admin panel: file terpisah, boleh sedikit lebih banyak JS karena ada CRUD, tapi tetap
  vanilla JS (tanpa framework/build tools).
- Backend: serverless functions minimal di folder `/api/` (kompatibel Vercel), HANYA
  untuk operasi yang butuh service role key (login admin, upload, edit, delete asset).
- Fully responsive (mobile-first — asumsikan mayoritas traffic dari HP).
- Ringan & cepat load — jangan pakai library berat yang tidak perlu (termasuk untuk
  animasi partikel — native canvas, bukan library eksternal).
- Semua placeholder yang masih perlu diisi manual (misal `ADMIN_PASSWORD`, Supabase
  keys) ditandai jelas dengan komentar `<!-- TODO: isi di environment variables -->`.

## DELIVERABLE TAMBAHAN — DOKUMENTASI DEPLOY
Selain kode project, buatkan satu file dokumentasi terpisah `DEPLOY.md` di root project,
ditulis untuk pembaca non-teknis (saya sendiri), berisi panduan step-by-step dari nol
sampai project ini live di internet. Minimal cakup bagian berikut, urut sesuai alur
kerja sebenarnya:

1. **Setup Supabase**: buat project baru, cara jalankan `supabase/schema.sql` (lewat
   SQL Editor di dashboard Supabase), cara buat Storage bucket `proof-assets` dan set
   public read, cara ambil `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan
   `SUPABASE_SERVICE_ROLE_KEY` dari dashboard (jelaskan juga kenapa service role key
   TIDAK BOLEH bocor ke publik/commit ke Git).
2. **Setup GitHub**: cara push project ini ke repo GitHub baru dari nol (asumsikan saya
   belum familiar `git init`/`git remote`/`git push`), termasuk `.gitignore` yang benar
   supaya file sensitif (kalau ada `.env` lokal) tidak ikut ke-push.
3. **Setup Vercel**: cara connect repo GitHub ke Vercel, cara isi Environment Variables
   di dashboard Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PASSWORD`, `SESSION_SECRET`) sebelum deploy pertama, cara trigger deploy.
4. **Verifikasi live**: checklist manual setelah deploy — buka landing page, cek animasi
   particle jalan, buka `/admin.html`, coba login, coba upload 1 gambar test, cek
   muncul di landing page.
5. **Update konten rutin**: cara pakai admin panel sehari-hari (upload testimoni baru,
   ubah urutan, hapus) — ini bagian yang paling sering dipakai, tulis paling detail &
   simpel.
6. **Custom domain (opsional)**: cara pasang domain sendiri ke project Vercel kalau saya
   punya domain.
7. **Troubleshooting umum**: minimal 3-5 masalah yang paling mungkin muncul (misal salah
   isi env var, gambar gagal upload, admin gak bisa login) dan cara ceknya.

Gaya bahasa `DEPLOY.md`: langsung ke instruksi, hindari jargon tanpa penjelasan, anggap
pembaca belum pernah deploy project sebelumnya — tapi jangan didikte-dikte banget kayak
manual mesin cuci, tetap ringkas per langkah.
