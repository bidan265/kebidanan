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
// HELPER: REFRESH AOS UNTUK DATA DINAMIS
// ==========================================
window.refreshAOS = function() {
    setTimeout(() => {
        if(typeof AOS !== 'undefined') {
            AOS.refreshHard(); // Minta AOS menghitung ulang elemen baru
            window.dispatchEvent(new Event('scroll')); // Pancing scroll agar animasi langsung jalan
        }
    }, 100);
}

// ==========================================
// 2. RENDER UI KE HALAMAN PENGUNJUNG
// ==========================================

// A. BERANDA
async function fetchBeranda() {
    const container = document.getElementById('konten-profil-container');
    const { data } = await supabase.from('konten_beranda').select('*').order('created_at', { ascending: true });
    if (!data || data.length === 0) return;

    container.innerHTML = data.map(item => `
        <div class="flex flex-col lg:flex-row items-center gap-10" data-aos="fade-up">
            <div class="w-full lg:w-1/2 order-2 lg:order-1">
                <h3 class="text-3xl font-extrabold text-brand-900 mb-4">${item.judul}</h3>
                <div id="text-beranda-${item.id}" class="text-brand-800 leading-relaxed text-sm line-clamp-3 transition-all duration-300">
                    ${item.deskripsi}
                </div>
                <button onclick="toggleText('text-beranda-${item.id}', this)" class="mt-3 text-brand-500 font-bold text-sm hover:text-brand-600 flex items-center gap-2 bg-brand-100 hover:bg-brand-200 px-4 py-1.5 rounded-full w-fit transition">
                    Lihat Selengkapnya <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            
            ${item.gambar_url ? `
            <div class="w-full lg:w-1/2 order-1 lg:order-2">
                <div class="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-200/50 border-4 border-white">
                    <img src="${item.gambar_url}" alt="${item.judul}" class="w-full h-64 lg:h-[350px] object-cover">
                    ${item.caption_gambar ? `
                    <div class="absolute bottom-0 w-full bg-gradient-to-t from-brand-900/90 to-transparent p-6 pt-12">
                        <p class="text-white text-sm font-medium drop-shadow-md">${item.caption_gambar}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}
        </div>
    `).join('');
    
    window.refreshAOS();
}

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

// B. TIM & ANGGOTA 
async function fetchAnggota() {
    const container = document.getElementById('konten-anggota');
    const { data } = await supabase.from('konten_anggota').select('*').order('created_at', { ascending: true });
    if (!data || data.length === 0) return;

    container.innerHTML = data.map((item, index) => {
        const delay = (index % 4) * 100;
        const avatarUrl = item.foto_url ? item.foto_url : `https://ui-avatars.com/api/?background=27AED2&color=fff&size=150&name=${encodeURIComponent(item.nama)}`;
        return `
        <div data-aos="zoom-in" data-aos-delay="${delay}" class="bg-gradient-to-b from-white to-brand-50 border border-brand-200 rounded-3xl p-4 lg:p-6 text-center shadow-lg shadow-brand-100 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div class="w-24 h-24 lg:w-32 lg:h-32 mx-auto rounded-full p-1 lg:p-1.5 bg-gradient-to-tr from-brand-400 to-brand-600 mb-3 lg:mb-5 shadow-md">
                <img src="${avatarUrl}" alt="${item.nama}" class="w-full h-full rounded-full object-cover border-[3px] border-white">
            </div>
            <h4 class="font-extrabold text-brand-900 text-sm lg:text-lg leading-tight">${item.nama}</h4>
            <p class="text-[10px] lg:text-sm text-brand-600 font-semibold mt-1">${item.keahlian}</p>
        </div>`
    }).join('');
    
    window.refreshAOS();
}


// C. DATA MATERI & ARTIKEL UMUM
let allMateri = [];
async function fetchMateri() {
    const { data } = await supabase.from('konten_materi').select('*').order('created_at', { ascending: false });
    allMateri = data || [];
    renderMateriUmum(); 
}

function renderMateriUmum() {
    const container = document.getElementById('konten-materi-umum');
    if(!container) return;

    const filtered = allMateri.filter(item => item.kategori_utama === 'umum');
    if (filtered.length === 0) return;

    container.innerHTML = filtered.map((item, index) => {
        const delay = (index % 3) * 150;
        return `
        <div data-aos="fade-up" data-aos-delay="${delay}" class="bg-gradient-to-b from-white to-brand-50 border border-brand-200 rounded-[2rem] overflow-hidden shadow-lg shadow-brand-100/50 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
            ${item.gambar_url ? `<img src="${item.gambar_url}" class="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500">` : ''}
            <div class="p-6 flex flex-col flex-grow relative bg-white/50 backdrop-blur-sm z-10">
                ${item.badge_label ? `<span class="text-[10px] bg-brand-500 text-white shadow-sm font-extrabold px-3 py-1.5 rounded-full w-max uppercase absolute -top-4 left-6">${item.badge_label}</span>` : ''}
                <h3 class="font-extrabold text-brand-900 text-xl mt-3 leading-snug">${item.judul}</h3>
                <p class="text-brand-700 text-sm mt-3 line-clamp-3 mb-6 font-medium leading-relaxed">${item.deskripsi || ''}</p>
                
                <div class="mt-auto pt-4 border-t border-brand-200/50">
                    ${item.isi_artikel ? `
                    <button onclick="bacaArtikelLengkap('${item.id}')" class="text-brand-600 font-bold text-sm hover:text-brand-800 flex items-center gap-2">
                        Baca Artikel Lengkap <i class="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-2"></i>
                    </button>` : ''}
                </div>
            </div>
        </div>
        `
    }).join('');
    
    window.refreshAOS();
}

// BUKA MATERI KEBIDANAN (Desain Ocean Breeze + Animasi AOS)
window.bukaMateriKebidanan = function(subKategori) {
    const contentContainer = document.getElementById('konten-materi-kebidanan');
    const judulContainer = document.getElementById('judul-kategori-kebidanan');
    
    const labels = {
        'anc': 'Modul 1.a ANC (Antenatal Care)',
        'inc': 'Modul 1.b INC (Intranatal Care)',
        'pnc': 'Modul 1.c PNC (Postnatal Care)',
        'kehamilan_sehat': 'Edukasi 2. Kehamilan Sehat'
    };
    if(judulContainer) {
        judulContainer.innerText = labels[subKategori] || 'Materi Kebidanan';
    }

    const filtered = allMateri.filter(item => item.kategori_utama === 'kebidanan' && item.sub_kategori === subKategori);
    
    if (filtered.length === 0) {
        contentContainer.innerHTML = `<div data-aos="fade-in" class="bg-brand-50 p-8 rounded-3xl text-center text-brand-600 border border-brand-200 font-medium shadow-inner">Belum ada data modul untuk kategori ini.</div>`;
    } else {
        contentContainer.innerHTML = filtered.map((item, index) => {
            const delay = (index % 4) * 100;
            const poinList = item.list_poin ? item.list_poin.split('\n') : [];
            return `
            <div data-aos="fade-up" data-aos-delay="${delay}" class="bg-gradient-to-br from-white to-brand-50 rounded-3xl p-6 lg:p-10 shadow-xl shadow-brand-100/50 border border-brand-200 mb-8 flex flex-col md:flex-row gap-8 items-center group">
                <div class="${item.gambar_url ? 'md:w-1/2' : 'w-full'}">
                    ${item.badge_label ? `<span class="px-4 py-1.5 bg-brand-100 text-brand-800 text-[10px] font-extrabold rounded-full tracking-wider shadow-sm">${item.badge_label}</span>` : ''}
                    <h3 class="text-3xl font-extrabold text-brand-900 mt-4 mb-3 leading-tight">${item.judul}</h3>
                    <p class="text-brand-700 text-sm mb-6 leading-relaxed">${item.deskripsi || ''}</p>
                    ${poinList.length > 0 ? `
                    <ul class="space-y-3 text-sm text-brand-800 font-medium">
                        ${poinList.map(poin => `<li class="flex gap-3 items-start"><i class="fas fa-check-circle text-brand-500 mt-1 text-lg"></i> <span>${poin}</span></li>`).join('')}
                    </ul>` : ''}
                </div>
                ${item.gambar_url ? `
                <div class="w-full md:w-1/2">
                    <img src="${item.gambar_url}" alt="${item.judul}" class="rounded-2xl shadow-lg w-full h-72 object-cover border-4 border-white group-hover:scale-[1.02] transition-transform duration-300">
                </div>` : ''}
            </div>`
        }).join('');
    }

    window.switchPage('materi-kebidanan');
}

// BUKA MODAL ARTIKEL LENGKAP
window.bacaArtikelLengkap = function(id) {
    const item = allMateri.find(m => String(m.id) === String(id));
    if(!item) return; 

    document.getElementById('articleContent').innerHTML = `
        <div data-aos="zoom-in">
            ${item.badge_label ? `<span class="px-4 py-1.5 bg-brand-100 text-brand-800 text-xs font-bold rounded-full mb-6 inline-block">${item.badge_label}</span>` : ''}
            <h1 class="text-3xl md:text-5xl font-extrabold text-brand-900 mb-6 leading-tight">${item.judul}</h1>
            ${item.gambar_url ? `<img src="${item.gambar_url}" class="w-full h-64 md:h-[450px] object-cover rounded-3xl mb-10 shadow-xl shadow-brand-200/50">` : ''}
            
            <div class="text-slate-700 leading-loose text-lg space-y-6">
                ${item.isi_artikel}
            </div>
        </div>
    `;
    
    document.getElementById('articleModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    window.refreshAOS();
}

window.tutupArtikel = function() {
    document.getElementById('articleModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}


// D. GALERI MEDIA 
let allGaleri = []; 
async function fetchGaleri() {
    const { data } = await supabase.from('konten_galeri').select('*').order('created_at', { ascending: false });
    allGaleri = data || [];
}

window.bukaGaleri = function(tipe) {
    const container = document.getElementById('konten-galeri-detail');
    const judul = document.getElementById('judul-kategori-galeri');

    judul.innerText = tipe === 'foto' ? 'Album Foto' : 'Galeri Video';
    const filtered = allGaleri.filter(item => item.tipe === tipe);

    if (filtered.length === 0) {
        container.innerHTML = `<div data-aos="fade-in" class="col-span-full bg-brand-50 p-8 rounded-3xl text-center text-brand-600 border border-brand-200 shadow-inner font-medium">Belum ada file media untuk kategori ini.</div>`;
    } else {
        container.innerHTML = filtered.map((item, index) => {
            const delay = (index % 6) * 100;
            return `
            <div data-aos="zoom-in" data-aos-delay="${delay}" class="bg-white rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg shadow-brand-100/50 hover:shadow-2xl transition-all border border-brand-100 relative group aspect-square lg:aspect-auto lg:h-64">
                ${item.tipe === 'video' 
                    ? `<video src="${item.media_url}" class="w-full h-full object-cover bg-brand-900" controls></video>`
                    : `<img src="${item.media_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                }
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-brand-900 via-brand-900/80 to-transparent p-3 pt-8 lg:p-5 lg:pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p class="text-white font-bold text-xs lg:text-sm tracking-wide leading-tight">${item.judul}</p>
                </div>
            </div>
            `
        }).join('');
    }
    window.switchPage('galeri-detail');
}

// ==========================================
// LOGIKA ROUTING SPA - PINDAH HALAMAN
// ==========================================
window.switchPage = function(targetSectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    
    const target = document.getElementById(targetSectionId);
    if(target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Copot class animasi AOS lalu pasang kembali untuk memicu efek animasi berulang kali
        setTimeout(() => {
            if(typeof AOS !== 'undefined') {
                const animatedElements = target.querySelectorAll('[data-aos]');
                animatedElements.forEach(el => el.classList.remove('aos-animate'));
                
                window.refreshAOS();
                
                setTimeout(() => {
                    animatedElements.forEach(el => el.classList.add('aos-animate'));
                }, 50);
            }
        }, 50);
    }
}


// ==========================================
// 5. HELPER & SUBMIT HANDLERS (CMS)
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
}), () => { quillBeranda.root.innerHTML = ''; fetchBeranda(); }));

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
        list_poin: kategori === 'kebidanan' ? document.getElementById('listPoinMateri').value : null,
        isi_artikel: kategori === 'umum' ? quillArtikel.root.innerHTML : null,
        gambar_url: await uploadToSupabase(document.getElementById('gambarMateri'), 'materi')
    }
}, () => { quillArtikel.root.innerHTML = ''; fetchMateri(); }));

document.getElementById('formGaleri').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_galeri', async () => ({
    tipe: document.getElementById('tipeGaleri').value,
    judul: document.getElementById('judulGaleri').value,
    media_url: await uploadToSupabase(document.getElementById('mediaGaleri'), 'galeri')
}), fetchGaleri));

window.toggleFormMateri = function() {
    const kat = document.getElementById('kategoriUtama').value;
    const sub = document.getElementById('subKategori');
    const fieldKebidanan = document.getElementById('fieldsKebidanan');
    const fieldUmum = document.getElementById('fieldsUmum');

    if(kat === 'kebidanan') {
        sub.innerHTML = '<option value="anc">1.a ANC</option><option value="inc">1.b INC</option><option value="pnc">1.c PNC</option><option value="kehamilan_sehat">2. Kehamilan Sehat</option>';
        fieldKebidanan.classList.remove('hidden');
        fieldUmum.classList.add('hidden');
    } else {
        sub.innerHTML = '<option value="kesehatan">a. Kesehatan Ibu</option><option value="gizi">b. Gizi & Nutrisi</option>';
        fieldKebidanan.classList.add('hidden');
        fieldUmum.classList.remove('hidden');
    }
}

// ==========================================
// INIT KETIKA WEB DIBUKA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    fetchBeranda();
    fetchAnggota();
    fetchMateri();
    fetchGaleri();
    toggleFormMateri();
});