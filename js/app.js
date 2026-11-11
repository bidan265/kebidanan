// =========================================================================
// KONFIGURASI SUPABASE (Isi dengan URL & Anon Key Supabase Anda)
// Jika dikosongkan, sistem otomatis menggunakan LocalStorage (Demo Mode)
// =========================================================================
const SUPABASE_URL = ""; // Contoh: "https://xyzcompany.supabase.co"
const SUPABASE_ANON_KEY = ""; // Contoh: "eyJhbGciOiJIUzI1NiIsInR5..."
const ADMIN_WA = "6281234567890";

let supabaseClient = null;
const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

if (isSupabaseConfigured && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Data Default Produk (digunakan jika mode lokal)
const defaultProducts = [
    { car_id: 'test', car_name: 'Test Unit (Porsche)', clicks: 4 },
    { car_id: 'hilux', car_name: 'New Hilux', clicks: 3 },
    { car_id: 'vios', car_name: 'New Vios', clicks: 2 },
    { car_id: 'innova', car_name: 'All New Kijang Innova', clicks: 6 },
    { car_id: 'rush', car_name: 'New Rush', clicks: 2 },
    { car_id: 'avanza', car_name: 'Grand New Avanza', clicks: 5 }
];

// Toggle Menu Mobile
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('show');
});

// =========================================================================
// 1. FUNGSI MENCATAT KUNJUNGAN TOKO (COUNTER TRAFFIC MAMPIR)
// =========================================================================
async function recordStoreVisit() {
    const isNewSession = !sessionStorage.getItem('visited_session');
    const isNewUniqueUser = !localStorage.getItem('unique_visitor_flag');

    if (isSupabaseConfigured && supabaseClient) {
        document.getElementById('dbStatusBadge').innerHTML = '<span class="dot"></span> Database: Supabase Live';
        try {
            const { data } = await supabaseClient.from('traffic_stats').select('*').eq('id', 1).single();
            if (data) {
                const newTotal = data.total_visitors + 1;
                const newUnique = isNewUniqueUser ? data.unique_visitors + 1 : data.unique_visitors;

                await supabaseClient
                    .from('traffic_stats')
                    .update({ total_visitors: newTotal, unique_visitors: newUnique })
                    .eq('id', 1);
            }
        } catch (err) {
            console.error("Gagal update kunjungan ke Supabase:", err);
        }
    } else {
        document.getElementById('dbStatusBadge').innerHTML = '<span class="dot" style="background:#f59e0b"></span> Mode Lokal (Siap Sambung Supabase)';
        let stats = JSON.parse(localStorage.getItem('local_traffic_stats')) || {
            total_visitors: 120,
            unique_visitors: 85,
            total_leads: 22
        };

        stats.total_visitors += 1;
        if (isNewUniqueUser) stats.unique_visitors += 1;
        localStorage.setItem('local_traffic_stats', JSON.stringify(stats));

        if (!localStorage.getItem('local_product_clicks')) {
            localStorage.setItem('local_product_clicks', JSON.stringify(defaultProducts));
        }
    }

    sessionStorage.setItem('visited_session', 'true');
    localStorage.setItem('unique_visitor_flag', 'true');
    await renderTrafficDashboard();
}

// =========================================================================
// 2. FUNGSI MENCATAT KLIK BELI / TANYA PRODUK (CONVERSION COUNTER)
// =========================================================================
async function recordBuyIntent(carId, carName) {
    if (isSupabaseConfigured && supabaseClient) {
        try {
            // Tambah total_leads di traffic_stats
            const { data: statData } = await supabaseClient.from('traffic_stats').select('total_leads').eq('id', 1).single();
            if (statData) {
                await supabaseClient.from('traffic_stats').update({ total_leads: statData.total_leads + 1 }).eq('id', 1);
            }

            // Tambah klik pada mobil terkait
            const { data: prodData } = await supabaseClient.from('product_clicks').select('clicks').eq('car_id', carId).single();
            if (prodData) {
                await supabaseClient.from('product_clicks').update({ clicks: prodData.clicks + 1 }).eq('car_id', carId);
            }
        } catch (err) {
            console.error("Gagal mencatat klik beli di Supabase:", err);
        }
    } else {
        // Update di LocalStorage
        let stats = JSON.parse(localStorage.getItem('local_traffic_stats'));
        stats.total_leads += 1;
        localStorage.setItem('local_traffic_stats', JSON.stringify(stats));

        let products = JSON.parse(localStorage.getItem('local_product_clicks')) || defaultProducts;
        products = products.map(p => p.car_id === carId ? { ...p, clicks: p.clicks + 1 } : p);
        localStorage.setItem('local_product_clicks', JSON.stringify(products));
    }

    await renderTrafficDashboard();

    // Arahkan pelanggan ke WhatsApp Admin untuk transaksi
    if (carId !== 'cs_support') {
        const pesan = encodeURIComponent(`Halo Admin Mobil 1 Velocity, saya tertarik dengan unit *${carName}*. Mohon info simulasi kredit dan prosedur transaksinya.`);
        window.open(`https://wa.me/${ADMIN_WA}?text=${pesan}`, '_blank');
    }
}

