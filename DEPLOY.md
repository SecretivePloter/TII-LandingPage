# Panduan Deploy — Trading Insights Indonesia

Panduan ini nganter kamu dari nol sampai website live di internet, plus cara pakai admin
panel sehari-hari. Ikuti urut dari atas. Kamu nggak perlu bisa coding — cukup teliti
copy-paste beberapa kunci ke tempat yang benar.

**Gambaran besarnya:** ada 3 layanan yang saling nyambung.

| Layanan  | Fungsinya                                        | Biaya         |
|----------|--------------------------------------------------|---------------|
| Supabase | Nyimpen gambar bukti + datanya (database)        | Gratis cukup  |
| GitHub   | Nyimpen kode website-nya                          | Gratis        |
| Vercel   | Bikin website-nya online & kasih alamat internet | Gratis cukup  |

Sisihkan ~30–45 menit untuk setup pertama. Setelah live, update konten cuma butuh 1 menit
lewat admin panel.

---

## 1. Setup Supabase (database + tempat gambar)

### 1a. Buat project
1. Buka **https://supabase.com** → **Start your project** → daftar (paling gampang pakai
   akun GitHub, sekalian buat langkah 2).
2. Klik **New project**.
   - **Name**: `trading-insights` (bebas).
   - **Database Password**: bikin password kuat, **simpan** di tempat aman (jarang dipakai,
     tapi jangan sampai hilang).
   - **Region**: pilih **Southeast Asia (Singapore)** — paling dekat, paling ngebut buat user Indonesia.
3. Klik **Create new project**. Tunggu 1–2 menit sampai statusnya hijau/siap.

### 1b. Jalankan skema database
1. Di sidebar kiri Supabase, klik **SQL Editor** → **New query**.
2. Buka file `supabase/schema.sql` di project ini, **copy semua isinya**, paste ke editor.
3. Klik **Run** (atau `Ctrl/Cmd + Enter`). Kalau muncul "Success. No rows returned",
   berarti tabel `assets` sudah jadi. 👍

### 1c. Buat tempat penyimpanan gambar (Storage bucket)
1. Sidebar kiri → **Storage** → **New bucket**.
2. **Name**: ketik persis `proof-assets` (huruf kecil semua, pakai strip). **Salah nama =
   gambar nggak akan muncul.**
3. **Centang "Public bucket"** — ini penting supaya gambar bisa tampil di landing page.
4. **Create bucket**.

### 1d. Ambil 3 kunci penting
Sidebar kiri → **Project Settings** (ikon gerigi) → **API**. Kamu butuh 3 nilai (catat
sementara di Notepad, nanti dipindah ke Vercel):

- **Project URL** → ini `SUPABASE_URL`
  (bentuknya `https://xxxxx.supabase.co`)
- **anon / public key** → ini `SUPABASE_ANON_KEY`
  (key panjang, aman dipakai publik — cuma bisa baca data)
- **service_role key** → ini `SUPABASE_SERVICE_ROLE_KEY`
  (klik "Reveal" dulu untuk melihatnya)

> ⚠️ **service_role key itu kunci master.** Siapa pun yang pegang key ini bisa hapus/ubah
> seluruh data kamu. **JANGAN pernah** kirim ke orang, tempel di chat, atau commit ke Git.
> Key ini cuma boleh hidup di pengaturan Vercel (langkah 3). File `.gitignore` di project
> sudah otomatis mencegah file `.env` ikut ke-upload, jadi aman selama kamu nggak nempel
> key-nya langsung ke dalam kode.

---

## 2. Setup GitHub (nyimpen kode)

Kalau kamu belum pernah pakai `git`, cara paling gampang lewat website + GitHub Desktop:

### Cara mudah (GitHub Desktop, tanpa terminal)
1. Buka **https://github.com** → login/daftar.
2. Pojok kanan atas **+** → **New repository**.
   - **Repository name**: `trading-insights-indonesia`.
   - Pilih **Private** (biar kode kamu nggak publik).
   - **JANGAN** centang "Add a README".
   - **Create repository**.
3. Download **GitHub Desktop** dari **https://desktop.github.com**, install, login.
4. Di GitHub Desktop: **File → Add local repository** → arahkan ke folder project ini
   (`TradingInsightIndonesia`). Kalau diminta, klik **create a repository** di sini.
