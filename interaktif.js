AOS.init({ once: true, duration: 800, offset: 100 });

// --- KONFIGURASI API (FINAL) ---
const API_URL = 'https://script.google.com/macros/s/AKfycbyVebJLnm3oM9bQvAY-qoT2qqhdn8tRYBKrPYwm6lDvhWazvopChCxsbnpefxqM-qY6/exec'; 

// Cache Key Baru (v12) untuk mengaktifkan fitur preview gambar
const CACHE_KEY = 'lpka_data_cache_v12_imgpreview'; 

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
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) {
            console.log("Mengambil data dari Cache...");
            globalData = JSON.parse(cachedData);
        } else {
            console.log("Mengambil data dari API...");
            const response = await fetch(API_URL);
            const data = await response.json();
            
            if (data.status === 'error') { 
                console.warn("Peringatan API:", data.message);
            }
            
            globalData = data;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(globalData));
        }

        console.log("Data Berhasil Dimuat:", globalData);
        setupSearchListener();
        
        const infoPublikData = globalData.infoPublik || globalData.infopublik || [];
        if(infoPublikData.length > 0) setupInfoPublikMenu(infoPublikData);

        const mainEl = document.querySelector('main');
        const pageId = mainEl ? mainEl.getAttribute('data-page') : 'home';
        
        if(document.getElementById('pejabat-container')) renderPejabat(globalData.pejabat); 
        if(document.getElementById('sidebar-video-container')) renderVideoSidebar(globalData.video);

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
        else if (pageId === 'infopublik') renderInfoPublik(infoPublikData);
        else if (pageId === 'berita') renderBeritaFull(globalData.berita);
        else if (pageId === 'bacaselengkapnya') renderDetailBerita(globalData.berita);
        else if (pageId === 'reintegrasi') {
            if (globalData.reintegrasi && globalData.reintegrasi.length > 0) {
                renderReintegrasi(globalData.reintegrasi);
            } else {
                const container = document.getElementById('service-content-area');
                if(container) container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">Data layanan reintegrasi belum tersedia di database.</h5></div>';
            }
        }
        else if (['kunjungan', 'hukum', 'pengaduan', 'layanan'].includes(pageId)) {
            if(pageId !== 'layanan') renderLayananSpesifik(pageId);
        }

        setTimeout(() => { AOS.refresh(); }, 500);

    } catch (error) {
        console.error("Critical Error pada loadData:", error);
        sessionStorage.removeItem(CACHE_KEY);
    } finally { 
        setTimeout(hideLoader, 300); 
    }
}

