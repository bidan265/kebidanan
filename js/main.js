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
        loadSemuaAdminData(); // Muat daftar tabel saat admin login
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
            AOS.refreshHard(); 
            window.dispatchEvent(new Event('scroll'));
        }
    }, 100);
}

// ==========================================
// 2. RENDER UI KE HALAMAN PENGUNJUNG
// ==========================================

// --- BERANDA ---
async function fetchBeranda() {
    const container = document.getElementById('konten-profil-container');
    const { data } = await supabase.from('konten_beranda').select('*').order('created_at', { ascending: true });
    if (!data || data.length === 0) { container.innerHTML = ''; return; }

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

// --- TIM & ANGGOTA ---
async function fetchAnggota() {
    const container = document.getElementById('konten-anggota');
    const { data } = await supabase.from('konten_anggota').select('*').order('created_at', { ascending: true });
    if (!data || data.length === 0) { container.innerHTML = ''; return; }

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

// --- DATA MATERI & ARTIKEL ---
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
    if (filtered.length === 0) { container.innerHTML=''; return; }

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
        </div>`
    }).join('');
    window.refreshAOS();
}

window.bukaMateriKebidanan = function(subKategori) {
    const contentContainer = document.getElementById('konten-materi-kebidanan');
    const judulContainer = document.getElementById('judul-kategori-kebidanan');
    
    const labels = {
        'anc': 'Modul Kehamilan / ANC (Antenatal Care)', 'inc': 'Modul Persalinan / INC (Intranatal Care)',
        'pnc': 'Modul Nifas / PNC (Postnatal Care)', 'kehamilan_sehat': 'Kehamilan Sehat'
    };
    if(judulContainer) judulContainer.innerText = labels[subKategori] || 'Materi Kebidanan';
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

window.bacaArtikelLengkap = function(id) {
    const item = allMateri.find(m => String(m.id) === String(id));
    if(!item) return; 
    document.getElementById('articleContent').innerHTML = `
        <div data-aos="zoom-in">
            ${item.badge_label ? `<span class="px-4 py-1.5 bg-brand-100 text-brand-800 text-xs font-bold rounded-full mb-6 inline-block">${item.badge_label}</span>` : ''}
            <h1 class="text-3xl md:text-5xl font-extrabold text-brand-900 mb-6 leading-tight">${item.judul}</h1>
            ${item.gambar_url ? `<img src="${item.gambar_url}" class="w-full h-64 md:h-[450px] object-cover rounded-3xl mb-10 shadow-xl shadow-brand-200/50">` : ''}
            <div class="text-slate-700 leading-loose text-lg space-y-6">${item.isi_artikel}</div>
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

// --- GALERI MEDIA ---
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
            <div onclick="bukaMediaUtuh('${item.id}')" data-aos="zoom-in" data-aos-delay="${delay}" class="bg-black rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg shadow-brand-100/50 hover:shadow-2xl transition-all border border-brand-100 relative group aspect-square lg:aspect-auto lg:h-64 cursor-pointer">
                
                ${item.tipe === 'video' 
                    ? `<video src="${item.media_url}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"></video>
                       <!-- Ikon Play di tengah untuk video -->
                       <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <i class="fas fa-play-circle text-white/80 text-4xl lg:text-6xl group-hover:scale-110 transition-transform"></i>
                       </div>`
                    : `<img src="${item.media_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                }
                
                <!-- Teks Hover (Ditambah pointer-events-none agar tidak menghalangi klik) -->
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end">
                    <p class="text-white font-bold text-xs lg:text-sm tracking-wide leading-tight drop-shadow-md"><i class="${item.tipe === 'foto' ? 'fas fa-camera' : 'fas fa-video'} text-brand-400 mr-2"></i>${item.judul}</p>
                </div>
            </div>`
        }).join('');
    }
    window.switchPage('galeri-detail');
}