5. Di kotak "Summary" kiri bawah, ketik `Initial commit` → klik **Commit to main**.
6. Klik **Publish repository** di atas → pilih repo `trading-insights-indonesia` yang tadi
   → **Publish**.

Selesai. Kode kamu sekarang aman di GitHub.

> `.gitignore` sudah disiapkan supaya `node_modules/` dan file `.env` (kalau ada) TIDAK
> ikut ter-upload. Jangan hapus file `.gitignore` itu.

### Cara terminal (kalau kamu nyaman pakai command line)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME-KAMU/trading-insights-indonesia.git
git push -u origin main
```

---

## 3. Setup Vercel (bikin website online)

1. Buka **https://vercel.com** → **Sign up** → pilih **Continue with GitHub** (biar
   langsung nyambung ke repo kamu).
2. Di dashboard Vercel: **Add New… → Project**.
3. Cari repo `trading-insights-indonesia` → klik **Import**.
4. **SEBELUM klik Deploy**, buka bagian **Environment Variables**. Masukin 5 variabel ini
   satu per satu (Name di kiri, Value di kanan, lalu **Add**):

   | Name                        | Value                                                        |
   |-----------------------------|-------------------------------------------------------------|
   | `SUPABASE_URL`              | Project URL dari langkah 1d                                  |
   | `SUPABASE_ANON_KEY`         | anon/public key dari langkah 1d                              |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari langkah 1d                             |
   | `ADMIN_PASSWORD`            | password bebas yang kamu mau, buat login ke `/admin.html`   |
   | `SESSION_SECRET`            | teks acak panjang (bikin di bawah)                          |

   **Cara bikin `SESSION_SECRET`:** ini cukup teks acak panjang biar token login aman.
   Gampangnya ketik asal 40+ karakter campur huruf-angka, atau buka
   **https://www.uuidgenerator.net** dan gabung 2 hasilnya. Contoh:
   `7f3a9c1e-...-b2d4` `x8Kq2...`. Nggak perlu diingat, cukup ada.

5. Klik **Deploy**. Tunggu ~1 menit. Kalau muncul konfeti 🎉, website kamu sudah live.
6. Klik **Continue to Dashboard** → **Visit** untuk buka alamatnya
   (bentuknya `https://trading-insights-indonesia-xxxx.vercel.app`).

> Kalau nanti kamu ganti/tambah environment variable, kamu harus **Redeploy** biar
> perubahannya kepakai: tab **Deployments** → titik tiga di deploy terakhir → **Redeploy**.

---

## 4. Verifikasi setelah live (checklist)

Buka alamat Vercel kamu, lalu cek satu-satu:

- [ ] Landing page kebuka, tulisan & warna emas/navy tampil normal.
- [ ] Animasi partikel di bagian atas (Hero) bergerak pelan. Coba gerakin mouse di atasnya —
      titik di dekat kursor sedikit membesar.
- [ ] Section "Bukti" masih kosong dan menampilkan tulisan "segera ditambahkan" (wajar,
      belum ada gambar) — **bukan** kotak rusak.
- [ ] Buka `/admin.html` (tambahkan `/admin.html` di belakang alamat Vercel kamu).
- [ ] Masukin `ADMIN_PASSWORD` → berhasil masuk dashboard.
- [ ] Upload 1 gambar tes di tab **Testimoni** → muncul di daftar bawah.
- [ ] Balik ke landing page, refresh, scroll ke **Bukti → Kata Member** → gambar tadi muncul.
- [ ] Klik gambarnya → membesar (lightbox).

Kalau semua ✅, kamu sudah beres. Sisanya tinggal isi konten.

---

## 5. Update konten rutin (bagian yang paling sering dipakai)

Semua update gambar dilakukan di **`/admin.html`** — nggak perlu sentuh kode lagi selamanya.

### Login
1. Buka `https://ALAMAT-KAMU.vercel.app/admin.html`.
2. Masukin password (yang kamu set di `ADMIN_PASSWORD`). Sesi bertahan ~8 jam, habis itu
   login ulang.