// =========================================================================
// 3. FUNGSI MENAMPILKAN DATA TRAFFIC & REKOMENDASI IMPROVEMENT BISNIS
// =========================================================================
async function renderTrafficDashboard() {
    let stats = { total_visitors: 0, unique_visitors: 0, total_leads: 0 };
    let products = [];

    if (isSupabaseConfigured && supabaseClient) {
        const { data: sData } = await supabaseClient.from('traffic_stats').select('*').eq('id', 1).single();
        const { data: pData } = await supabaseClient.from('product_clicks').select('*').order('clicks', { ascending: false });
        if (sData) stats = sData;
        if (pData) products = pData;
    } else {
        stats = JSON.parse(localStorage.getItem('local_traffic_stats'));
        products = JSON.parse(localStorage.getItem('local_product_clicks')) || defaultProducts;
        products.sort((a, b) => b.clicks - a.clicks);
    }

    const conversionRate = stats.total_visitors > 0
        ? ((stats.total_leads / stats.total_visitors) * 100).toFixed(1)
        : 0;

    // Update Angka di Bar Cepat & Dashboard Utama
    document.getElementById('quickTotalViews').textContent = stats.total_visitors;
    document.getElementById('quickUniqueVisitors').textContent = stats.unique_visitors;
    document.getElementById('quickTotalLeads').textContent = stats.total_leads;
    document.getElementById('quickConversionRate').textContent = `${conversionRate}%`;

    document.getElementById('statTotalViews').textContent = stats.total_visitors;
    document.getElementById('statUniqueVisitors').textContent = stats.unique_visitors;
    document.getElementById('statTotalLeads').textContent = stats.total_leads;
    document.getElementById('statConversionRate').textContent = `${conversionRate}%`;

    // Render Grafik Bar Performa Produk
    const maxClicks = Math.max(...products.map(p => p.clicks), 1);
    const listContainer = document.getElementById('productPerformanceList');
    listContainer.innerHTML = products.map(item => {
        const widthPercent = Math.round((item.clicks / maxClicks) * 100);
        return `
            <div class="perf-item">
                <div class="perf-label">
                    <span><strong>${item.car_name}</strong></span>
                    <span>${item.clicks} Klik Beli</span>
                </div>
                <div class="perf-bar-bg">
                    <div class="perf-bar-fill" style="width: ${widthPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // Buat Rekomendasi Improvement Bisnis Otomatis
    const topCar = products[0];
    const lowCar = products[products.length - 1];
    const adviceList = document.getElementById('improvementAdvice');

    let statusKonversi = conversionRate >= 15
        ? "Sangat Baik! Banyak pengunjung yang mampir langsung tertarik membeli."
        : "Perlu Optimasi! Banyak pengunjung mampir melihat toko namun belum mengklik beli.";

    document.getElementById('insightConversion').textContent = statusKonversi;

    adviceList.innerHTML = `
        <li><strong>Fokus Stok & Iklan:</strong> Unit <em>${topCar.car_name}</em> memiliki peminat tertinggi (${topCar.clicks} klik beli). Pastikan stok unit dan tim sales siap memprioritaskan penawaran unit ini.</li>
        <li><strong>Evaluasi Promo Produk:</strong> Unit <em>${lowCar.car_name}</em> baru mendapatkan ${lowCar.clicks} klik. Disarankan menonjolkan promo diskon DP atau menurunkan angsuran pada kartu produknya.</li>
        <li><strong>Evaluasi Rasio Konversi (${conversionRate}%):</strong> Dari ${stats.total_visitors} kunjungan toko, terdapat ${stats.total_leads} tindakan minat beli. ${conversionRate < 10 ? 'Tambahkan banner promo DP 0% atau bonus aksesoris untuk meningkatkan konversi.' : 'Pertahankan kecepatan respons WhatsApp Customer Support.'}</li>
    `;
}

// Jalankan saat halaman dibuka
document.addEventListener('DOMContentLoaded', recordStoreVisit);