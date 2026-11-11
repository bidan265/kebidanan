// =========================================================================
// 1. KONFIGURASI SUPABASE
// Isi SUPABASE_URL dan SUPABASE_ANON_KEY proyek Anda di bawah ini.
// (Jika masih kosong, web otomatis berjalan lancar dengan LocalStorage + folder img/)
// =========================================================================
const SUPABASE_URL = "https://zlcpkffuwsbrfshulqpb.supabase.co"; // Contoh: "https://xyzproject.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsY3BrZmZ1d3NicmZzaHVscXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTAyMjIsImV4cCI6MjEwODc2NjIyMn0.QpZXcYUweCrCmFJksjmQNHdTuLZmL-TacVRw1adlXt4"; // Contoh: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
const STORAGE_BUCKET = "cahaya-media";

let supabaseClient = null;
const isSupabaseReady = SUPABASE_URL.trim() !== "" && SUPABASE_ANON_KEY.trim() !== "";

if (isSupabaseReady && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Variabel Global State
let heroSwiperInstance = null;
let selectedProductForModal = { id: null, name: "Konsultasi Unit" };

// Data Awal Default (Fallback otomatis jika Supabase belum diisi)
const fallbackData = {
    users: [{ id: 1, username: "admin", password: "admin123", full_name: "Owner Cahaya Bintang Motor" }],
    banners: [
        {
            id: 1,
            title: "ALL NEW BR-V N7X EDITION",
            subtitle: "Promo DP Ringan Mulai 15 Jutaan & Cicilan Super Ringan di Cahaya Bintang Motor",
            badge_text: "NEW RELEASE",
            image_url: "img/banner-1.jpg"
        },
        {
            id: 2,
            title: "GEBYAR PROMO TUKAR TAMBAH",
            subtitle: "Tukar Mobil Lama Anda dengan Harga Taksiran Tertinggi & Proses Kredit Cepat",
            badge_text: "BEST DEAL",
            image_url: "img/banner-2.jpg"
        }
    ],
    products: [
        { id: 1, name: "New Hilux Double Cabin", price_start: "Rp 213.600.000,00", dp_start: "Rp 20 Jutaan", installment_start: "Rp 3 Jutaan", image_url: "img/hilux.png", clicks: 5, is_active: true },
        { id: 2, name: "New Vios Facelift", price_start: "Rp 285.100.000,00", dp_start: "Rp 5 Jutaan", installment_start: "Rp 3 Jutaan", image_url: "img/vios.png", clicks: 3, is_active: true },
        { id: 3, name: "All New Kijang Innova", price_start: "Rp 309.300.000,00", dp_start: "Rp 20 Jutaan", installment_start: "Rp 3 Jutaan", image_url: "img/innova.png", clicks: 11, is_active: true },
        { id: 4, name: "New Rush GR Sport", price_start: "Rp 249.300.000,00", dp_start: "Rp 20 Jutaan", installment_start: "Rp 3 Jutaan", image_url: "img/rush.png", clicks: 6, is_active: true },
        { id: 5, name: "Grand New Avanza", price_start: "Rp 192.100.000,00", dp_start: "Rp 20 Jutaan", installment_start: "Rp 3 Jutaan", image_url: "img/avanza.png", clicks: 9, is_active: true }
    ],
    sales_contacts: [
        { id: 1, name: "Raka Pratama", role: "Senior Sales Consultant", whatsapp: "6281234567801", photo_url: "img/sales-1.jpg", clicks: 14 },
        { id: 2, name: "Nadia Putri", role: "Spesialis Kredit & Fleet", whatsapp: "6281234567802", photo_url: "img/sales-2.jpg", clicks: 12 },
        { id: 3, name: "Bima Saputra", role: "Koordinator Trade-In & Cash", whatsapp: "6281234567803", photo_url: "img/sales-3.jpg", clicks: 8 }
    ],
    traffic_stats: { id: 1, total_visitors: 140, unique_visitors: 95, total_leads: 34 }
};

// =========================================================================
// 2. INISIALISASI AOS (Sesuai Dokumentasi yang Diberikan)
// =========================================================================
function initAOSLibrary() {
    AOS.init({
        disable: false,
        startEvent: 'DOMContentLoaded',
        initClassName: 'aos-init',
        animatedClassName: 'aos-animate',
        useClassNames: false,
        disableMutationObserver: false,
        debounceDelay: 50,
        throttleDelay: 99,
        offset: 100,
        delay: 0,
        duration: 650,
        easing: 'ease-out-cubic',
        once: false,
        mirror: false,
        anchorPlacement: 'top-bottom'
    });
}

// =========================================================================
// 3. DATA LAYER HELPER (Mendukung Supabase & LocalStorage Fallback)
// =========================================================================
function initLocalStorageIfEmpty() {
    if (!localStorage.getItem('cbm_users')) localStorage.setItem('cbm_users', JSON.stringify(fallbackData.users));
    if (!localStorage.getItem('cbm_banners')) localStorage.setItem('cbm_banners', JSON.stringify(fallbackData.banners));
    if (!localStorage.getItem('cbm_products')) localStorage.setItem('cbm_products', JSON.stringify(fallbackData.products));
    if (!localStorage.getItem('cbm_sales')) localStorage.setItem('cbm_sales', JSON.stringify(fallbackData.sales_contacts));
    if (!localStorage.getItem('cbm_traffic')) localStorage.setItem('cbm_traffic', JSON.stringify(fallbackData.traffic_stats));
}

async function fetchAllData() {
    if (isSupabaseReady && supabaseClient) {
        document.getElementById('dbConnectionBadge').innerHTML = `<span class="pulse-dot"></span> Connected`;
        const [bRes, pRes, sRes, tRes] = await Promise.all([
            supabaseClient.from('banners').select('*').order('id', { ascending: true }),
            supabaseClient.from('products').select('*').order('id', { ascending: true }),
            supabaseClient.from('sales_contacts').select('*').order('id', { ascending: true }),
            supabaseClient.from('traffic_stats').select('*').eq('id', 1).single()
        ]);
        return {
            banners: bRes.data || [],
            products: pRes.data || [],
            sales: sRes.data || [],
            traffic: tRes.data || fallbackData.traffic_stats
        };
    } else {
        document.getElementById('dbConnectionBadge').innerHTML = `<span class="pulse-dot" style="background:#f59e0b"></span> Mode Lokal Aktif (Siap Konek Supabase)`;
        initLocalStorageIfEmpty();
        return {
            banners: JSON.parse(localStorage.getItem('cbm_banners')),
            products: JSON.parse(localStorage.getItem('cbm_products')),
            sales: JSON.parse(localStorage.getItem('cbm_sales')),
            traffic: JSON.parse(localStorage.getItem('cbm_traffic'))
        };
    }
}

// Fungsi Upload File Gambar ke Supabase Storage (atau Konversi Base64 jika Mode Lokal)
async function uploadImageFile(fileInput, manualUrlInput, folderName = "uploads") {
    const file = fileInput.files[0];
    if (!file) {
        return manualUrlInput.value.trim() || null;
    }

    if (isSupabaseReady && supabaseClient) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folderName}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(fileName, file, { upsert: true });
        if (error) throw error;

        const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        return data.publicUrl;
    } else {
        // Konversi ke DataURL agar tetap tampil instan saat uji coba lokal
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
}