### Menambah gambar baru
1. Pilih tab kategori di atas: **Testimoni**, **Hasil TP**, **Winrate**, atau **Analyst**.
2. Klik area putus-putus "Klik atau drag gambar ke sini", pilih gambar (atau tarik file ke situ).
3. (Opsional) isi **Caption** — ini juga jadi teks alt buat SEO & keterangan di lightbox.
4. Klik **Upload**. Muncul "Berhasil diupload ✓" dan gambar langsung nongol di daftar bawah.

   > Batas ukuran ~3MB per gambar. Kalau kegedean, kompres dulu (screenshot HP biasanya
   > aman). Format: JPG, PNG, WEBP, GIF.

### Mengatur urutan tampil
- **Drag** kartu gambar di daftar bawah ke posisi yang kamu mau. Urutan otomatis tersimpan.
  Angka `#0`, `#1`, dst. menunjukkan posisinya. Urutan di admin = urutan di landing page.

### Mengubah caption
- Klik **✎ Edit** di kartu → ketik caption baru → OK.

### Menghapus gambar
- Klik **🗑** di kartu → konfirmasi. Gambar & datanya hilang permanen (dari database dan
  dari storage), dan langsung hilang dari landing page.

**Peta kategori ke section landing page:**
- `testimoni` → Bukti Sosial → "Kata Member"
- `hasil-tp` → Bukti Sosial → "Hasil Take Profit"
- `winrate` → Bukti Sosial → "Track Record & Winrate"
- `analyst` → Kredibilitas → foto analyst

---

## 6. Pasang domain sendiri (opsional)

Kalau kamu punya domain (misal `tradinginsights.id`):

1. Di dashboard Vercel → pilih project → tab **Settings → Domains**.
2. Ketik domain kamu → **Add**.
3. Vercel kasih instruksi DNS (biasanya satu **A record** atau **CNAME**). Buka tempat kamu
   beli domain (Niagahoster, GoDaddy, Cloudflare, dll.) → menu DNS → tambahin sesuai yang
   Vercel kasih.
4. Tunggu (bisa beberapa menit sampai beberapa jam) sampai Vercel bilang domainnya **Valid**.

Setelah domain aktif, update 2 hal biar SEO rapi:
- File `sitemap.xml` dan tag `<link rel="canonical">` + Open Graph di `index.html`: ganti
  `https://DOMAIN-KAMU.vercel.app` dengan domain baru kamu, lalu commit & push (Vercel
  auto-deploy ulang).

---

## 7. Troubleshooting (masalah yang paling sering muncul)

**Gambar nggak muncul di landing page, cuma "segera ditambahkan".**
- Cek nama bucket Supabase persis `proof-assets` (langkah 1c). Salah satu huruf pun bikin gagal.
- Cek bucket-nya **Public**. Buka Storage → bucket → Settings → pastikan public.
- Cek `SUPABASE_URL` & `SUPABASE_ANON_KEY` di Vercel benar & sudah **Redeploy** setelah diisi.

**Admin nggak bisa login ("Password salah") padahal yakin benar.**
- `ADMIN_PASSWORD` di Vercel mungkin ada spasi nyelip di depan/belakang. Hapus, isi ulang, Redeploy.
- Pastikan kamu sudah **Redeploy** setelah pertama kali mengisi env var — sebelum itu, env
  var belum kepakai.

**Upload gambar gagal / error.**
- File > 3MB → kompres dulu. Ini batas teknis serverless, bukan bug.
- "Server belum dikonfigurasi" → `SUPABASE_SERVICE_ROLE_KEY` belum diisi di Vercel, atau
  belum Redeploy. Isi (langkah 1d & 3), lalu Redeploy.

**Login admin tiba-tiba minta login lagi.**
- Normal. Sesi cuma ~8 jam. Login ulang aja.

**Sudah ganti env var tapi nggak ada efek.**
- Env var baru cuma kepakai setelah **Redeploy**. Deployments → titik tiga → Redeploy.

**Halaman `/admin.html` muncul di Google.**
- Sudah dicegah lewat `noindex` + `robots.txt`. Kalau terlanjur ke-index dari deploy awal,
  butuh beberapa hari sampai Google membuangnya sendiri. Jangan sebar link admin-nya.

---

Kalau mentok di langkah mana pun, catat pesan error persisnya (screenshot) — itu biasanya
langsung nunjuk penyebabnya di daftar troubleshooting di atas.
