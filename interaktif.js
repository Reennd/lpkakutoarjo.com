AOS.init({ once: true, duration: 800, offset: 100 });

// --- KONFIGURASI API ---
// Pastikan URL ini adalah URL Web App Google Script Anda yang benar
const API_URL = 'https://script.google.com/macros/s/AKfycbx23b07V8wHOdp2Jn4bZl88qRzOSn0x84YXulA7MpbiQSlgRf045emfe_OuQJRt31Im/exec'; 
const CACHE_KEY = 'lpka_data_cache_v2'; // Ubah versi jika struktur data berubah

const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let globalData = {};

// --- SET TANGGAL ---
const dateEl = document.getElementById('current-date');
if(dateEl) dateEl.innerText = new Date().toLocaleDateString('id-ID', dateOptions);

// --- BACK TO TOP ---
window.onscroll = function() {
    const btnTop = document.getElementById("btnBackToTop");
    if(btnTop) {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) btnTop.classList.add("show");
        else btnTop.classList.remove("show");
    }
};

// --- LOADING SCREEN HELPER ---
function hideLoader() {
    const loader = document.getElementById('loader-wrapper');
    if(loader) {
        loader.classList.add('loader-hidden');
        loader.addEventListener('transitionend', function() { loader.style.display = 'none'; });
    }
}

// ==========================================
// FUNGSI UTAMA LOAD DATA
// ==========================================
async function loadData() {
    try {
        // 1. CEK CACHE
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) {
            console.log("Mengambil data dari Cache...");
            globalData = JSON.parse(cachedData);
        } else {
            console.log("Mengambil data dari API...");
            const response = await fetch(API_URL);
            const data = await response.json();
            
            if (data.status === 'error') { 
                console.error("API Error:", data.message);
                alert("Gagal mengambil data: " + data.message); 
                hideLoader(); 
                return; 
            }
            
            globalData = data;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(globalData));
        }

        console.log("Data Aktif:", globalData);

        // 2. SETUP FITUR GLOBAL
        setupSearchListener();
        
        // Deteksi key InfoPublik (bisa infoPublik, infopublik, atau InfoPublik)
        const infoPublikData = globalData.infoPublik || globalData.infopublik || globalData.InfoPublik || [];
        if(infoPublikData.length > 0) setupInfoPublikMenu(infoPublikData);

        // 3. ROUTING HALAMAN
        const mainEl = document.querySelector('main');
        const pageId = mainEl ? mainEl.getAttribute('data-page') : 'home';
        console.log("Halaman aktif:", pageId);

        // Render Widget Global
        if(document.getElementById('pejabat-container')) renderPejabat(globalData.pejabat); 
        if(document.getElementById('sidebar-video-container')) renderVideoSidebar(globalData.video);

        // Render Halaman Spesifik
        if (pageId === 'home') {
            renderBanner(globalData.banner);
            renderBerita(globalData.berita);
        }
        else if (pageId === 'pencarian') performSearch(globalData);
        else if (pageId === 'sejarah') renderSejarah(globalData.sejarah);
        else if (pageId === 'pejabat') renderPejabatFull(globalData.pejabat);
        else if (pageId === 'visimisi') renderVisiMisi(globalData.visimisi);
        else if (pageId === 'tupoksi') renderTupoksi(globalData.tupoksi);
        else if (pageId === 'struktur') renderStruktur(globalData.struktur);
        
        // PERBAIKAN: Gunakan variabel infoPublikData yang sudah diamankan
        else if (pageId === 'infopublik') renderInfoPublik(infoPublikData);
        
        else if (pageId === 'berita') renderBeritaFull(globalData.berita);
        else if (pageId === 'bacaselengkapnya') renderDetailBerita(globalData.berita);
        
        // Halaman Layanan
        else if (['kunjungan', 'hukum', 'reintegrasi', 'pengaduan', 'layanan'].includes(pageId)) {
            if(pageId !== 'layanan') renderLayananSpesifik(pageId);
        }

        setTimeout(() => { AOS.refresh(); }, 500);

    } catch (error) {
        console.error("Critical Error pada loadData:", error);
        // Hapus cache jika error agar reload berikutnya mengambil data fresh
        sessionStorage.removeItem(CACHE_KEY);
    } finally { 
        setTimeout(hideLoader, 300); 
    }
}