// BUKA MEDIA LAYAR PENUH
window.bukaMediaUtuh = function(id) {
    const item = allGaleri.find(m => String(m.id) === String(id));
    if(!item) return;

    const content = document.getElementById('mediaModalContent');
    const title = document.getElementById('mediaModalTitle');

    title.innerText = item.judul;

    if (item.tipe === 'video') {
        // Render Player Video berukuran penuh
        content.innerHTML = `<video src="${item.media_url}" class="w-full max-h-[80vh] rounded-xl shadow-[0_0_40px_rgba(39,174,210,0.4)]" controls autoplay playsinline></video>`;
    } else {
        // Render Gambar berukuran penuh
        content.innerHTML = `<img src="${item.media_url}" class="w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_40px_rgba(26,156,200,0.3)]">`;
    }

    document.getElementById('mediaModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.tutupMedia = function() {
    document.getElementById('mediaModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    // Menghapus elemen agar video berhenti memutar (stop) saat modal ditutup
    document.getElementById('mediaModalContent').innerHTML = ''; 
}

window.switchPage = function(targetSectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(targetSectionId);
    if(target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            if(typeof AOS !== 'undefined') {
                const animatedElements = target.querySelectorAll('[data-aos]');
                animatedElements.forEach(el => el.classList.remove('aos-animate'));
                window.refreshAOS();
                setTimeout(() => { animatedElements.forEach(el => el.classList.add('aos-animate')); }, 50);
            }
        }, 50);
    }
}


// ==========================================
// 3. LOGIKA CRUD & CMS ADMIN (TAMBAH, EDIT, HAPUS)
// ==========================================

// Variabel penampung Status Edit saat ini
let stateEdit = { beranda: null, anggota: null, materi: null, galeri: null };

async function uploadToSupabase(fileInput, folderName) {
    const file = fileInput.files[0];
    if (!file) return null; 
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media_web').upload(`${folderName}/${fileName}`, file);
    if (error) throw error;
    return supabase.storage.from('media_web').getPublicUrl(`${folderName}/${fileName}`).data.publicUrl;
}

// Helper Universal untuk Simpan & Update Data
const handleFormSubmit = async (e, table, idKey, getPayload, refreshUI, btnSimpanText) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const payload = await getPayload(); // Ambil input
        if (stateEdit[idKey]) {
            // MODE UPDATE JIKA ID NYA ADA
            const { error } = await supabase.from(table).update(payload).eq('id', stateEdit[idKey]);
            if (error) throw error;
            alert('Sukses! Data berhasil diperbarui.');
            batalEdit(idKey); // Reset Mode Edit
        } else {
            // MODE INSERT BARU
            const { error } = await supabase.from(table).insert([payload]);
            if (error) throw error;
            alert('Sukses! Data baru berhasil ditambahkan.');
            e.target.reset();
        }
        refreshUI();
        loadSemuaAdminData(); // Segarkan List Admin Table
    } catch (err) {
        alert('Terjadi Kesalahan: ' + err.message);
    } finally {
        btn.innerHTML = btnSimpanText;
        btn.disabled = false;
    }
};

// FORM BERANDA
document.getElementById('formBeranda').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_beranda', 'beranda', async () => {
    let pl = { judul: document.getElementById('judulBeranda').value, deskripsi: quillBeranda.root.innerHTML, caption_gambar: document.getElementById('captionBeranda').value };
    let img = await uploadToSupabase(document.getElementById('gambarBeranda'), 'beranda');
    if (img) pl.gambar_url = img; // Masukkan img baru JIKA diupload
    return pl;
}, () => { quillBeranda.root.innerHTML = ''; fetchBeranda(); }, 'Simpan Profil Baru'));

