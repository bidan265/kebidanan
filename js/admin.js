// js/admin.js
import { supabase } from './supabase.js';

// ==========================================
// 1. INISIALISASI QUILL EDITOR
// ==========================================
const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'header': [1, 2, 3, false] }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'color': [] }, { 'background': [] }],
  ['clean']
];

const quillBeranda = new Quill('#editorBeranda', { theme: 'snow', modules: { toolbar: toolbarOptions }});
const quillMateri = new Quill('#editorMateri', { theme: 'snow', modules: { toolbar: toolbarOptions }});


// ==========================================
// 2. LOGIKA LOGIN & SESI
// ==========================================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const loginMessage = document.getElementById('loginMessage');

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        btnLogout.style.display = 'block';
        
        // JIKA LOGIN BERHASIL, MUAT SEMUA DAFTAR
        loadBerandaAdmin();
        loadMateriAdmin();
        loadGaleriAdmin();
    } else {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        btnLogout.style.display = 'none';
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = "Loading...";
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        loginMessage.textContent = "Gagal login: " + error.message;
    } else {
        loginMessage.textContent = "";
        checkUser();
    }
});

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUser();
});


// ==========================================
// 3. FUNGSI UPLOAD FILE KE SUPABASE BUCKET
// ==========================================
async function uploadFile(fileInput, folderName) {
    const file = fileInput.files[0];
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    const { error } = await supabase.storage.from('media_web').upload(filePath, file);
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('media_web').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
}


// ==========================================
// 4. CRUD: BERANDA
// ==========================================
document.getElementById('formBeranda').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Menyimpan...';
    btnSubmit.disabled = true;

    try {
        const tipe = document.getElementById('tipeBeranda').value;
        const judul = document.getElementById('judulBeranda').value;
        const deskripsi = quillBeranda.root.innerHTML;

        const { error } = await supabase
            .from('konten_beranda')
            .insert([{ tipe, judul, deskripsi, gambar_url: null }]);

        if (error) throw error;

        alert('Data Beranda berhasil ditambahkan!');
        document.getElementById('formBeranda').reset();
        quillBeranda.root.innerHTML = '';
        loadBerandaAdmin(); // Refresh Daftar Beranda
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
});

async function loadBerandaAdmin() {
    const list = document.getElementById('listBerandaAdmin');
    const { data, error } = await supabase.from('konten_beranda').select('*').order('created_at', { ascending: false });
    if (error || !data.length) { list.innerHTML = '<li>Belum ada data.</li>'; return; }
    
    list.innerHTML = data.map(item => `
        <li>
            <span><strong>${item.judul}</strong> (${item.tipe})</span>
            <button class="btn-delete" onclick="hapusBeranda('${item.id}')">Hapus</button>
        </li>
    `).join('');
}

window.hapusBeranda = async function(id) {
    if(confirm('Yakin ingin menghapus data ini?')) {
        await supabase.from('konten_beranda').delete().eq('id', id);
        loadBerandaAdmin();
    }
}


// ==========================================
// 5. CRUD: MATERI
// ==========================================
document.getElementById('formMateri').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Menyimpan...';
    btnSubmit.disabled = true;

    try {
        const kategori_utama = document.getElementById('kategoriMateri').value;
        const sub_kategori = document.getElementById('subKategoriMateri').value;
        const judul = document.getElementById('judulMateri').value;
        const isi_materi = quillMateri.root.innerHTML;

        const { error } = await supabase
            .from('konten_materi')
            .insert([{ kategori_utama, sub_kategori, judul, isi_materi }]);

        if (error) throw error;
        alert('Materi berhasil ditambahkan!');
        document.getElementById('formMateri').reset();
        quillMateri.root.innerHTML = '';
        loadMateriAdmin(); // Refresh Daftar Materi
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
});

async function loadMateriAdmin() {
    const list = document.getElementById('listMateriAdmin');
    const { data, error } = await supabase.from('konten_materi').select('*').order('created_at', { ascending: false });
    if (error || !data.length) { list.innerHTML = '<li>Belum ada data materi.</li>'; return; }
    
    list.innerHTML = data.map(item => `
        <li>
            <span><strong>${item.judul}</strong><br><small>${item.sub_kategori}</small></span>
            <button class="btn-delete" onclick="hapusMateri('${item.id}')">Hapus</button>
        </li>
    `).join('');
}

window.hapusMateri = async function(id) {
    if(confirm('Hapus materi ini?')) {
        await supabase.from('konten_materi').delete().eq('id', id);
        loadMateriAdmin();
    }
}


// ==========================================
// 6. CRUD: GALERI (Upload)
// ==========================================
document.getElementById('formGaleri').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Mengunggah File...';
    btnSubmit.disabled = true;

    try {
        const tipe = document.getElementById('tipeGaleri').value;
        const judul = document.getElementById('judulGaleri').value;
        const inputFile = document.getElementById('urlGaleri');

        if (inputFile.files.length === 0) throw new Error("Pilih file terlebih dahulu!");

        // Upload file
        let media_url = await uploadFile(inputFile, 'galeri');

        // Simpan ke database
        const { error } = await supabase.from('konten_galeri').insert([{ tipe, judul, media_url }]);
        if (error) throw error;

        alert('Galeri berhasil ditambahkan!');
        document.getElementById('formGaleri').reset();
        loadGaleriAdmin(); // Refresh Daftar Galeri
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
});

async function loadGaleriAdmin() {
    const list = document.getElementById('listGaleriAdmin');
    const { data, error } = await supabase.from('konten_galeri').select('*').order('created_at', { ascending: false });
    if (error || !data.length) { list.innerHTML = '<li>Belum ada galeri.</li>'; return; }
    
    list.innerHTML = data.map(item => {
        let previewHtml = '';
        if (item.tipe === 'foto') {
            previewHtml = `<img src="${item.media_url}" alt="${item.judul}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 12px;">`;
        } else if (item.tipe === 'video') {
            previewHtml = `<video src="${item.media_url}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 12px;" muted></video>`;
        }

        return `
            <li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--bg-soft);">
                <div style="display: flex; align-items: center;">
                    ${previewHtml}
                    <div>
                        <strong>${item.judul}</strong><br>
                        <small style="color: var(--text-muted); text-transform: uppercase;">${item.tipe}</small>
                    </div>
                </div>
                <button class="btn-delete" onclick="hapusGaleri('${item.id}')">Hapus</button>
            </li>
        `;
    }).join('');
}

window.hapusGaleri = async function(id) {
    if(confirm('Hapus galeri ini?')) {
        await supabase.from('konten_galeri').delete().eq('id', id);
        loadGaleriAdmin();
    }
}

// JALANKAN CEK USER PERTAMA KALI
checkUser();