// =========================================================================
// 4. COUNTER TRAFFIC: PENCATAT KUNJUNGAN TOKO OTOMATIS
// =========================================================================
async function recordVisitorTraffic() {
    const isNewUnique = !localStorage.getItem('cbm_unique_visitor');

    if (isSupabaseReady && supabaseClient) {
        const { data } = await supabaseClient.from('traffic_stats').select('*').eq('id', 1).single();
        if (data) {
            await supabaseClient.from('traffic_stats').update({
                total_visitors: data.total_visitors + 1,
                unique_visitors: isNewUnique ? data.unique_visitors + 1 : data.unique_visitors
            }).eq('id', 1);
        }
    } else {
        initLocalStorageIfEmpty();
        const t = JSON.parse(localStorage.getItem('cbm_traffic'));
        t.total_visitors += 1;
        if (isNewUnique) t.unique_visitors += 1;
        localStorage.setItem('cbm_traffic', JSON.stringify(t));
    }

    localStorage.setItem('cbm_unique_visitor', 'true');
}

// =========================================================================
// 5. RENDER BANNER (OTOMATIS SLIDESHOW JIKA > 1 BANNER)
// =========================================================================
function renderHeroBanners(banners) {
    const wrapper = document.getElementById('bannerWrapper');
    const fallbackImg = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80";

    if (!banners || banners.length === 0) {
        banners = fallbackData.banners;
    }

    wrapper.innerHTML = banners.map(b => `
        <div class="swiper-slide hero-slide-item">
            <img src="${b.image_url}" alt="${b.title}" class="hero-slide-img" onerror="this.src='${fallbackImg}'">
            <div class="hero-overlay">
                <div class="container">
                    <span class="hero-badge">${b.badge_text || 'PROMO SPESIAL'}</span>
                    <h1 class="hero-title">${b.title}</h1>
                    <p class="hero-subtitle">${b.subtitle || ''}</p>
                    <div class="d-flex flex-wrap gap-3">
                        <a href="#katalog" class="btn btn-primary btn-lg rounded-pill px-4 fw-bold shadow">
                            <i class="fa-solid fa-car me-2"></i>Lihat Katalog Unit
                        </a>
                        <button class="btn btn-outline-light btn-lg rounded-pill px-4 fw-bold" onclick="openSalesModal(null, 'Promo Banner: ${b.title}')">
                            <i class="fa-brands fa-whatsapp me-2"></i>Tanya Promo Ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Hancurkan instance Swiper lama sebelum inisialisasi ulang
    if (heroSwiperInstance) {
        heroSwiperInstance.destroy(true, true);
    }

    const isMultiple = banners.length > 1;
    document.getElementById('heroNext').style.display = isMultiple ? 'flex' : 'none';
    document.getElementById('heroPrev').style.display = isMultiple ? 'flex' : 'none';
    document.getElementById('heroPagination').style.display = isMultiple ? 'block' : 'none';

    heroSwiperInstance = new Swiper('#heroSwiperContainer', {
        loop: isMultiple,
        speed: 900,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: isMultiple ? { delay: 4500, disableOnInteraction: false } : false,
        pagination: { el: '#heroPagination', clickable: true },
        navigation: { nextEl: '#heroNext', prevEl: '#heroPrev' }
    });
}

// =========================================================================
// 6. RENDER KATALOG PRODUK (HANYA YANG AKTIF + EFEK AOS)
// =========================================================================
function renderProductCatalog(products) {
    const grid = document.getElementById('productCatalogGrid');
    const activeProducts = products.filter(p => p.is_active !== false);
    const defaultCarImg = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80";

    if (activeProducts.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">Belum ada produk aktif di katalog.</div>`;
        return;
    }

    grid.innerHTML = activeProducts.map((item, idx) => {
        const aosDelay = (idx % 3) * 100;
        return `
            <div class="col-12 col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${aosDelay}">
                <div class="car-card">
                    <div class="car-img-box">
                        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='${defaultCarImg}'">
                    </div>
                    <h3 class="car-title">${item.name}</h3>
                    <div class="car-specs-bars">
                        <div class="spec-bar">
                            <span>Harga Mulai</span>
                            <strong>${item.price_start}</strong>
                        </div>
                        <div class="spec-bar">
                            <span>DP Mulai</span>
                            <strong>${item.dp_start}</strong>
                        </div>
                        <div class="spec-bar">
                            <span>Cicilan Mulai</span>
                            <strong>${item.installment_start}</strong>
                        </div>
                    </div>
                    <button class="btn-buy-unit" onclick="openSalesModal(${item.id}, '${item.name.replace(/'/g, "\\'")}')">
                        <i class="fa-brands fa-whatsapp me-2"></i>Beli / Tanya Unit
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Panggil AOS.refreshHard() sesuai dokumentasi saat elemen DOM baru dimuat secara dinamis
    AOS.refreshHard();
}

// =========================================================================
// 7. POPUP PILIH 3 KONTAK SALES & PENCATAT KLIK DINAMIS
// =========================================================================
async function openSalesModal(productId, productName) {
    selectedProductForModal = { id: productId, name: productName };
    document.getElementById('selectedCarTitle').textContent = `Minat Unit: ${productName}`;

    const data = await fetchAllData();
    const salesContainer = document.getElementById('salesModalList');
    const fallbackAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

    salesContainer.innerHTML = data.sales.map(s => `
        <div class="sales-item-card">
            <div class="d-flex align-items-center gap-3">
                <img src="${s.photo_url}" alt="${s.name}" class="sales-avatar" onerror="this.src='${fallbackAvatar}'">
                <div class="text-start">
                    <h6 class="fw-extrabold mb-0 text-dark">${s.name}</h6>
                    <small class="text-muted d-block">${s.role}</small>
                    <span class="badge bg-success-subtle text-success mt-1">
                        <i class="fa-solid fa-circle-check me-1"></i>Online • ${s.clicks || 0} Konsumen Dilayani
                    </span>
                </div>
            </div>
            <button class="btn btn-success fw-bold rounded-pill px-3 py-2 flex-shrink-0" 
                onclick="handleContactSalesClick(${s.id}, '${s.name.replace(/'/g, "\\'")}', '${s.whatsapp}')">
                <i class="fa-brands fa-whatsapp me-1"></i> Pilih Kontak
            </button>
        </div>
    `).join('');

    const modalEl = document.getElementById('modalPilihSales');
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
}

async function handleContactSalesClick(salesId, salesName, salesWa) {
    const { id: prodId, name: prodName } = selectedProductForModal;

    if (isSupabaseReady && supabaseClient) {
        // 1. Update total_leads di traffic_stats
        const { data: tData } = await supabaseClient.from('traffic_stats').select('total_leads').eq('id', 1).single();
        if (tData) {
            await supabaseClient.from('traffic_stats').update({ total_leads: tData.total_leads + 1 }).eq('id', 1);
        }

        // 2. Update klik produk jika berasal dari klik mobil
        if (prodId) {
            const { data: pData } = await supabaseClient.from('products').select('clicks').eq('id', prodId).single();
            if (pData) {
                await supabaseClient.from('products').update({ clicks: (pData.clicks || 0) + 1 }).eq('id', prodId);
            }
        }

        // 3. Update klik kontak sales
        const { data: sData } = await supabaseClient.from('sales_contacts').select('clicks').eq('id', salesId).single();
        if (sData) {
            await supabaseClient.from('sales_contacts').update({ clicks: (sData.clicks || 0) + 1 }).eq('id', salesId);
        }
    } else {
        // Update di LocalStorage
        const traffic = JSON.parse(localStorage.getItem('cbm_traffic'));
        traffic.total_leads += 1;
        localStorage.setItem('cbm_traffic', JSON.stringify(traffic));

        if (prodId) {
            const products = JSON.parse(localStorage.getItem('cbm_products')).map(p =>
                p.id === prodId ? { ...p, clicks: (p.clicks || 0) + 1 } : p
            );
            localStorage.setItem('cbm_products', JSON.stringify(products));
        }

        const sales = JSON.parse(localStorage.getItem('cbm_sales')).map(s =>
            s.id === salesId ? { ...s, clicks: (s.clicks || 0) + 1 } : s
        );
        localStorage.setItem('cbm_sales', JSON.stringify(sales));
    }

    // Tutup modal pilih sales & perbarui angka statistik secara dinamis
    const modalEl = document.getElementById('modalPilihSales');
    bootstrap.Modal.getInstance(modalEl).hide();
    await refreshAllUI();

    // Buka WhatsApp ke nomor Sales yang dipilih
    const cleanPhone = salesWa.replace(/[^0-9]/g, '');
    const textMsg = encodeURIComponent(
        `Halo Kak *${salesName}* dari *Cahaya Bintang Motor*, saya tertarik dengan *${prodName}*. Mohon info harga promo, simulasi DP, dan cicilannya ya.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${textMsg}`, '_blank');
}

// =========================================================================
// 8. RENDER COUNTER TRAFFIC & REKOMENDASI IMPROVEMENT BISNIS DINAMIS
// =========================================================================
function renderAnalyticsDashboard(traffic, products, sales) {
    const convRate = traffic.total_visitors > 0
        ? ((traffic.total_leads / traffic.total_visitors) * 100).toFixed(1)
        : "0.0";

    // Bar Cepat Atas
    document.getElementById('quickViews').textContent = traffic.total_visitors;
    document.getElementById('quickUnique').textContent = traffic.unique_visitors;
    document.getElementById('quickLeads').textContent = traffic.total_leads;
    document.getElementById('quickConv').textContent = `${convRate}%`;

    // Section Analytics Bawah
    document.getElementById('statViews').textContent = traffic.total_visitors;
    document.getElementById('statUnique').textContent = traffic.unique_visitors;
    document.getElementById('statLeads').textContent = traffic.total_leads;
    document.getElementById('statConv').textContent = `${convRate}%`;

    // Urutkan semua produk (termasuk yang diarsipkan/dihapus sebagai history) berdasarkan klik tertinggi
    const sortedProducts = [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    const maxProdClicks = Math.max(...sortedProducts.map(p => p.clicks || 0), 1);

    document.getElementById('productAnalyticsList').innerHTML = sortedProducts.map(p => {
        const pct = Math.round(((p.clicks || 0) / maxProdClicks) * 100);
        const statusBadge = p.is_active === false
            ? `<span class="badge bg-secondary ms-1" style="font-size:0.65rem">History Arsip</span>`
            : ``;
        return `
            <div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold text-white">${p.name} ${statusBadge}</span>
                    <span class="text-info fw-bold">${p.clicks || 0} Klik</span>
                </div>
                <div class="progress bg-dark" style="height: 8px;">
                    <div class="progress-bar bg-info" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // Grafik Performa 3 Kontak Sales
    const sortedSales = [...sales].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    const maxSalesClicks = Math.max(...sortedSales.map(s => s.clicks || 0), 1);

    document.getElementById('salesAnalyticsList').innerHTML = sortedSales.map(s => {
        const pct = Math.round(((s.clicks || 0) / maxSalesClicks) * 100);
        return `
            <div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold text-white">${s.name}</span>
                    <span class="text-warning fw-bold">${s.clicks || 0} Konsumen</span>
                </div>
                <div class="progress bg-dark" style="height: 8px;">
                    <div class="progress-bar bg-warning" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // Rekomendasi Improvement Bisnis Otomatis
    const topCar = sortedProducts[0] || { name: '-', clicks: 0 };
    const lowCar = sortedProducts.filter(p => p.is_active !== false).slice(-1)[0] || { name: '-', clicks: 0 };
    const topSales = sortedSales[0] || { name: '-', clicks: 0 };

    document.getElementById('businessImprovementList').innerHTML = `
        <li><strong>Prioritas Stok & Iklan:</strong> Unit <em>${topCar.name}</em> menjadi favorit utama dengan <strong>${topCar.clicks} klik minat beli</strong>. Pertahankan ketersediaan unit test drive dan alokasikan iklan utama pada model ini.</li>
        <li><strong>Evaluasi Promo Unit:</strong> Unit aktif <em>${lowCar.name}</em> memiliki interaksi terendah (${lowCar.clicks} klik). Disarankan menurunkan nominal DP atau menambahkan bonus kaca film/servis gratis di banner atas.</li>
        <li><strong>Distribusi Beban Sales:</strong> Kontak <em>${topSales.name}</em> menerima trafik tertinggi (${topSales.clicks} calon pembeli). Pastikan waktu tanggap WhatsApp di bawah 3 menit agar konversi penjualan meningkat.</li>
        <li><strong>Kesehatan Konversi Toko (${convRate}%):</strong> Dari ${traffic.total_visitors} kunjungan toko terdapat ${traffic.total_leads} prospek masuk.</li>
    `;
}

// =========================================================================
// 9. AUTENTIKASI ADMIN (TABEL USERS) & CRUD PANEL ADMIN
// =========================================================================
function openAdminGate() {
    const loggedInAdmin = sessionStorage.getItem('cbm_admin_session');
    if (loggedInAdmin) {
        openAdminDashboardModal();
    } else {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLoginAdmin')).show();
    }
}

document.getElementById('formLoginAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();

    let matchedUser = null;

    if (isSupabaseReady && supabaseClient) {
        const { data } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', u)
            .eq('password', p)
            .maybeSingle();
        matchedUser = data;
    } else {
        const users = JSON.parse(localStorage.getItem('cbm_users')) || fallbackData.users;
        matchedUser = users.find(item => item.username === u && item.password === p);
    }

    if (matchedUser) {
        sessionStorage.setItem('cbm_admin_session', JSON.stringify(matchedUser));
        document.getElementById('adminNavText').textContent = "Dashboard Admin";
        bootstrap.Modal.getInstance(document.getElementById('modalLoginAdmin')).hide();

        Swal.fire({
            icon: 'success',
            title: 'Login Berhasil!',
            text: `Selamat datang, ${matchedUser.full_name}`,
            timer: 1400,
            showConfirmButton: false
        });
        openAdminDashboardModal();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak',
            text: 'Username atau Password salah!'
        });
    }
});

function logoutAdmin() {
    sessionStorage.removeItem('cbm_admin_session');
    document.getElementById('adminNavText').textContent = "Panel Admin";
    bootstrap.Modal.getInstance(document.getElementById('modalDashboardAdmin')).hide();
    Swal.fire({ icon: 'info', title: 'Logout Berhasil', timer: 1200, showConfirmButton: false });
}

async function openAdminDashboardModal() {
    await renderAdminTables();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDashboardAdmin')).show();
}

async function renderAdminTables() {
    const data = await fetchAllData();

    // 1. Tabel Banner
    document.getElementById('bannerCountInfo').textContent =
        `${data.banners.length} Banner (${data.banners.length > 1 ? 'Mode Slideshow Aktif' : 'Mode Statis 1 Gambar'})`;

    document.getElementById('adminBannerTable').innerHTML = data.banners.map(b => `
        <tr>
            <td><img src="${b.image_url}" width="90" height="50" class="rounded object-fit-cover border" onerror="this.src='https://placehold.co/90x50'"></td>
            <td>
                <span class="badge bg-warning text-dark mb-1">${b.badge_text}</span>
                <div class="fw-bold">${b.title}</div>
                <small class="text-muted">${b.subtitle}</small>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick='editBanner(${JSON.stringify(b)})'><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner(${b.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // 2. Tabel Produk (Termasuk Status Aktif / History Arsip)
    document.getElementById('adminProductTable').innerHTML = data.products.map(p => `
        <tr class="${p.is_active === false ? 'table-secondary opacity-75' : ''}">
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${p.image_url}" width="64" height="44" class="rounded object-fit-contain bg-white border p-1" onerror="this.src='https://placehold.co/64x44'">
                    <strong>${p.name}</strong>
                </div>
            </td>
            <td class="small">
                <div>Harga: <strong>${p.price_start}</strong></div>
                <div>DP: ${p.dp_start} | Cicilan: ${p.installment_start}</div>
            </td>
            <td><span class="badge bg-info text-dark fs-6">${p.clicks || 0} Klik</span></td>
            <td>
                ${p.is_active !== false
                    ? '<span class="badge bg-success">Aktif Tampil</span>'
                    : '<span class="badge bg-secondary">Diarsipkan (History)</span>'}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick='editProduct(${JSON.stringify(p)})' title="Edit"><i class="fa-solid fa-pen"></i></button>
                ${p.is_active !== false
                    ? `<button class="btn btn-sm btn-outline-danger" onclick="archiveProduct(${p.id})" title="Hapus dari Katalog (Simpan History)"><i class="fa-solid fa-trash"></i></button>`
                    : `<button class="btn btn-sm btn-outline-success" onclick="restoreProduct(${p.id})" title="Tampilkan Kembali"><i class="fa-solid fa-rotate-left"></i></button>`
                }
            </td>
        </tr>
    `).join('');

    // 3. Tabel Sales Contacts
    document.getElementById('adminSalesTable').innerHTML = data.sales.map(s => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${s.photo_url}" width="45" height="45" class="rounded-circle object-fit-cover border" onerror="this.src='https://placehold.co/45x45'">
                    <div>
                        <div class="fw-bold">${s.name}</div>
                        <small class="text-muted">${s.role}</small>
                    </div>
                </div>
            </td>
            <td><code>${s.whatsapp}</code></td>
            <td><span class="badge bg-success">${s.clicks || 0} Klik</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick='editSales(${JSON.stringify(s)})'><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSales(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// --- CRUD BANNER ---
document.getElementById('formBanner').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('bannerId').value;
    const title = document.getElementById('bannerTitle').value.trim();
    const subtitle = document.getElementById('bannerSubtitle').value.trim();
    const badge_text = document.getElementById('bannerBadge').value.trim();

    try {
        const uploadedUrl = await uploadImageFile(
            document.getElementById('bannerFile'),
            document.getElementById('bannerUrlInput'),
            'banners'
        );

        if (!uploadedUrl) {
            return Swal.fire('Perhatian', 'Silakan upload foto banner atau isi path gambar di folder img/', 'warning');
        }

        if (isSupabaseReady && supabaseClient) {
            if (id) {
                await supabaseClient.from('banners').update({ title, subtitle, badge_text, image_url: uploadedUrl }).eq('id', Number(id));
            } else {
                await supabaseClient.from('banners').insert([{ title, subtitle, badge_text, image_url: uploadedUrl }]);
            }
        } else {
            let banners = JSON.parse(localStorage.getItem('cbm_banners'));
            if (id) {
                banners = banners.map(b => b.id === Number(id) ? { ...b, title, subtitle, badge_text, image_url: uploadedUrl } : b);
            } else {
                banners.push({ id: Date.now(), title, subtitle, badge_text, image_url: uploadedUrl });
            }
            localStorage.setItem('cbm_banners', JSON.stringify(banners));
        }

        resetBannerForm();
        await renderAdminTables();
        await refreshAllUI();
        Swal.fire({ icon: 'success', title: 'Banner Disimpan!', timer: 1300, showConfirmButton: false });
    } catch (err) {
        Swal.fire('Gagal Upload', err.message, 'error');
    }
});

function editBanner(b) {
    document.getElementById('bannerId').value = b.id;
    document.getElementById('bannerTitle').value = b.title;
    document.getElementById('bannerSubtitle').value = b.subtitle;
    document.getElementById('bannerBadge').value = b.badge_text;
    document.getElementById('bannerUrlInput').value = b.image_url;
    document.getElementById('formBannerHeading').textContent = "Edit Banner #" + b.id;
}

function resetBannerForm() {
    document.getElementById('formBanner').reset();
    document.getElementById('bannerId').value = "";
    document.getElementById('formBannerHeading').textContent = "Tambah / Edit Banner";
}

async function deleteBanner(id) {
    const confirm = await Swal.fire({
        title: 'Hapus Banner?',
        text: 'Banner ini akan dihapus dari slideshow halaman utama.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus!'
    });
    if (!confirm.isConfirmed) return;

    if (isSupabaseReady && supabaseClient) {
        await supabaseClient.from('banners').delete().eq('id', id);
    } else {
        const banners = JSON.parse(localStorage.getItem('cbm_banners')).filter(b => b.id !== id);
        localStorage.setItem('cbm_banners', JSON.stringify(banners));
    }
    await renderAdminTables();
    await refreshAllUI();
}

// --- CRUD PRODUK (DENGAN SOFT-DELETE HISTORY) ---
document.getElementById('formProduct').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price_start = document.getElementById('productPrice').value.trim();
    const dp_start = document.getElementById('productDp').value.trim();
    const installment_start = document.getElementById('productInstallment').value.trim();

    try {
        const uploadedUrl = await uploadImageFile(
            document.getElementById('productFile'),
            document.getElementById('productUrlInput'),
            'products'
        );

        if (!uploadedUrl) {
            return Swal.fire('Perhatian', 'Silakan pilih file foto mobil atau masukkan path img/', 'warning');
        }

        if (isSupabaseReady && supabaseClient) {
            if (id) {
                await supabaseClient.from('products').update({
                    name, price_start, dp_start, installment_start, image_url: uploadedUrl
                }).eq('id', Number(id));
            } else {
                await supabaseClient.from('products').insert([{
                    name, price_start, dp_start, installment_start, image_url: uploadedUrl, clicks: 0, is_active: true
                }]);
            }
        } else {
            let products = JSON.parse(localStorage.getItem('cbm_products'));
            if (id) {
                products = products.map(p => p.id === Number(id)
                    ? { ...p, name, price_start, dp_start, installment_start, image_url: uploadedUrl }
                    : p
                );
            } else {
                products.push({
                    id: Date.now(), name, price_start, dp_start, installment_start, image_url: uploadedUrl, clicks: 0, is_active: true
                });
            }
            localStorage.setItem('cbm_products', JSON.stringify(products));
        }

        resetProductForm();
        await renderAdminTables();
        await refreshAllUI();
        Swal.fire({ icon: 'success', title: 'Produk Berhasil Disimpan!', timer: 1300, showConfirmButton: false });
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
});

function editProduct(p) {
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price_start;
    document.getElementById('productDp').value = p.dp_start;
    document.getElementById('productInstallment').value = p.installment_start;
    document.getElementById('productUrlInput').value = p.image_url;
    document.getElementById('formProductHeading').textContent = "Edit Produk: " + p.name;
}

function resetProductForm() {
    document.getElementById('formProduct').reset();
    document.getElementById('productId').value = "";
    document.getElementById('formProductHeading').textContent = "Tambah / Edit Produk Mobil";
}

async function archiveProduct(id) {
    const confirm = await Swal.fire({
        title: 'Arsipkan / Hapus Produk dari Katalog?',
        text: 'Produk akan disembunyikan dari halaman depan, tetapi data klik history tetap tersimpan di Counter Traffic.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Arsipkan'
    });
    if (!confirm.isConfirmed) return;

    if (isSupabaseReady && supabaseClient) {
        await supabaseClient.from('products').update({ is_active: false }).eq('id', id);
    } else {
        const products = JSON.parse(localStorage.getItem('cbm_products')).map(p =>
            p.id === id ? { ...p, is_active: false } : p
        );
        localStorage.setItem('cbm_products', JSON.stringify(products));
    }
    await renderAdminTables();
    await refreshAllUI();
}

async function restoreProduct(id) {
    if (isSupabaseReady && supabaseClient) {
        await supabaseClient.from('products').update({ is_active: true }).eq('id', id);
    } else {
        const products = JSON.parse(localStorage.getItem('cbm_products')).map(p =>
            p.id === id ? { ...p, is_active: true } : p
        );
        localStorage.setItem('cbm_products', JSON.stringify(products));
    }
    await renderAdminTables();
    await refreshAllUI();
}

// --- CRUD 3 KONTAK SALES ---
document.getElementById('formSales').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('salesId').value;
    const name = document.getElementById('salesName').value.trim();
    const role = document.getElementById('salesRole').value.trim();
    const whatsapp = document.getElementById('salesWa').value.trim();

    try {
        const uploadedUrl = await uploadImageFile(
            document.getElementById('salesFile'),
            document.getElementById('salesUrlInput'),
            'sales'
        );

        if (!uploadedUrl) {
            return Swal.fire('Perhatian', 'Silakan upload foto sales atau isi path img/', 'warning');
        }

        if (isSupabaseReady && supabaseClient) {
            if (id) {
                await supabaseClient.from('sales_contacts').update({ name, role, whatsapp, photo_url: uploadedUrl }).eq('id', Number(id));
            } else {
                await supabaseClient.from('sales_contacts').insert([{ name, role, whatsapp, photo_url: uploadedUrl, clicks: 0 }]);
            }
        } else {
            let sales = JSON.parse(localStorage.getItem('cbm_sales'));
            if (id) {
                sales = sales.map(s => s.id === Number(id) ? { ...s, name, role, whatsapp, photo_url: uploadedUrl } : s);
            } else {
                sales.push({ id: Date.now(), name, role, whatsapp, photo_url: uploadedUrl, clicks: 0 });
            }
            localStorage.setItem('cbm_sales', JSON.stringify(sales));
        }

        resetSalesForm();
        await renderAdminTables();
        await refreshAllUI();
        Swal.fire({ icon: 'success', title: 'Kontak Sales Disimpan!', timer: 1300, showConfirmButton: false });
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
});

function editSales(s) {
    document.getElementById('salesId').value = s.id;
    document.getElementById('salesName').value = s.name;
    document.getElementById('salesRole').value = s.role;
    document.getElementById('salesWa').value = s.whatsapp;
    document.getElementById('salesUrlInput').value = s.photo_url;
    document.getElementById('formSalesHeading').textContent = "Edit Kontak: " + s.name;
}

function resetSalesForm() {
    document.getElementById('formSales').reset();
    document.getElementById('salesId').value = "";
    document.getElementById('formSalesHeading').textContent = "Tambah / Edit Kontak Sales";
}

async function deleteSales(id) {
    const confirm = await Swal.fire({
        title: 'Hapus Kontak Sales?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus'
    });
    if (!confirm.isConfirmed) return;

    if (isSupabaseReady && supabaseClient) {
        await supabaseClient.from('sales_contacts').delete().eq('id', id);
    } else {
        const sales = JSON.parse(localStorage.getItem('cbm_sales')).filter(s => s.id !== id);
        localStorage.setItem('cbm_sales', JSON.stringify(sales));
    }
    await renderAdminTables();
    await refreshAllUI();
}

// =========================================================================
// 10. BOOTSTRAP AWAL SAAT WEBSITE DIBUKA
// =========================================================================
async function refreshAllUI() {
    const data = await fetchAllData();
    renderHeroBanners(data.banners);
    renderProductCatalog(data.products);
    renderAnalyticsDashboard(data.traffic, data.products, data.sales);
}

document.addEventListener('DOMContentLoaded', async () => {
    initAOSLibrary();
    await recordVisitorTraffic();
    await refreshAllUI();
});