// ==========================================
// RENDER FUNCTION REINTEGRASI (IMAGE PREVIEW & POPUP)
// ==========================================
function renderReintegrasi(list) {
    const serviceContainer = document.getElementById('service-content-area');
    const regContainer = document.getElementById('registration-container');
    
    if (!serviceContainer) return;
    serviceContainer.innerHTML = '';
    if(regContainer) regContainer.innerHTML = '';

    if (!list || list.length === 0) {
        serviceContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Data layanan belum tersedia.</p></div>';
        return;
    }

    // --- LOGIKA CEK LINK FORM (Untuk Tombol Daftar) ---
    const firstItem = list[0];
    let rawLink = firstItem.link_form || firstItem.Link_Form || firstItem.link || "";
    let cleanLink = rawLink.toString().trim();
    const hasLink = (cleanLink.length > 0 && cleanLink !== "#");

    let btnHref = hasLink ? cleanLink : "javascript:void(0);";
    let btnTarget = hasLink ? 'target="_blank"' : '';
    let btnOnClick = hasLink ? '' : 'onclick="showDevPopup(); return false;"';

    if (regContainer) {
        regContainer.innerHTML = `
        <div class="col-lg-10">
            <div class="card bg-primary text-white border-0 shadow-lg rounded-4 overflow-hidden position-relative">
                <div class="card-body p-4 p-md-5 text-center position-relative" style="z-index:1;">
                    <h3 class="fw-bold mb-3"><i class="fas fa-laptop-file me-2"></i> Pendaftaran Online Terpadu</h3>
                    <p class="fs-5 mb-4 opacity-75">Sudah paham alurnya? Ajukan layanan reintegrasi (PB, CB, CMB, Asimilasi) sekarang.</p>
                    <a href="${btnHref}" ${btnTarget} ${btnOnClick} class="btn btn-warning btn-lg fw-bold rounded-pill px-5 shadow pulse-anim">
                        <i class="fas fa-paper-plane me-2"></i> ISI FORMULIR PENDAFTARAN
                    </a>
                </div>
                <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(45deg, rgba(0,0,0,0.3), transparent); pointer-events: none;"></div>
                <i class="fas fa-file-signature position-absolute" style="font-size: 15rem; color: rgba(255,255,255,0.05); bottom: -30px; right: -30px;"></i>
            </div>
        </div>`;
    }

    // --- RENDER LIST LAYANAN ---
    let html = '';
    list.forEach((item, idx) => {
        let judul = item.judul || item.Judul || "Layanan Reintegrasi";
        let deskripsi = item.deskripsi || item.Deskripsi || "Keterangan layanan.";
        let rawImg = item.link_gambar || item.Link_Gambar || item.gambar || "";
        let imgUrl = rawImg ? fixGoogleDriveImage(rawImg) : "https://via.placeholder.com/400x300?text=Roadmap+Layanan";
        
        // Escape judul agar aman dimasukkan ke onclick string
        let safeJudul = judul.replace(/'/g, "\\'"); 

        html += `
        <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up" data-aos-delay="${idx * 100}">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <div style="height: 300px; overflow: hidden; position: relative; background: #fff; border-bottom: 1px solid #f0f0f0;">
                    <img src="${imgUrl}" 
                         style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in; transition: transform 0.3s;" 
                         alt="${judul}" 
                         title="Klik untuk memperbesar alur"
                         onclick="showImagePreview('${imgUrl}', '${safeJudul}')">
                </div>
                <div class="card-body p-4 text-center">
                    <h5 class="fw-bold text-dark mb-3">${judul}</h5>
                    <div style="width: 40px; height: 3px; background: #eee; margin: 0 auto 15px;"></div>
                    <p class="text-muted small mb-0">${deskripsi}</p>
                    <div class="mt-3">
                         <small class="text-primary fw-bold" style="cursor:pointer;" onclick="showImagePreview('${imgUrl}', '${safeJudul}')">
                            <i class="fas fa-search-plus me-1"></i> Lihat Detail Alur
                         </small>
                    </div>
                </div>
            </div>
        </div>`;
    });
    serviceContainer.innerHTML = html;
}

// ==========================================
// FUNGSI POPUP PENGEMBANGAN (UNTUK TOMBOL DAFTAR)
// ==========================================
function showDevPopup() {
    const modalEl = document.getElementById('devPopupModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        alert("Mohon maaf, layanan sedang dalam tahap pengembangan.");
    }
}

// ==========================================
// FUNGSI POPUP PREVIEW GAMBAR (BARU!)
// ==========================================
function showImagePreview(url, title) {
    const modalEl = document.getElementById('imagePreviewModal');
    const imgEl = document.getElementById('previewImageTarget');
    const titleEl = document.getElementById('previewImageTitle');
    
    if (modalEl && imgEl) {
        // Set sumber gambar dan judul
        imgEl.src = url;
        if(titleEl) titleEl.innerText = title;
        
        // Tampilkan Modal
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
             // Fallback jika bootstrap error
            window.open(url, '_blank');
        }
    }
}