// FORM ANGGOTA
document.getElementById('formAnggota').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_anggota', 'anggota', async () => {
    let pl = { nama: document.getElementById('namaAnggota').value, keahlian: document.getElementById('keahlianAnggota').value };
    let img = await uploadToSupabase(document.getElementById('fotoAnggota'), 'anggota');
    if (img) pl.foto_url = img;
    return pl;
}, fetchAnggota, 'Tambah Anggota Baru'));

// FORM GALERI
document.getElementById('formGaleri').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_galeri', 'galeri', async () => {
    let pl = { tipe: document.getElementById('tipeGaleri').value, judul: document.getElementById('judulGaleri').value };
    let media = await uploadToSupabase(document.getElementById('mediaGaleri'), 'galeri');
    if (media) pl.media_url = media;
    return pl;
}, fetchGaleri, 'Upload Media Baru'));

// FORM MATERI & ARTIKEL
document.getElementById('formMateri').addEventListener('submit', (e) => handleFormSubmit(e, 'konten_materi', 'materi', async () => {
    const kat = document.getElementById('kategoriUtama').value;
    let pl = {
        kategori_utama: kat, sub_kategori: document.getElementById('subKategori').value,
        badge_label: document.getElementById('badgeLabel').value, judul: document.getElementById('judulMateri').value,
        deskripsi: document.getElementById('deskripsiMateri').value,
        list_poin: kat === 'kebidanan' ? document.getElementById('listPoinMateri').value : null,
        isi_artikel: kat === 'umum' ? quillArtikel.root.innerHTML : null,
    };
    let img = await uploadToSupabase(document.getElementById('gambarMateri'), 'materi');
    if(img) pl.gambar_url = img;
    return pl;
}, () => { quillArtikel.root.innerHTML = ''; fetchMateri(); }, 'Simpan Data'));


// ==========================================
// 4. DAFTAR LIST ADMIN & TOMBOL HAPUS/EDIT
// ==========================================

async function loadSemuaAdminData() {
    loadListAdmin('konten_beranda', 'listAdminBeranda', (i) => `<strong>${i.judul}</strong>`, 'beranda');
    loadListAdmin('konten_anggota', 'listAdminAnggota', (i) => `<strong>${i.nama}</strong> - ${i.keahlian}`, 'anggota');
    loadListAdmin('konten_galeri', 'listAdminGaleri', (i) => `<strong>${i.judul}</strong> <span class="text-[10px] bg-slate-200 px-1 rounded">${i.tipe}</span>`, 'galeri');
    loadListAdmin('konten_materi', 'listAdminMateri', (i) => `
        <div class="mb-1"><span class="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded font-bold uppercase">${i.kategori_utama} / ${i.sub_kategori}</span></div>
        <strong class="text-sm block line-clamp-1">${i.judul}</strong>`, 'materi'
    );
}

// Fungsi Fetch List
async function loadListAdmin(table, containerId, labelFormat, key) {
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    const cont = document.getElementById(containerId);
    if (!data || data.length === 0) { cont.innerHTML = '<li class="text-xs text-slate-400 italic">Belum ada data tersimpan.</li>'; return; }

    cont.innerHTML = data.map(item => `
        <li class="bg-white border border-brand-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
            <div class="text-xs text-brand-900 leading-tight w-2/3">${labelFormat(item)}</div>
            <div class="flex gap-2 w-1/3 justify-end">
                <button onclick='editData("${table}", "${item.id}", "${key}")' class="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 w-7 h-7 rounded-lg flex items-center justify-center transition"><i class="fas fa-edit text-xs"></i></button>
                <button onclick='hapusData("${table}", "${item.id}")' class="bg-red-100 text-red-600 hover:bg-red-200 w-7 h-7 rounded-lg flex items-center justify-center transition"><i class="fas fa-trash text-xs"></i></button>
            </div>
        </li>
    `).join('');
}

