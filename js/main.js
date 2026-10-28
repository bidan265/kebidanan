import { supabase } from './supabase.js';

const quillBeranda = new Quill('#editorBeranda', { theme: 'snow' });
const quillArtikel = new Quill('#editorArtikel', { theme: 'snow' });

// ==========================================
// 1. LOGIKA AUTENTIKASI ADMIN MODAL
// ==========================================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const btnLogout = document.getElementById('btnLogout');
const loginMessage = document.getElementById('loginMessage');

async function checkAuthSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = "Sedang memverifikasi...";
    loginMessage.classList.remove('hidden');
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        loginMessage.textContent = "Gagal login: Periksa email & password Anda.";
    } else {
        loginMessage.classList.add('hidden');
        e.target.reset();
        checkAuthSession();
    }
});

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkAuthSession();
});

// ==========================================
// 2. RENDER UI KE HALAMAN PENGUNJUNG
// ==========================================

// A. BERANDA (UI: Teks & Gambar responsif, Line-clamp)
async function fetchBeranda() {
    const container = document.getElementById('konten-profil-container');
    const { data } = await supabase.from('konten_beranda').select('*').order('created_at', { ascending: true });

    if (!data || data.length === 0) return;

    container.innerHTML = data.map(item => `
        <div class="flex flex-col lg:flex-row items-center gap-8">
            <!-- Teks: Urutan 2 di mobile (bawah gambar), 1 di desktop (kiri) -->
            <div class="w-full lg:w-1/2 order-2 lg:order-1">
                <h3 class="text-2xl font-bold text-slate-800 mb-4">${item.judul}</h3>
                <div id="text-beranda-${item.id}" class="text-slate-600 leading-relaxed text-sm line-clamp-3 transition-all duration-300">
                    ${item.deskripsi}
                </div>
                <button onclick="toggleText('text-beranda-${item.id}', this)" class="mt-2 text-brand-600 font-bold text-xs hover:underline flex items-center gap-1">
                    Lihat Selengkapnya <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            
            <!-- Gambar: Urutan 1 di mobile (atas teks), 2 di desktop (kanan) -->
            ${item.gambar_url ? `
            <div class="w-full lg:w-1/2 order-1 lg:order-2">
                <div class="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100">
                    <img src="${item.gambar_url}" alt="${item.judul}" class="w-full h-64 lg:h-80 object-cover">
                    ${item.caption_gambar ? `
                    <div class="absolute bottom-0 w-full bg-gradient-to-t from-black/80 p-4">
                        <p class="text-white text-sm font-medium">${item.caption_gambar}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}
        </div>
    `).join('');
}

// Global function untuk Line-clamp
window.toggleText = function(id, btn) {
    const el = document.getElementById(id);
    if (el.classList.contains('line-clamp-3')) {
        el.classList.remove('line-clamp-3');
        btn.innerHTML = 'Tutup Teks <i class="fas fa-chevron-up"></i>';
    } else {
        el.classList.add('line-clamp-3');
        btn.innerHTML = 'Lihat Selengkapnya <i class="fas fa-chevron-down"></i>';
    }
}

// B. TIM & ANGGOTA (UI: Grid, Foto Bulat, Default Avatar)
async function fetchAnggota() {
    const container = document.getElementById('konten-anggota');
    const { data } = await supabase.from('konten_anggota').select('*').order('created_at', { ascending: true });

    if (!data || data.length === 0) return;

    container.innerHTML = data.map(item => {
        // Logika Default Avatar UI-Avatars
        const avatarUrl = item.foto_url ? item.foto_url : `https://ui-avatars.com/api/?background=22c55e&color=fff&size=150&name=${encodeURIComponent(item.nama)}`;
        return `
        <div class="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
            <img src="${avatarUrl}" alt="${item.nama}" class="w-28 h-28 rounded-full mx-auto object-cover border-4 border-brand-100 shadow-sm mb-4">
            <h4 class="font-bold text-slate-800 text-lg">${item.nama}</h4>
            <p class="text-sm text-brand-600 font-medium">${item.keahlian}</p>
        </div>`
    }).join('');
}

// C. MATERI KEBIDANAN & UMUM (UI: Tab & Cards)
let allMateri = [];
async function fetchMateri() {
    const { data } = await supabase.from('konten_materi').select('*').order('created_at', { ascending: false });
    allMateri = data || [];
    renderMateriKebidanan('anc'); // Render default tab
    renderMateriUmum();
}

function renderMateriKebidanan(activeSub) {
    const tabContainer = document.getElementById('materi-tab-buttons');
    const contentContainer = document.getElementById('konten-materi-kebidanan');

    const tabs = [
        { key: 'anc', label: '1.a ANC' }, { key: 'inc', label: '1.b INC' },
        { key: 'pnc', label: '1.c PNC' }, { key: 'kehamilan_sehat', label: '2. Kehamilan Sehat' }
    ];

    tabContainer.innerHTML = tabs.map(t => `
        <button onclick="switchMateriTab('${t.key}')" 
            class="px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${activeSub === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}">
            ${t.label}
        </button>
    `).join('');

    const filtered = allMateri.filter(item => item.kategori_utama === 'kebidanan' && item.sub_kategori === activeSub);
    
    if (filtered.length === 0) {
        contentContainer.innerHTML = `<p class="text-center text-slate-500 py-8">Materi belum tersedia di kategori ini.</p>`;
        return;
    }

    contentContainer.innerHTML = filtered.map(item => {
        const poinList = item.list_poin ? item.list_poin.split('\n') : [];
        return `
        <div class="bg-white rounded-2xl p-6 lg:p-8 shadow border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 items-center">
            <div class="${item.gambar_url ? 'md:w-1/2' : 'w-full'}">
                ${item.badge_label ? `<span class="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full">${item.badge_label}</span>` : ''}
                <h3 class="text-2xl font-bold text-slate-900 mt-3 mb-3">${item.judul}</h3>
                <p class="text-slate-600 text-sm mb-4">${item.deskripsi || ''}</p>
                ${poinList.length > 0 ? `
                <ul class="space-y-2 text-sm text-slate-700">
                    ${poinList.map(poin => `<li class="flex gap-2 items-start"><i class="fas fa-check-circle text-brand-500 mt-1"></i> <span>${poin}</span></li>`).join('')}
                </ul>` : ''}
            </div>
            ${item.gambar_url ? `
            <div class="w-full md:w-1/2">
                <img src="${item.gambar_url}" alt="${item.judul}" class="rounded-xl shadow w-full h-64 object-cover border border-slate-100">
            </div>` : ''}
        </div>`
    }).join('');
}

window.switchMateriTab = function(key) { renderMateriKebidanan(key); }

function renderMateriUmum() {
    const container = document.getElementById('konten-materi-umum');
    const filtered = allMateri.filter(item => item.kategori_utama === 'umum');
    
    if (filtered.length === 0) return;

    container.innerHTML = filtered.map(item => `
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group flex flex-col h-full">
            ${item.gambar_url ? `<img src="${item.gambar_url}" class="w-full h-48 object-cover">` : ''}
            <div class="p-5 flex flex-col flex-grow">
                ${item.badge_label ? `<span class="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-1 rounded w-max uppercase">${item.badge_label}</span>` : ''}
                <h3 class="font-bold text-slate-800 text-lg mt-3">${item.judul}</h3>
                <p class="text-slate-600 text-sm mt-2 line-clamp-3 mb-4">${item.deskripsi || ''}</p>
                
                <div class="mt-auto pt-4 border-t border-slate-100">
                    <!-- Tombol ini memicu fungsi bacaArtikelLengkap() -->
                    ${item.isi_artikel ? `
                    <button onclick="bacaArtikelLengkap('${item.id}')" class="text-brand-600 font-bold text-sm hover:text-brand-800 flex items-center gap-1">
                        Baca Artikel Lengkap <i class="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
                    </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// D. GALERI (UI: Grid Foto/Video)
async function fetchGaleri() {
    const container = document.getElementById('konten-galeri');
    const { data } = await supabase.from('konten_galeri').select('*').order('created_at', { ascending: false });

    if (!data || data.length === 0) return;

    container.innerHTML = data.map(item => `
        <div class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-slate-200 relative group">
            ${item.tipe === 'video' 
                ? `<video src="${item.media_url}" class="w-full h-56 object-cover" controls></video>`
                : `<img src="${item.media_url}" class="w-full h-56 object-cover">`
            }
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent p-4 opacity-0 group-hover:opacity-100 transition">
                <p class="text-white font-bold text-sm">${item.judul}</p>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. HELPER & SUBMIT HANDLERS (CMS)
// ==========================================
async function uploadToSupabase(fileInput, folderName) {
    const file = fileInput.files[0];
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    const { error } = await supabase.storage.from('media_web').upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from('media_web').getPublicUrl(filePath);
    return data.publicUrl;
}

// Event Listeners Submit Forms
const handleFormSubmit = async (e, table, getPayload, refreshUI) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const oriText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const payload = await getPayload();
        const { error } = await supabase.from(table).insert([payload]);
        if (error) throw error;
        
        alert('Data berhasil disimpan!');
        e.target.reset();
        if(table === 'konten_beranda') quillBeranda.root.innerHTML = '';
        refreshUI();
    } catch (err) {
        alert('Gagal menyimpan: ' + err.message);
    } finally {
        btn.innerHTML = oriText;
        btn.disabled = false;
    }
};

document.getElementById('formBeranda').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_beranda', async () => ({
    judul: document.getElementById('judulBeranda').value,
    deskripsi: quillBeranda.root.innerHTML,
    caption_gambar: document.getElementById('captionBeranda').value,
    gambar_url: await uploadToSupabase(document.getElementById('gambarBeranda'), 'beranda')
}), fetchBeranda));

document.getElementById('formAnggota').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_anggota', async () => ({
    nama: document.getElementById('namaAnggota').value,
    keahlian: document.getElementById('keahlianAnggota').value,
    foto_url: await uploadToSupabase(document.getElementById('fotoAnggota'), 'anggota')
}), fetchAnggota));

document.getElementById('formMateri').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_materi', async () => {
    const kategori = document.getElementById('kategoriUtama').value;
    
    return {
        kategori_utama: kategori,
        sub_kategori: document.getElementById('subKategori').value,
        badge_label: document.getElementById('badgeLabel').value,
        judul: document.getElementById('judulMateri').value,
        deskripsi: document.getElementById('deskripsiMateri').value,
        // Jika B (Kebidanan) ambil dari textarea List Poin, isi_artikel diset null
        list_poin: kategori === 'kebidanan' ? document.getElementById('listPoinMateri').value : null,
        // Jika C (Umum) ambil dari Editor Artikel Quill, list_poin diset null
        isi_artikel: kategori === 'umum' ? quillArtikel.root.innerHTML : null,
        gambar_url: await uploadToSupabase(document.getElementById('gambarMateri'), 'materi')
    }
}, () => { 
    // Reset Data Setelah Berhasil Simpan
    quillArtikel.root.innerHTML = ''; 
    fetchMateri(); 
}));

document.getElementById('formGaleri').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_galeri', async () => ({
    tipe: document.getElementById('tipeGaleri').value,
    judul: document.getElementById('judulGaleri').value,
    media_url: await uploadToSupabase(document.getElementById('mediaGaleri'), 'galeri')
}), fetchGaleri));

// ==========================================
// 4. INIT LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    fetchBeranda();
    fetchAnggota();
    fetchMateri();
    fetchGaleri();
});

// Fungsi untuk merubah isi form secara dinamis B / C
window.toggleFormMateri = function() {
    const kat = document.getElementById('kategoriUtama').value;
    const sub = document.getElementById('subKategori');
    const fieldKebidanan = document.getElementById('fieldsKebidanan');
    const fieldUmum = document.getElementById('fieldsUmum');

    if(kat === 'kebidanan') {
        // Tampilkan Form B (List Poin) & Sembunyikan Form C
        sub.innerHTML = '<option value="anc">1.a ANC</option><option value="inc">1.b INC</option><option value="pnc">1.c PNC</option><option value="kehamilan_sehat">2. Kehamilan Sehat</option>';
        fieldKebidanan.classList.remove('hidden');
        fieldUmum.classList.add('hidden');
    } else {
        // Tampilkan Form C (Artikel Lengkap Quill) & Sembunyikan Form B
        sub.innerHTML = '<option value="kesehatan">a. Kesehatan Ibu</option><option value="gizi">b. Gizi & Nutrisi</option>';
        fieldKebidanan.classList.add('hidden');
        fieldUmum.classList.remove('hidden');
    }
}

// Jalankan saat web pertama di-load
document.addEventListener('DOMContentLoaded', () => {
    toggleFormMateri();
});

// Logika untuk merender artikel full page
window.bacaArtikelLengkap = function(id) {
    console.log("Klik terdeteksi! Mencari artikel dengan ID:", id);

    // PERBAIKAN: Gunakan String() untuk menyamakan tipe data antara database dan HTML
    const item = allMateri.find(m => String(m.id) === String(id));
    
    if(!item) {
        console.error("Gagal memuat: ID Artikel tidak ditemukan di dalam memori!");
        return; 
    }

    console.log("Artikel berhasil ditemukan:", item.judul);

    document.getElementById('articleContent').innerHTML = `
        ${item.badge_label ? `<span class="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full mb-4 inline-block">${item.badge_label}</span>` : ''}
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">${item.judul}</h1>
        ${item.gambar_url ? `<img src="${item.gambar_url}" class="w-full h-64 md:h-[400px] object-cover rounded-2xl mb-8 shadow-sm border border-slate-100">` : ''}
        
        <!-- Teks Artikel (Menggunakan styling bawaan teks editor) -->
        <div class="text-slate-700 leading-relaxed text-base space-y-4">
            ${item.isi_artikel}
        </div>
    `;
    
    // Tampilkan Modal & Kunci Scroll Background
    document.getElementById('articleModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

window.tutupArtikel = function() {
    // Tutup Modal & Kembalikan Scroll Background
    document.getElementById('articleModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}