// ==========================================
// FUNGSI LAINNYA (TETAP SAMA)
// ==========================================
function renderInfoPublik(list) {
    const container = document.getElementById('infopublik-container');
    if (!container) return; 
    
    if (!list || !Array.isArray(list) || list.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">Data dokumen belum tersedia.</h5></div>`; 
        return; 
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeCategory = urlParams.get('kategori');
    let displayList = list;

    if (activeCategory) {
        displayList = list.filter(item => {
            const kat = item.kategori || item.Kategori || "";
            return kat.toString().toLowerCase() === activeCategory.toLowerCase();
        });
        const pageTitle = document.querySelector('h3.display-6');
        if(pageTitle) pageTitle.innerText = activeCategory;
    }

    if (displayList.length === 0) { 
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">Tidak ada dokumen untuk kategori ini.</h5></div>`; 
        return; 
    }

    let html = '';
    displayList.forEach((item) => {
        let title = item.namaDokumen || item.nama_dokumen || item.judul || "Dokumen";
        let link = item.linkDokumenFull || item.link || "#";
        let desc = item.deskripsiSingkat || item.deskripsi || "";
        let img = item.imageUrl || item.image_url || "";
        let cat = item.kategori || "";
        let kategoriBadge = cat ? `<span class="badge bg-warning text-dark mb-2">${cat}</span>` : '';
        let thumb = img ? `<img src="${fixGoogleDriveImage(img)}">` : `<div class="doc-icon"><i class="fas fa-file-pdf"></i></div>`;
        
        html += `
        <div class="col-md-6 col-lg-3" data-aos="fade-up">
            <div class="card card-doc" onclick="openDocPreview('${title.replace(/'/g, "\\'")}', '${link}')">
                <div class="doc-thumb">${thumb}<div class="doc-overlay"><i class="fas fa-eye text-white fa-2x"></i></div></div>
                <div class="card-body">${kategoriBadge}<h6 class="fw-bold text-primary mb-2 text-truncate" title="${title}">${title}</h6><p class="small text-muted mb-0">${desc}</p></div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function setupInfoPublikMenu(list) {
    const dropdown = document.getElementById('infoPublikDropdown');
    if (!dropdown || !list) return;
    const uniqueCategories = [...new Set(list.map(item => item.kategori || item.Kategori || ""))].filter(k => k && k.trim() !== "").sort();
    let html = '<li><a class="dropdown-item" href="infopublik.html">Semua Dokumen</a></li>';
    if (uniqueCategories.length > 0) {
        html += '<li><hr class="dropdown-divider"></li>';
        uniqueCategories.forEach(cat => { html += `<li><a class="dropdown-item" href="infopublik.html?kategori=${encodeURIComponent(cat)}">${cat}</a></li>`; });
    }
    dropdown.innerHTML = html;
}

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
    if (!keyword) { container.innerHTML = '<div class="alert alert-warning text-center">Silakan masukkan kata kunci.</div>'; if(subtitleEl) subtitleEl.innerText = ""; return; }
    if(titleEl) titleEl.innerText = `Hasil: "${keyword}"`;
    if(subtitleEl) subtitleEl.innerText = `Menampilkan hasil untuk "${keyword}"`;
    const lowerKeyword = keyword.toLowerCase();
    let results = [];
    const safeLower = (txt) => (txt || "").toString().toLowerCase();
    
    if (data.berita) data.berita.forEach((item, index) => { if (safeLower(item.judul).includes(lowerKeyword) || safeLower(item.isi).includes(lowerKeyword)) results.push({ type: 'BERITA', title: item.judul, desc: item.ringkasan || '', link: `bacaselengkapnya.html?id=${index}` }); });
    if (data.pejabat) data.pejabat.forEach(item => { if (safeLower(item.nama).includes(lowerKeyword)) results.push({ type: 'PEJABAT', title: item.nama, desc: item.jabatan || '', link: 'pejabat.html' }); });
    const infoPublikData = data.infoPublik || data.infopublik || [];
    infoPublikData.forEach(item => { let nama = item.namaDokumen || item.judul || ""; if (safeLower(nama).includes(lowerKeyword)) results.push({ type: 'DOKUMEN', title: nama, desc: item.kategori || '', link: item.linkDokumenFull || '#', isExternal: true }); });

    if (results.length === 0) { container.innerHTML = `<div class="text-center py-5"><h5 class="text-muted">Tidak ditemukan hasil.</h5></div>`; } 
    else {
        let html = '<div class="list-group shadow-sm border-0">';
        results.forEach(res => {
            let icon = res.type === 'BERITA' ? 'fa-newspaper' : (res.type === 'PEJABAT' ? 'fa-user-tie' : 'fa-file-pdf');
            let badgeClass = res.type === 'BERITA' ? 'bg-primary' : (res.type === 'PEJABAT' ? 'bg-success' : 'bg-warning text-dark');
            let target = res.isExternal ? 'target="_blank"' : '';
            html += `<a href="${res.link}" class="list-group-item list-group-item-action p-4 border-start border-4 border-primary mb-3 rounded shadow-sm" ${target}><div class="d-flex w-100 justify-content-between align-items-center mb-2"><h5 class="mb-1 fw-bold text-primary">${res.title}</h5><span class="badge ${badgeClass} rounded-pill"><i class="fas ${icon} me-1"></i> ${res.type}</span></div><p class="mb-1 text-secondary">${res.desc}</p></a>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }
}

function renderBanner(list) {
    const container = document.getElementById('banner-container');
    if (!list || list.length === 0) { container.innerHTML = `<div class="carousel-item active"><img src="https://via.placeholder.com/1200x600?text=Default" class="d-block w-100"></div>`; return; }
    let html = '';
    list.forEach((item, index) => {
        let activeClass = index === 0 ? 'active' : '';
        let imgUrl = fixGoogleDriveImage(item.gambar) || "https://via.placeholder.com/1200x600?text=No+Image";
        html += `<div class="carousel-item ${activeClass}"><img src="${imgUrl}" class="d-block w-100"><div class="carousel-caption"><h2 data-aos="fade-down">${item.judul}</h2><p class="lead mt-3" data-aos="fade-up">${item.deskripsi}</p><a href="#berita-section" class="btn btn-warning btn-banner shadow">Lihat Berita</a></div></div>`;
    });
    container.innerHTML = html;
}
function renderSejarah(list) {
    const container = document.getElementById('sejarah-container');
    const loadingElement = document.getElementById('loading-sejarah'); 
    if (!list || list.length === 0) { container.innerHTML = '<div class="text-center">Data sejarah belum tersedia.</div>'; if (loadingElement) loadingElement.style.display = 'none'; return; }
    let item = list[0]; 
    let paragraphs = (item.deskripsiSejarah || item.deskripsi || "").split(/\r?\n/).filter(p => p.trim() !== "");
    let contentHtml = "";
    let imgUtama = fixGoogleDriveImage(item.image || item.gambar || "");
    let imgTengah1 = fixGoogleDriveImage(item.gambarTengah1 || "");
    let imgTengah2 = fixGoogleDriveImage(item.gambarTengah2 || "");
    let idx1 = Math.floor(paragraphs.length / 3); let idx2 = Math.floor(2 * paragraphs.length / 3);
    paragraphs.forEach((p, i) => {
        contentHtml += `<p class="lh-lg mb-3" style="text-align:justify;">${p}</p>`;
        if (i === idx1 && imgTengah1) contentHtml += `<div class="row justify-content-center my-4"><div class="col-md-10"><img src="${imgTengah1}" class="img-fluid rounded-3 shadow-sm w-100"></div></div>`;
        if (i === idx2 && imgTengah2) contentHtml += `<div class="row justify-content-center my-4"><div class="col-md-10"><img src="${imgTengah2}" class="img-fluid rounded-3 shadow-sm w-100"></div></div>`;
    });
    container.innerHTML = `<div class="row justify-content-center"><div class="col-lg-10"><h2 class="fw-bold text-primary mb-4 text-center">${item.judul}</h2><div class="mb-5 text-center"><img src="${imgUtama}" class="img-fluid rounded-4 shadow-lg" style="max-height:500px; object-fit:cover;"></div><div class="text-secondary fs-5">${contentHtml}</div></div></div>`;
    if (loadingElement) loadingElement.style.display = 'none';
}
function renderPejabat(list) {
    const container = document.getElementById('pejabat-container');
    if(!container || !list || list.length === 0) { if(container) container.innerHTML = '<div class="text-center text-muted">Data tidak tersedia</div>'; return; }
    const kepala = list[0]; 
    const imgUrl = fixGoogleDriveImage(kepala.foto) || "https://via.placeholder.com/150x150";
    container.innerHTML = `<div class="kepala-container text-center p-3" onclick="window.location.href='pejabat.html'"><div class="kepala-img-container"><img src="${imgUrl}" class="kepala-img"></div><h5 class="fw-bold text-primary mb-1">${kepala.nama}</h5></div>`;
}
function renderPejabatFull(list) {
    const container = document.getElementById('pejabat-full-container');
    if(!container) return;
    container.innerHTML = '';
    if(!list || list.length === 0) { container.innerHTML = '<div class="col-12 text-center">Data pejabat belum tersedia.</div>'; return; }
    let html = '';
    list.forEach((p, idx) => { html += `<div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${idx * 100}"><div class="card card-pejabat"><div class="card-pejabat-img-wrapper"><img src="${fixGoogleDriveImage(p.foto)}" class="card-pejabat-img"></div><div class="card-pejabat-body"><h5 class="fw-bold text-primary mb-1 text-truncate">${p.nama}</h5><small class="text-muted fw-bold text-uppercase">${p.jabatan}</small></div></div></div>`; });
    container.innerHTML = html;
}
function renderVisiMisi(list) {
    const container = document.getElementById('visimisi-content-container');
    if(!container || !list || list.length === 0) { if(container) container.innerHTML = '<div class="text-center">Data belum tersedia.</div>'; return; }
    let html = '<div class="row">';
    let visiList = list.filter(item => item.kategori.toLowerCase().includes('visi'));
    let misiList = list.filter(item => item.kategori.toLowerCase().includes('misi'));
    html += '<div class="col-md-12 mb-4 text-center"><h4 class="fw-bold text-primary mb-3"><i class="fas fa-eye me-2"></i>VISI</h4>';
    visiList.forEach(v => { html += `<p class="lead fst-italic">"${v.konten}"</p>`; });
    html += '</div><div class="col-12"><hr class="my-4"></div><div class="col-md-12"><h4 class="fw-bold text-primary mb-3 text-center"><i class="fas fa-bullseye me-2"></i>MISI</h4><ul class="list-group list-group-flush">';
    misiList.forEach(m => { let points = m.konten.split(/\r?\n/); points.forEach(p => { if(p.trim() !== "") html += `<li class="list-group-item bg-transparent border-0 ps-0"><i class="fas fa-check-circle text-warning me-3"></i>${p}</li>`; }); });
    html += '</ul></div></div>';
    container.innerHTML = html;
}
function renderTupoksi(list) {
    const container = document.getElementById('tupoksi-container');
    const loadingElement = document.getElementById('loading-tupoksi');
    if (!container) return;
    if(!list || list.length === 0) { container.innerHTML = '<div class="text-center py-5">Data Tupoksi belum tersedia.</div>'; if(loadingElement) loadingElement.style.display = 'none'; return; }
    let html = '<div class="col-lg-10"><div class="accordion" id="accTupoksi">';
    list.forEach((item, idx) => {
        let kontenBersih = item.konten ? item.konten.replace(/\n/g, '<br>') : "Belum ada konten.";
        html += `<div class="accordion-item border-0 shadow-sm mb-3 rounded overflow-hidden"><h2 class="accordion-header"><button class="accordion-button ${idx !== 0 ? 'collapsed' : ''} fw-bold text-primary bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${idx}">${item.kategori}</button></h2><div id="collapse${idx}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#accTupoksi"><div class="accordion-body bg-white lh-lg text-secondary">${kontenBersih}</div></div></div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
    if (loadingElement) loadingElement.style.display = 'none';
}
function renderStruktur(list) {
    const container = document.getElementById('struktur-container');
    const loadingElement = document.getElementById('loading-struktur');
    if(!list || list.length === 0) { container.innerHTML = '<div class="text-center">Data struktur belum tersedia.</div>'; if(loadingElement) loadingElement.style.display = 'none'; return; }
    let item = list[0];
    let imgUrl = item.image ? fixGoogleDriveImage(item.image) : "";
    container.innerHTML = `<h4 class="mb-4 fw-bold text-dark">${item.judul || 'Struktur Organisasi'}</h4>${imgUrl ? `<img src="${imgUrl}" class="img-fluid border rounded shadow-sm mb-4" style="max-height:80vh;">` : ''}<p class="text-muted w-75 mx-auto">${item.deskripsi || ''}</p>`;
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
        let img = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/400x250";
        let date = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : "";
        html += `<div class="col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${idx * 100}"><div class="card card-news h-100"><div class="news-img-wrapper"><img src="${img}"><div class="news-date-badge">${date}</div></div><div class="card-body p-4"><h5 class="news-title mb-3"><a href="bacaselengkapnya.html?id=${originalIndex}" class="text-decoration-none fw-bold lh-base">${item.judul}</a></h5><p class="small text-secondary">${item.ringkasan ? item.ringkasan.substring(0,90)+'...' : ''}</p><a href="bacaselengkapnya.html?id=${originalIndex}" class="btn btn-outline-primary btn-readmore w-100 mt-3">Baca Selengkapnya</a></div></div></div>`;
    });
    container.innerHTML = html;
}
function renderBeritaFull(list) {
    const container = document.getElementById('news-full-container');
    if (!container) return;
    container.innerHTML = '';
    if (!list || list.length === 0) { container.innerHTML = '<div class="col-12 text-center">Belum ada berita.</div>'; return; }
    const reversedList = list.slice().reverse();
    let html = '';
    reversedList.forEach((item, idx) => {
        const originalIndex = list.length - 1 - idx;
        let img = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/400x250";
        let date = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : "";
        html += `<div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up"><div class="card card-news h-100 shadow-sm"><div class="news-img-wrapper" style="height:200px;"><img src="${img}" style="width:100%; height:100%; object-fit:cover;"><div class="news-date-badge">${date}</div></div><div class="card-body p-3"><h5 class="news-title mb-2 fs-6"><a href="bacaselengkapnya.html?id=${originalIndex}" class="text-decoration-none fw-bold lh-base text-dark">${item.judul}</a></h5><p class="small text-muted mb-3" style="font-size:0.85rem;">${item.ringkasan ? item.ringkasan.substring(0,80)+'...' : ''}</p><a href="bacaselengkapnya.html?id=${originalIndex}" class="btn btn-sm btn-outline-primary w-100 rounded-pill">Baca Selengkapnya</a></div></div></div>`;
    });
    container.innerHTML = html;
}
function renderDetailBerita(list) {
    const id = getQueryParam('id');
    if(id === null || !list || !list[id]) { document.getElementById('detail-title').innerText = "404 Not Found"; return; }
    const item = list[id];
    document.getElementById('detail-title').innerText = item.judul;
    const dateEl = document.getElementById('detail-date');
    if(dateEl) { let dateStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', dateOptions) : "-"; dateEl.innerHTML = `<i class="far fa-calendar-alt me-1"></i> ${dateStr} <span class="mx-2">|</span> Humas LPKA`; }
    const imgEl = document.getElementById('detail-img');
    if(imgEl) { imgEl.src = fixGoogleDriveImage(item.gambar1) || "https://via.placeholder.com/800x500"; }
    let htmlContent = "";
    (item.isi || "").split('\n').forEach(p => { if(p.trim() !== "") htmlContent += `<p>${p}</p>`; });
    document.getElementById('detail-content').innerHTML = htmlContent;
}
function renderVideoSidebar(list) {
    const container = document.getElementById('sidebar-video-container');
    if(!container) return;
    const limited = list ? list.slice(0, 2) : [];
    let html = '';
    limited.forEach(item => {
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
    if (type === 'kunjungan') { content = `<div class="text-primary mb-3"><i class="fas fa-user-friends fa-4x"></i></div><h2 class="fw-bold text-dark mb-4">Layanan Kunjungan ABH</h2><div class="alert alert-info py-3 px-4 d-inline-block text-start"><ul class="mb-0 fs-5"><li>Rabu: 09.00 - 11.00</li><li>Sabtu: 09.00 - 11.00</li></ul></div>`; } 
    else if (type === 'hukum') { content = `<div class="text-secondary mb-3"><i class="fas fa-tools fa-4x"></i></div><h2 class="fw-bold text-dark mb-3">Bantuan Hukum</h2><p class="text-muted fs-5">Sedang dalam tahap pengembangan.</p>`; } 
    else if (type === 'pengaduan') { content = `<div class="text-success mb-3"><i class="fas fa-headset fa-4x"></i></div><h2 class="fw-bold text-dark mb-4">Layanan Pengaduan</h2><a href="https://wa.me/6285868175592" class="btn btn-success rounded-pill px-4 fw-bold">WhatsApp Admin</a>`; } 
    container.innerHTML = `<div class="col-lg-8"><div class="card p-5 shadow border-0 rounded-4 text-center">${content}</div></div>`;
}
function openDocPreview(title, url) {
    if(!url) { alert("Link invalid."); return; }
    document.getElementById('docModalTitle').innerText = title;
    document.getElementById('docFrame').src = getPreviewLink(url);
    const modalEl = document.getElementById('docPreviewModal');
    if(modalEl && typeof bootstrap !== 'undefined') new bootstrap.Modal(modalEl).show(); else window.open(url, '_blank');
}
function fixGoogleDriveImage(url) { if (!url) return ""; const match = url.match(/(?:d\/|id=)([\w-]+)/); return match && match[1] ? `https://lh3.googleusercontent.com/d/${match[1]}` : url; }
function getYoutubeId(url) { if (!url) return null; const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/); return (match && match[2].length === 11) ? match[2] : null; }
function getPreviewLink(url) { if (!url) return ""; const match = url.match(/(?:d\/|id=)([\w-]+)/); return match && match[1] ? `https://drive.google.com/file/d/${match[1]}/preview` : url; }
function getQueryParam(param) { const urlParams = new URLSearchParams(window.location.search); return urlParams.get(param); }

document.addEventListener('DOMContentLoaded', loadData);