// ==========================================
// RENDER INFO PUBLIK (DIPERBAIKI)
// ==========================================
function renderInfoPublik(list) {
    const container = document.getElementById('infopublik-container');
    if (!container) return; 
    
    // Debugging: Cek data di console browser
    console.log("Render InfoPublik Data:", list);

    if (!list || !Array.isArray(list) || list.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">Data dokumen belum tersedia atau gagal dimuat.</h5></div>`; 
        return; 
    }
    
    // Ambil parameter filter
    const urlParams = new URLSearchParams(window.location.search);
    const activeCategory = urlParams.get('kategori');

    let displayList = list;

    if (activeCategory) {
        // Filter aman (handling null/undefined)
        displayList = list.filter(item => {
            const kat = item.kategori || item.Kategori || item.category || "";
            return kat.toString().toLowerCase() === activeCategory.toLowerCase();
        });
        
        // Update Judul Halaman
        const pageTitle = document.querySelector('h3.display-6');
        if(pageTitle) pageTitle.innerText = activeCategory;
        const pageDesc = document.querySelector('.text-muted.text-center p');
        if(pageDesc) pageDesc.innerText = `Menampilkan dokumen kategori ${activeCategory}`;
    }

    if (displayList.length === 0) { 
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">Tidak ada dokumen untuk kategori "${activeCategory || ''}".</h5><a href="infopublik.html" class="btn btn-sm btn-outline-primary mt-2">Lihat Semua Dokumen</a></div>`; 
        return; 
    }

    let html = '';
    displayList.forEach((item) => {
        // PERBAIKAN: Fallback nama properti (Cek berbagai kemungkinan key)
        let title = item.namaDokumen || item.nama_dokumen || item.judul || item.Judul || item.nama || "Dokumen Tanpa Judul";
        let link = item.linkDokumenFull || item.link_dokumen_full || item.link || item.url || item.Link || "#";
        let desc = item.deskripsiSingkat || item.deskripsi_singkat || item.deskripsi || item.Deskripsi || "Dokumen Publik LPKA Kutoarjo";
        let img = item.imageUrl || item.image_url || item.gambar || item.Gambar || "";
        let cat = item.kategori || item.Kategori || "";

        let kategoriBadge = cat ? `<span class="badge bg-warning text-dark mb-2">${cat}</span>` : '';
        let thumb = img ? `<img src="${fixGoogleDriveImage(img)}">` : `<div class="doc-icon"><i class="fas fa-file-pdf"></i></div>`;
        
        html += `
        <div class="col-md-6 col-lg-3" data-aos="fade-up">
            <div class="card card-doc" onclick="openDocPreview('${title.replace(/'/g, "\\'")}', '${link}')">
                <div class="doc-thumb">
                    ${thumb}
                    <div class="doc-overlay"><i class="fas fa-eye text-white fa-2x"></i></div>
                </div>
                <div class="card-body">
                    ${kategoriBadge}
                    <h6 class="fw-bold text-primary mb-2 text-truncate" title="${title}">${title}</h6>
                    <p class="small text-muted mb-0">${desc}</p>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function setupInfoPublikMenu(list) {
    const dropdown = document.getElementById('infoPublikDropdown');
    if (!dropdown || !list) return;

    // Ambil kategori unik dengan aman
    const uniqueCategories = [...new Set(list.map(item => item.kategori || item.Kategori || ""))]
        .filter(k => k && k.trim() !== "")
        .sort();

    let html = '<li><a class="dropdown-item" href="infopublik.html">Semua Dokumen</a></li>';
    if (uniqueCategories.length > 0) {
        html += '<li><hr class="dropdown-divider"></li>';
        uniqueCategories.forEach(cat => {
            html += `<li><a class="dropdown-item" href="infopublik.html?kategori=${encodeURIComponent(cat)}">${cat}</a></li>`;
        });
    }
    dropdown.innerHTML = html;
}

// ==========================================
// FUNGSI LAINNYA (TIDAK BERUBAH BANYAK)
// ==========================================

function setupSearchListener() {
    const forms = document.querySelectorAll('form[role="search"]');
    forms.forEach(form => {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const input = this.querySelector('input');
            const keyword = input.value.trim();
            if(keyword) window.location.href = `pencarian.html?q=${encodeURIComponent(keyword)}`;
        });
    });
}

function performSearch(data) {
    const keyword = getQueryParam('q');
    const container = document.getElementById('search-results-container');
    const titleEl = document.getElementById('search-title');
    const subtitleEl = document.getElementById('search-subtitle');

    if (!container) return;
    if (!keyword) {
        container.innerHTML = '<div class="alert alert-warning text-center">Silakan masukkan kata kunci pencarian.</div>';
        if(subtitleEl) subtitleEl.innerText = "";
        return;
    }

    if(titleEl) titleEl.innerText = `Hasil Pencarian: "${keyword}"`;
    if(subtitleEl) subtitleEl.innerText = `Menampilkan hasil untuk kata kunci "${keyword}"`;

    const lowerKeyword = keyword.toLowerCase();
    let results = [];

    // Search Helpers
    const safeLower = (txt) => (txt || "").toString().toLowerCase();

    // A. Cari di BERITA
    if (data.berita) {
        data.berita.forEach((item, index) => {
            if (safeLower(item.judul).includes(lowerKeyword) || safeLower(item.isi).includes(lowerKeyword)) {
                results.push({
                    type: 'BERITA',
                    title: item.judul,
                    desc: item.ringkasan || (item.isi ? item.isi.substring(0, 100) + '...' : ''),
                    link: `bacaselengkapnya.html?id=${index}`,
                    date: item.tanggal
                });
            }
        });
    }

    // B. Cari di PEJABAT
    if (data.pejabat) {
        data.pejabat.forEach(item => {
            if (safeLower(item.nama).includes(lowerKeyword)) {
                results.push({
                    type: 'PEJABAT',
                    title: item.nama,
                    desc: item.jabatan || 'Profil Pejabat',
                    link: 'pejabat.html',
                    date: null
                });
            }
        });
    }

    // C. Cari di INFO PUBLIK (Aman dari null)
    const infoPublikData = data.infoPublik || data.infopublik || [];
    infoPublikData.forEach(item => {
        let namaDoc = item.namaDokumen || item.judul || item.nama_dokumen || "";
        let kategori = item.kategori || 'Informasi Publik';
        if (safeLower(namaDoc).includes(lowerKeyword)) {
            results.push({
                type: 'DOKUMEN',
                title: namaDoc,
                desc: `Dokumen Kategori: ${kategori}`,
                link: item.linkDokumenFull || item.url || item.link || '#',
                isExternal: true
            });
        }
    });

    if (results.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><h5 class="text-muted">Tidak ditemukan hasil untuk "${keyword}"</h5><p>Coba kata kunci lain.</p></div>`;
    } else {
        let html = '<div class="list-group shadow-sm border-0">';
        results.forEach(res => {
            let icon = 'fa-file-alt';
            let badgeClass = 'bg-secondary';
            if(res.type === 'BERITA') { icon = 'fa-newspaper'; badgeClass = 'bg-primary'; }
            else if(res.type === 'PEJABAT') { icon = 'fa-user-tie'; badgeClass = 'bg-success'; }
            else if(res.type === 'DOKUMEN') { icon = 'fa-file-pdf'; badgeClass = 'bg-warning text-dark'; }

            let targetAttr = res.isExternal ? 'target="_blank"' : '';
            let dateHtml = res.date ? `<small class="text-muted ms-2"><i class="far fa-calendar-alt"></i> ${new Date(res.date).toLocaleDateString('id-ID')}</small>` : '';

            html += `<a href="${res.link}" class="list-group-item list-group-item-action p-4 border-start border-4 border-primary mb-3 rounded shadow-sm" ${targetAttr}><div class="d-flex w-100 justify-content-between align-items-center mb-2"><h5 class="mb-1 fw-bold text-primary">${res.title}</h5><span class="badge ${badgeClass} rounded-pill"><i class="fas ${icon} me-1"></i> ${res.type}</span></div><p class="mb-1 text-secondary">${res.desc}</p>${dateHtml}</a>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }
}

// ==========================================
// RENDER FUNCTIONS LAINNYA
// ==========================================

function renderBanner(list) {
    const container = document.getElementById('banner-container');
    if (!list || list.length === 0) { 
        container.innerHTML = `<div class="carousel-item active"><img src="https://via.placeholder.com/1200x600?text=Default+Banner" class="d-block w-100"><div class="carousel-caption"><h2>LPKA Kutoarjo</h2></div></div>`; 
        return; 
    }
    let html = '';
    list.forEach((item, index) => {
        let activeClass = index === 0 ? 'active' : '';
        let imgUrl = fixGoogleDriveImage(item.gambar) || "https://via.placeholder.com/1200x600?text=No+Image";
        html += `<div class="carousel-item ${activeClass}"><img src="${imgUrl}" class="d-block w-100" alt="Banner ${index}"><div class="carousel-caption"><h2 data-aos="fade-down">${item.judul}</h2><p class="lead mt-3" data-aos="fade-up">${item.deskripsi}</p><a href="#berita-section" class="btn btn-warning btn-banner shadow" data-aos="zoom-in">Lihat Berita <i class="fas fa-arrow-down ms-2"></i></a></div></div>`;
    });
    container.innerHTML = html;
    
    const carouselElement = document.querySelector('#heroCarousel');
    if(carouselElement && typeof bootstrap !== 'undefined') {
        const oldInstance = bootstrap.Carousel.getInstance(carouselElement);
        if(oldInstance) oldInstance.dispose();
        new bootstrap.Carousel(carouselElement, { interval: 5000, wrap: true, pause: 'hover' });
    }
}

function renderSejarah(list) {
    const container = document.getElementById('sejarah-container');
    const loadingElement = document.getElementById('loading-sejarah'); 

    if (!list || list.length === 0) { 
        container.innerHTML = '<div class="text-center">Data sejarah belum tersedia.</div>'; 
        if (loadingElement) loadingElement.style.display = 'none';
        return; 
    }
    let item = list[0]; 
    let judul = item.judul;
    let rawDeskripsi = item.deskripsiSejarah || item.deskripsi || item.isi || "";
    let imgUtama = fixGoogleDriveImage(item.image || item.gambar || "");
    let imgTengah1 = fixGoogleDriveImage(item.gambarTengah1 || item.gambar2 || "");
    let imgTengah2 = fixGoogleDriveImage(item.gambarTengah2 || item.gambar3 || "");

    let paragraphs = rawDeskripsi.split(/\r?\n/).filter(p => p.trim() !== "");
    let contentHtml = "";
    let idx1 = Math.floor(paragraphs.length / 3);
    let idx2 = Math.floor(2 * paragraphs.length / 3);
    if (paragraphs.length < 3) { idx1 = 0; idx2 = 1; }

    paragraphs.forEach((p, i) => {
        contentHtml += `<p class="lh-lg mb-3" style="text-align:justify;">${p}</p>`;
        if (i === idx1 && imgTengah1) {
            contentHtml += `<div class="row justify-content-center my-4"><div class="col-md-10"><img src="${imgTengah1}" class="img-fluid rounded-3 shadow-sm w-100" alt="Dokumentasi 1"></div></div>`;
        }
        if (i === idx2 && imgTengah2) {
            contentHtml += `<div class="row justify-content-center my-4"><div class="col-md-10"><img src="${imgTengah2}" class="img-fluid rounded-3 shadow-sm w-100" alt="Dokumentasi 2"></div></div>`;
        }
    });

    container.innerHTML = `<div class="row justify-content-center"><div class="col-lg-10"><h2 class="fw-bold text-primary mb-4 text-center">${judul}</h2><div class="mb-5 text-center"><img src="${imgUtama}" class="img-fluid rounded-4 shadow-lg" style="max-height:500px; object-fit:cover;" alt="Foto Utama"></div><div class="text-secondary fs-5">${contentHtml}</div></div></div>`;
    if (loadingElement) loadingElement.style.display = 'none';
}

function renderPejabat(list) {
    const container = document.getElementById('pejabat-container');
    if(!container || !list || list.length === 0) {
        if(container) container.innerHTML = '<div class="text-center text-muted">Data tidak tersedia</div>';
        return;
    }
    const kepala = list[0]; 
    const imgUrl = fixGoogleDriveImage(kepala.foto) || "https://via.placeholder.com/150x150?text=No+Image";
    container.innerHTML = `<div class="kepala-container text-center p-3" onclick="window.location.href='pejabat.html'" title="Klik untuk lihat semua pejabat"><div class="kepala-img-container"><img src="${imgUrl}" class="kepala-img" alt="Foto Kepala"></div><h5 class="fw-bold text-primary mb-1">${kepala.nama}</h5></div>`;
}

function renderPejabatFull(list) {
    const container = document.getElementById('pejabat-full-container');
    if(!container) return;
    container.innerHTML = '';
    if(!list || list.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">Data pejabat belum tersedia.</div>';
        return;
    }
    let html = '';
    list.forEach((p, idx) => {
        html += `<div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${idx * 100}"><div class="card card-pejabat"><div class="card-pejabat-img-wrapper"><img src="${fixGoogleDriveImage(p.foto)}" class="card-pejabat-img"></div><div class="card-pejabat-body"><h5 class="fw-bold text-primary mb-1 text-truncate">${p.nama}</h5><small class="text-muted fw-bold text-uppercase">${p.jabatan}</small></div></div></div>`;
    });
    container.innerHTML = html;
}

function renderVisiMisi(list) {
    const container = document.getElementById('visimisi-content-container');
    if(!container) return;
    if(!list || list.length === 0) { 
        container.innerHTML = '<div class="text-center">Data Visi Misi belum tersedia.</div>';
        return;
    }
    let html = '<div class="row">';
    let visiList = list.filter(item => item.kategori.toLowerCase().includes('visi'));
    let misiList = list.filter(item => item.kategori.toLowerCase().includes('misi'));
    let tujuanList = list.filter(item => item.kategori.toLowerCase().includes('tujuan'));
    let mottoList = list.filter(item => item.kategori.toLowerCase().includes('motto'));

    html += '<div class="col-md-12 mb-4 text-center"><h4 class="fw-bold text-primary mb-3"><i class="fas fa-eye me-2"></i>VISI</h4>';
    visiList.forEach(v => { html += `<p class="lead fst-italic">"${v.konten}"</p>`; });
    html += '</div><div class="col-12"><hr class="my-4"></div><div class="col-md-12"><h4 class="fw-bold text-primary mb-3 text-center"><i class="fas fa-bullseye me-2"></i>MISI</h4><ul class="list-group list-group-flush">';
    misiList.forEach(m => { let points = m.konten.split(/\r?\n/); points.forEach(p => { if(p.trim() !== "") html += `<li class="list-group-item bg-transparent border-0 ps-0"><i class="fas fa-check-circle text-warning me-3"></i>${p}</li>`; }); });
    html += '</ul></div>';
    
    if (tujuanList.length > 0) {
        html += '<div class="col-12"><hr class="my-4"></div><div class="col-md-12"><h4 class="fw-bold text-primary mb-3 text-center"><i class="fas fa-crosshairs me-2"></i>TUJUAN</h4><ul class="list-group list-group-flush">';
        tujuanList.forEach(t => { let points = t.konten.split(/\r?\n/); points.forEach(p => { if(p.trim() !== "") html += `<li class="list-group-item bg-transparent border-0 ps-0"><i class="fas fa-check text-primary me-3"></i>${p}</li>`; }); });
        html += '</ul></div>';
    }
    if (mottoList.length > 0) { 
        html += '<div class="col-12"><hr class="my-4"></div><div class="col-md-12 text-center"><h4 class="fw-bold text-primary mb-3"><i class="fas fa-star me-2"></i>MOTTO</h4><div class="d-inline-block bg-primary text-white px-4 py-3 rounded-3 shadow fw-bold fs-5">'; 
        mottoList.forEach(mt => { html += `<span>${mt.konten}</span>`; }); 
        html += '</div></div>'; 
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderTupoksi(list) {
    const container = document.getElementById('tupoksi-container');
    const loadingElement = document.getElementById('loading-tupoksi'); 
    if (!container) return;
    if(!list || list.length === 0) { 
        container.innerHTML = '<div class="text-center py-5">Data Tupoksi belum tersedia.</div>'; 
        if(loadingElement) loadingElement.style.display = 'none'; 
        return; 
    }
    try {
        let html = '<div class="col-lg-10"><div class="accordion" id="accTupoksi">';
        list.forEach((item, idx) => {
            let kontenBersih = item.konten ? item.konten.replace(/\n/g, '<br>') : "Belum ada konten.";
            let kategori = item.kategori || "Tanpa Judul";
            html += `<div class="accordion-item border-0 shadow-sm mb-3 rounded overflow-hidden"><h2 class="accordion-header"><button class="accordion-button ${idx !== 0 ? 'collapsed' : ''} fw-bold text-primary bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${idx}">${kategori}</button></h2><div id="collapse${idx}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#accTupoksi"><div class="accordion-body bg-white lh-lg text-secondary">${kontenBersih}</div></div></div>`;
        });
        html += '</div></div>';
        container.innerHTML = html;
    } catch (error) { console.error("Error menampilkan Tupoksi:", error); } 
    finally { if (loadingElement) loadingElement.style.display = 'none'; }
}

function renderStruktur(list) {
    const container = document.getElementById('struktur-container');
    const loadingElement = document.getElementById('loading-struktur'); 
    if(!list || list.length === 0) { 
        container.innerHTML = '<div class="text-center">Data struktur belum tersedia.</div>'; 
        if(loadingElement) loadingElement.style.display = 'none'; 
        return; 
    }
    let item = list[0];
    let urlDoc = item.urlDokumen || item.url_dokumen || item.link_dokumen || item.link || "";
    let imgUrl = "";
    try { imgUrl = item.image ? fixGoogleDriveImage(item.image) : ""; } catch (e) { console.warn(e); }

    let html = `<h4 class="mb-4 fw-bold text-dark">${item.judul || 'Struktur Organisasi'}</h4>${imgUrl ? `<img src="${imgUrl}" class="img-fluid border rounded shadow-sm mb-4" style="max-height:80vh;" alt="Bagan Struktur">` : ''}<p class="text-muted w-75 mx-auto">${item.deskripsi || ''}</p>${urlDoc ? `<a href="${urlDoc}" target="_blank" class="btn btn-outline-primary rounded-pill px-4 mt-3"><i class="fas fa-download me-2"></i>Unduh Dokumen SK</a>` : ''}`;
    container.innerHTML = html;
    if(loadingElement) loadingElement.style.display = 'none';
}

function renderBerita(list) {
    const container = document.getElementById('news-container');
    const loadingEl = document.getElementById('loading-news');
    if (loadingEl) loadingEl.style.display = 'none';
    if (!container || !list || list.length === 0) return;
    const latest = list.slice().reverse().slice(0, 6);
    let html = '';
    latest.forEach((item, idx) => {
        const originalIndex = list.length - 1 - idx; 
        let img = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/400x250?text=No+Image";
        let date = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : "";
        html += `<div class="col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${idx * 100}"><div class="card card-news h-100"><div class="news-img-wrapper"><img src="${img}" onerror="this.src='https://via.placeholder.com/400x250'"><div class="news-date-badge">${date}</div></div><div class="card-body p-4"><h5 class="news-title mb-3"><a href="bacaselengkapnya.html?id=${originalIndex}" class="text-decoration-none fw-bold lh-base">${item.judul}</a></h5><p class="small text-secondary">${item.ringkasan ? item.ringkasan.substring(0,90)+'...' : ''}</p><a href="bacaselengkapnya.html?id=${originalIndex}" class="btn btn-outline-primary btn-readmore w-100 mt-3">Baca Selengkapnya</a></div></div></div>`;
    });
    container.innerHTML = html;
}

function renderBeritaFull(list) {
    const container = document.getElementById('news-full-container');
    if (!container) return;
    container.innerHTML = '';
    if (!list || list.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">Belum ada berita.</div>';
        return;
    }
    const reversedList = list.slice().reverse();
    let html = '';
    reversedList.forEach((item, idx) => {
        const originalIndex = list.length - 1 - idx;
        let img = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/400x250?text=No+Image";
        let date = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : "";
        html += `<div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up"><div class="card card-news h-100 shadow-sm"><div class="news-img-wrapper" style="height:200px;"><img src="${img}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/400x250'"><div class="news-date-badge">${date}</div></div><div class="card-body p-3"><h5 class="news-title mb-2 fs-6"><a href="bacaselengkapnya.html?id=${originalIndex}" class="text-decoration-none fw-bold lh-base text-dark">${item.judul}</a></h5><p class="small text-muted mb-3" style="font-size:0.85rem;">${item.ringkasan ? item.ringkasan.substring(0,80)+'...' : ''}</p><a href="bacaselengkapnya.html?id=${originalIndex}" class="btn btn-sm btn-outline-primary w-100 rounded-pill">Baca Selengkapnya</a></div></div></div>`;
    });
    container.innerHTML = html;
}

function renderDetailBerita(list) {
    const id = getQueryParam('id');
    if(id === null || !list || !list[id]) { 
        const contentEl = document.getElementById('detail-content');
        if(contentEl) contentEl.innerHTML = "<div class='text-center py-5 text-muted'><em>Berita tidak ditemukan.</em></div>";
        const titleEl = document.getElementById('detail-title');
        if(titleEl) titleEl.innerText = "404 Not Found";
        return; 
    }
    const item = list[id];
    const titleEl = document.getElementById('detail-title');
    if(titleEl) titleEl.innerText = item.judul;
    const dateEl = document.getElementById('detail-date');
    if(dateEl) {
        let dateStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', dateOptions) : "-";
        dateEl.innerHTML = `<i class="far fa-calendar-alt me-1"></i> ${dateStr} <span class="mx-2">|</span> <i class="fas fa-user-edit me-1 text-primary"></i> Oleh: Humas LPKA Kutoarjo`;
    }
    const imgEl = document.getElementById('detail-img');
    if(imgEl) { imgEl.src = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/800x500?text=No+Preview"; }
    const rawText = item.isi || "";
    let paragraphs = rawText.split('\n').filter(p => p.trim() !== "");
    let htmlContent = "";
    let insertIndex2 = Math.floor(paragraphs.length / 3);
    let insertIndex3 = Math.floor(2 * paragraphs.length / 3);
    if (paragraphs.length <= 2) { insertIndex2 = 0; insertIndex3 = 1; }
    paragraphs.forEach((p, idx) => {
        htmlContent += `<p>${p}</p>`;
        if (idx === insertIndex2 && item.gambar2) { let img2 = fixGoogleDriveImage(item.gambar2); if(img2) htmlContent += `<div class="text-center my-4"><img src="${img2}" class="detail-extra-img img-fluid rounded shadow-sm" alt="Dokumentasi 2"></div>`; }
        if (idx === insertIndex3 && item.gambar3) { let img3 = fixGoogleDriveImage(item.gambar3); if(img3) htmlContent += `<div class="text-center my-4"><img src="${img3}" class="detail-extra-img img-fluid rounded shadow-sm" alt="Dokumentasi 3"></div>`; }
    });
    const contentEl = document.getElementById('detail-content');
    if(contentEl) contentEl.innerHTML = htmlContent;
    const btnContainer = document.getElementById('detail-extra-buttons');
    if (btnContainer) {
        if (item.link_publikasi && item.link_publikasi.trim() !== "") { 
            btnContainer.innerHTML = `<div class="card bg-light border-0 p-4 border-start border-5 border-success shadow-sm"><div class="d-flex align-items-center"><div class="me-3 text-success"><i class="fas fa-file-pdf fa-2x"></i></div><div><h6 class="fw-bold text-dark mb-1">Lampiran / Tautan Terkait</h6><a href="${item.link_publikasi}" target="_blank" class="btn btn-success btn-sm px-4 rounded-pill fw-bold"><i class="fas fa-external-link-alt me-2"></i> Buka Tautan</a></div></div></div>`; 
        } else { btnContainer.innerHTML = ""; }
    }
}

function renderVideoSidebar(list) {
    const container = document.getElementById('sidebar-video-container');
    if(!container) return;
    const limited = list ? list.slice(0, 2) : [];
    let html = '';
    limited.forEach((item) => {
        const vidId = getYoutubeId(item.link || item.url);
        const thumb = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : '';
        html += `<a href="${item.link}" target="_blank" class="sidebar-video-card mb-3 d-block position-relative"><img src="${thumb}" class="w-100 rounded"><div class="position-absolute top-50 start-50 translate-middle text-white"><i class="fab fa-youtube fa-3x"></i></div></a>`;
    });
    container.innerHTML = html;
}

function renderLayananSpesifik(type) {
    const container = document.getElementById('service-content-area');
    if (!container) return;
    let content = '';
    if (type === 'kunjungan') {
        content = `<div class="text-primary mb-3"><i class="fas fa-user-friends fa-4x"></i></div><h2 class="fw-bold text-dark mb-4">Layanan Kunjungan ABH</h2><div class="alert alert-info py-3 px-4 d-inline-block text-start" style="max-width:600px;"><h5 class="fw-bold mb-3"><i class="far fa-calendar-check me-2"></i>Jadwal Kunjungan:</h5><ul class="mb-0 fs-5"><li><strong>Rabu:</strong> 09.00 - 11.00 WIB</li><li><strong>Sabtu:</strong> 09.00 - 11.00 WIB</li></ul></div><p class="text-danger fw-bold mt-3"><i class="fas fa-exclamation-circle me-1"></i> Tanggal merah / Libur Nasional layanan ditiadakan.</p>`;
    } 
    else if (type === 'hukum') { content = `<div class="text-secondary mb-3"><i class="fas fa-tools fa-4x"></i></div><h2 class="fw-bold text-dark mb-3">Bantuan Hukum</h2><p class="text-muted fs-5">Mohon maaf layanan belum tersedia, sedang dalam tahap pengembangan.</p>`; } 
    else if (type === 'reintegrasi') { content = `<div class="text-secondary mb-3"><i class="fas fa-hard-hat fa-4x"></i></div><h2 class="fw-bold text-dark mb-3">Reintegrasi Sosial</h2><p class="text-muted fs-5">Mohon maaf layanan belum tersedia, sedang dalam tahap pengembangan.</p>`; } 
    else if (type === 'pengaduan') { content = `<div class="text-success mb-3"><i class="fas fa-headset fa-4x"></i></div><h2 class="fw-bold text-dark mb-4">Layanan Pengaduan</h2><p class="fs-5">Hubungi kami melalui WhatsApp:</p><a href="https://wa.me/6285868175592" class="btn btn-success rounded-pill px-4 fw-bold"><i class="fab fa-whatsapp me-2"></i> 0858-6817-5592</a>`; } 
    container.innerHTML = `<div class="col-lg-8"><div class="card p-5 shadow border-0 rounded-4 text-center">${content}</div></div>`;
}

function openDocPreview(title, url) {
    if(!url) { alert("Link dokumen tidak valid."); return; }
    document.getElementById('docModalTitle').innerText = title;
    document.getElementById('docFrame').src = getPreviewLink(url);
    const modalEl = document.getElementById('docPreviewModal');
    if(modalEl && typeof bootstrap !== 'undefined') new bootstrap.Modal(modalEl).show();
    else window.open(url, '_blank');
}

// Helpers
function fixGoogleDriveImage(url) {
    if (!url) return "";
    const match = url.match(/(?:d\/|id=)([\w-]+)/);
    return match && match[1] ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
}
function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}
function getPreviewLink(url) {
    if (!url) return "";
    const match = url.match(/(?:d\/|id=)([\w-]+)/);
    return match && match[1] ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
// Tambahkan fungsi ini di bagian bawah interaktif.js
function updateSEOMeta(title, desc, image) {
    // Update Judul Browser
    document.title = title + " - LPKA Kutoarjo";

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc.substring(0, 160); // Ambil 160 karakter pertama

    // Update Open Graph (untuk share WA/FB)
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if(ogTitle) ogTitle.content = title;
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if(ogDesc) ogDesc.content = desc.substring(0, 160);

    let ogImg = document.querySelector('meta[property="og:image"]');
    if(ogImg && image) ogImg.content = image;
}

// PANGGIL FUNGSI INI DI DALAM renderDetailBerita
// Cari fungsi renderDetailBerita di interaktif.js, lalu tambahkan baris ini di bagian bawah fungsi tersebut:
/*
function renderDetailBerita(list) {
    // ... kode lama ...
    
    const item = list[id];
    
    // ... kode lama render HTML ...

    // --- TAMBAHAN UNTUK SEO ---
    if(item) {
       let img = fixGoogleDriveImage(item.gambar1);
       let ringkasan = item.ringkasan || item.isi || "Berita terkini LPKA Kutoarjo";
       updateSEOMeta(item.judul, ringkasan, img);
    }
}
*/

document.addEventListener('DOMContentLoaded', loadData);