// Fungsi Hapus Data Utama
window.hapusData = async function(table, id) {
    if(confirm('Data ini akan dihapus secara permanen. Anda yakin?')) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) { alert('Gagal menghapus: ' + error.message); return; }
        
        alert('Data berhasil dihapus!');
        loadSemuaAdminData();
        // Segarkan layar pengguna
        if (table === 'konten_beranda') fetchBeranda();
        if (table === 'konten_anggota') fetchAnggota();
        if (table === 'konten_materi') fetchMateri();
        if (table === 'konten_galeri') fetchGaleri();
    }
}

// Fungsi Masuk Ke Mode Edit
window.editData = async function(table, id, key) {
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    if(!data) return;

    stateEdit[key] = id; // Simpan ID yang sedang diedit

    if(key === 'beranda') {
        document.getElementById('judulBeranda').value = data.judul || '';
        document.getElementById('captionBeranda').value = data.caption_gambar || '';
        quillBeranda.root.innerHTML = data.deskripsi || '';
        document.getElementById('btnSubmitBeranda').innerText = "Update Profil";
        document.getElementById('btnBatalBeranda').classList.remove('hidden');
    }
    else if(key === 'anggota') {
        document.getElementById('namaAnggota').value = data.nama || '';
        document.getElementById('keahlianAnggota').value = data.keahlian || '';
        document.getElementById('btnSubmitAnggota').innerText = "Update Anggota";
        document.getElementById('btnBatalAnggota').classList.remove('hidden');
    }
    else if(key === 'galeri') {
        document.getElementById('tipeGaleri').value = data.tipe || 'foto';
        document.getElementById('judulGaleri').value = data.judul || '';
        document.getElementById('btnSubmitGaleri').innerText = "Update Media";
        document.getElementById('btnBatalGaleri').classList.remove('hidden');
    }
    else if(key === 'materi') {
        document.getElementById('kategoriUtama').value = data.kategori_utama;
        toggleFormMateri(); // Pastikan Dropdown B/C Berubah
        
        setTimeout(() => {
            document.getElementById('subKategori').value = data.sub_kategori;
            document.getElementById('judulMateri').value = data.judul || '';
            document.getElementById('badgeLabel').value = data.badge_label || '';
            document.getElementById('deskripsiMateri').value = data.deskripsi || '';
            
            if(data.kategori_utama === 'kebidanan') document.getElementById('listPoinMateri').value = data.list_poin || '';
            if(data.kategori_utama === 'umum') quillArtikel.root.innerHTML = data.isi_artikel || '';
            
            document.getElementById('btnSubmitMateri').innerText = "Update Konten";
            document.getElementById('btnBatalMateri').classList.remove('hidden');
        }, 100); // Jeda sebentar agar dropdown termuat
    }
}

// Batal Edit
window.batalEdit = function(key) {
    stateEdit[key] = null;
    
    if(key === 'beranda') {
        document.getElementById('formBeranda').reset();
        quillBeranda.root.innerHTML = '';
        document.getElementById('btnSubmitBeranda').innerText = "Simpan Profil Baru";
        document.getElementById('btnBatalBeranda').classList.add('hidden');
    } else if(key === 'anggota') {
        document.getElementById('formAnggota').reset();
        document.getElementById('btnSubmitAnggota').innerText = "Tambah Anggota Baru";
        document.getElementById('btnBatalAnggota').classList.add('hidden');
    } else if(key === 'galeri') {
        document.getElementById('formGaleri').reset();
        document.getElementById('btnSubmitGaleri').innerText = "Upload Media Baru";
        document.getElementById('btnBatalGaleri').classList.add('hidden');
    } else if(key === 'materi') {
        document.getElementById('formMateri').reset();
        quillArtikel.root.innerHTML = '';
        document.getElementById('btnSubmitMateri').innerText = "Simpan Data";
        document.getElementById('btnBatalMateri').classList.add('hidden');
    }
}


// Toggle Dinamis Form Materi
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

document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    fetchBeranda();
    fetchAnggota();
    fetchMateri();
    fetchGaleri();
    toggleFormMateri();
});