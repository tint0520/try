// ====================================================================
// 它模擬了原本 Electron 後端的行為，但所有資料都只存在於記憶體中，
// 重新整理頁面後所有變更都會被重設。
// ====================================================================
(function() {
    // --- Sample Data ---
    const sampleCustomers = [
        { id: 'cust-1', name: '夢想咖啡館', contact: '陳經理', phone: '02-23456789', email: 'dreamcafe@example.com', source: '客戶介紹', address: '台北市信義區夢想路123號' },
        { id: 'cust-2', name: '未來科技公司', contact: '林小姐', phone: '03-5558888', email: 'future.tech@example.com', source: '官方網站', address: '新竹市科學園區創新路1號' }
    ];

    const sampleQuotations = [
        { id: 'quote-1', client: '夢想咖啡館', customerId: 'cust-1', project: '品牌官方網站設計', tel: '02-23456789', quoteDate: '2025-08-15', layoutDate: '2025-08-25', deadlineDate: '2025-09-10', status: 'confirmed', grandTotal: 125000, timestamp: '2025-08-15T10:00:00Z', items: [{ item: '網站設計', description: '全站視覺設計', unit: '式', cost: 80000, qty: 1, total: 80000 }, { item: '前端開發', description: 'RWD響應式網頁', unit: '式', cost: 40000, qty: 1, total: 40000 }], notes: ['提供1年保固'] },
        { id: 'quote-2', client: '未來科技公司', customerId: 'cust-2', project: '產品發表會主視覺設計', tel: '03-5558888', quoteDate: '2025-07-20', layoutDate: '2025-07-28', deadlineDate: '2025-08-05', status: 'sent', grandTotal: 63000, timestamp: '2025-07-20T14:30:00Z', items: [{ item: '主視覺設計', description: '包含Logo與標準字', unit: '組', cost: 60000, qty: 1, total: 60000 }], notes: [] }
    ];
    
    const sampleProjects = [
        { id: 'proj-1', quoteId: 'quote-1', name: '品牌官方網站設計', client: '夢想咖啡館', projectAmount: 125000, startDate: '2025-08-20', endDate: '2025-09-10', status: 'in_progress', timestamp: '2025-08-20T09:00:00Z', tasks: [{done: true, description: '首頁設計初稿', dueDate: '2025-08-28'}, {done: false, description: '完成所有頁面切版', dueDate: '2025-09-05'}] }
    ];

    const sampleTemplates = [
        { id: 'temp-1', name: '網站設計套組', descriptions: [{id: 'd1', text: '首頁視覺設計'}, {id: 'd2', text: '內頁版型設計 (5頁)'}, {id: 'd3', text: 'RWD 響應式網頁開發'}] },
        { id: 'temp-2', name: '平面設計', descriptions: [{id: 'd4', text: 'A4 DM 設計'}, {id: 'd5', text: '名片設計'}] }
    ];

    const sampleNotes = [
        { id: 'note-1', text: '專案完工後提供簡易後台操作說明(如需影片或一對一教學可加購)。', categories: ['通用', '設計'] },
        { id: 'note-2', text: '餐點照片需由客戶提供高解析度圖檔。', categories: ['餐飲'] }
    ];

    // In-memory "database"
    let allQuotations = JSON.parse(JSON.stringify(sampleQuotations));
    let allCustomers = JSON.parse(JSON.stringify(sampleCustomers));
    let allProjects = JSON.parse(JSON.stringify(sampleProjects));
    let allTemplates = JSON.parse(JSON.stringify(sampleTemplates));
    let allNotes = JSON.parse(JSON.stringify(sampleNotes));

    // Mock API
    window.electronAPI = {
        getQuotations: () => Promise.resolve(JSON.parse(JSON.stringify(allQuotations))),
        getQuotation: (id) => Promise.resolve(JSON.parse(JSON.stringify(allQuotations.find(q => q.id === id)))),
        saveQuotation: (quote) => {
            const index = allQuotations.findIndex(q => q.id === quote.id);
            if (index > -1) {
                allQuotations[index] = quote;
            } else {
                allQuotations.unshift(quote);
            }
            return Promise.resolve();
        },
        deleteQuotation: (id) => {
            allQuotations = allQuotations.filter(q => q.id !== id);
            return Promise.resolve();
        },
        getCustomers: () => Promise.resolve(JSON.parse(JSON.stringify(allCustomers))),
        saveCustomers: (customers) => {
            allCustomers = customers;
            return Promise.resolve();
        },
        getProjects: () => Promise.resolve(JSON.parse(JSON.stringify(allProjects))),
        getProject: (id) => Promise.resolve(JSON.parse(JSON.stringify(allProjects.find(p => p.id === id)))),
        saveProject: (project) => {
             const index = allProjects.findIndex(p => p.id === project.id);
            if (index > -1) {
                allProjects[index] = project;
            } else {
                allProjects.unshift(project);
            }
            return Promise.resolve();
        },
        deleteProject: (id) => {
            allProjects = allProjects.filter(p => p.id !== id);
            return Promise.resolve();
        },
        getTemplates: () => Promise.resolve(JSON.parse(JSON.stringify(allTemplates))),
        saveTemplates: (templates) => {
            allTemplates = templates;
            return Promise.resolve();
        },
        getNotes: () => Promise.resolve(JSON.parse(JSON.stringify(allNotes))),
        saveNotes: (notes) => {
            allNotes = notes;
            return Promise.resolve();
        }
    };
})();


// ====================================================================
// --- Application Logic (Original script.js) ---
// 以下為您原始的 script.js 檔案，現在它會使用上面定義的模擬 API。
// ====================================================================

// 全局變量
let currentQuoteId = null;
let currentViewingQuoteId = null;
let isQuoteModified = false;
let isProjectModified = false;
let charts = {};
let allCustomers = [];
let allQuotations = []; 
let allProjects = [];
let allTemplates = [];
let allNotes = []; // 補充說明
let calendarDate = new Date();

// 狀態與類別定義
const QUOTATION_STATUSES = { draft: '草稿', sent: '已發送', confirmed: '已確認', rejected: '已拒絕', expired: '已過期' };
const PROJECT_STATUSES = { pending: '待開始', in_progress: '進行中', completed: '已完成', on_hold: '暫停' };
const NOTE_CATEGORIES = ['通用', '設計', '餐飲', '美容', '製造', '醫療', '電子', '其他'];

// Chart.js 全域樣式設定
Chart.defaults.font.family = 'Arial, "Noto Sans TC", sans-serif';
Chart.defaults.color = '#6B7280';
Chart.defaults.plugins.legend.position = 'bottom';

// 生成UUID
function uuidv4() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

// 狀態訊息提示
function showStatusMessage(message, type = 'info') { alert(`[${type.toUpperCase()}] ${message}`); console.log(`[${type.toUpperCase()}] ${message}`); }

// ====================================================================
// 頁面導航與初始化
// ====================================================================
function switchPage(pageId) {
    if (document.getElementById('quotationpage').classList.contains('active') && isQuoteModified) { if (!confirm('您有未儲存的報價單修改。確定要離開嗎？')) { return; } }
    if (document.getElementById('projectspage').classList.contains('active') && document.getElementById('projectFormContainer').style.display !== 'none' && isProjectModified) { if (!confirm('您有未儲存的專案修改。確定要離開嗎？')) { return; } }
    
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if(navBtn) {
        navBtn.classList.add('active');
        // Update mobile header title
        const pageTitle = navBtn.textContent;
        const mobileTitleEl = document.getElementById('mobile-page-title');
        if (mobileTitleEl) mobileTitleEl.textContent = pageTitle;
    }
    
    isQuoteModified = false;
    isProjectModified = false;
}

function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-menu-overlay');

    function closeMenu() {
        sidebar.classList.remove('is-visible');
        overlay.classList.remove('is-visible');
    }

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-visible');
        overlay.classList.toggle('is-visible');
    });

    overlay.addEventListener('click', closeMenu);
    
    // Close menu when a nav button is clicked
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', closeMenu);
    });
}

// ====================================================================
// 儀表板 (Dashboard)
// ====================================================================
async function renderDashboard() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const ongoingProjects = allProjects.filter(p => p.status === 'in_progress').length;
    const pendingQuotes = allQuotations.filter(q => q.status === 'sent').length;
    const monthlyRevenue = allProjects
        .filter(p => p.startDate && new Date(p.startDate) >= firstDayOfMonth && (p.status === 'in_progress' || p.status === 'completed'))
        .reduce((sum, p) => sum + (p.projectAmount || 0), 0);
    const monthlyQuotes = allQuotations.filter(q => q.quoteDate && new Date(q.quoteDate) >= firstDayOfMonth).length;

    document.getElementById('kpi-ongoing-projects').textContent = ongoingProjects;
    document.getElementById('kpi-pending-quotes').textContent = pendingQuotes;
    document.getElementById('kpi-monthly-revenue').textContent = `NT$ ${monthlyRevenue.toLocaleString()}`;
    document.getElementById('kpi-monthly-quotes').textContent = monthlyQuotes;

    renderRevenueChart();
    renderStatusPieChart();
    renderRecentProjects();
    renderRecentCustomers();
}
function renderRevenueChart() {
    const labels = [];
    const quoteData = [];
    const contractData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth();
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        labels.push(monthStr);
        const monthlyQuotesTotal = allQuotations.filter(q => q.quoteDate && q.quoteDate.startsWith(monthStr)).reduce((sum, q) => sum + (q.grandTotal || 0), 0);
        quoteData.push(monthlyQuotesTotal);
        const monthlyContractsTotal = allProjects.filter(p => p.startDate && p.startDate.startsWith(monthStr)).reduce((sum, p) => sum + (p.projectAmount || 0), 0);
        contractData.push(monthlyContractsTotal);
    }
    if (charts.revenue) charts.revenue.destroy();
    const ctx = document.getElementById('revenueChart').getContext('2d');
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [ { label: '報價金額', data: quoteData, backgroundColor: '#D1D5DB', borderRadius: 4 }, { label: '簽約金額', data: contractData, backgroundColor: '#1F2937', borderRadius: 4 } ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}
function renderStatusPieChart() {
    const statusCounts = allQuotations.reduce((acc, quote) => { const status = quote.status || 'draft'; acc[status] = (acc[status] || 0) + 1; return acc; }, {});
    const labels = Object.keys(statusCounts).map(key => QUOTATION_STATUSES[key]);
    const data = Object.values(statusCounts);
    if (charts.statusPie) charts.statusPie.destroy();
    const ctx = document.getElementById('statusPieChart').getContext('2d');
    charts.statusPie = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#6B7280', '#3B82F6', '#22C55E', '#DC2626', '#F97316'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function renderRecentProjects() {
    const container = document.getElementById('recent-projects-list');
    container.innerHTML = '';
    allProjects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5).forEach(p => {
        const item = `<div class="quick-access-list-item"><div class="item-main"><div class="item-title">${p.name || '未命名專案'}</div><div class="item-subtitle">${p.client || '未知客戶'}</div></div><div class="item-side"><div>NT$ ${(p.projectAmount || 0).toLocaleString()}</div><div class="item-subtitle">${PROJECT_STATUSES[p.status] || ''}</div></div></div>`;
        container.insertAdjacentHTML('beforeend', item);
    });
}
function renderRecentCustomers() {
    const container = document.getElementById('recent-customers-list');
    container.innerHTML = '';
    const recentQuotes = allQuotations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,10);
    const recentCustomers = {};
    recentQuotes.forEach(q => {
        if(q.customerId && !recentCustomers[q.customerId]) {
            const customer = allCustomers.find(c => c.id === q.customerId);
            if (customer) { recentCustomers[q.customerId] = { ...customer, lastActivity: new Date(q.timestamp).toLocaleDateString() }; }
        }
    });
    Object.values(recentCustomers).slice(0, 5).forEach(c => {
         const item = `<div class="quick-access-list-item"><div class="item-main"><div class="item-title">${c.name}</div><div class="item-subtitle">${c.contact || 'N/A'}</div></div><div class="item-side"><div>最近活動</div><div class="item-subtitle">${c.lastActivity}</div></div></div>`;
        container.insertAdjacentHTML('beforeend', item);
    });
}

// ====================================================================
// 客戶管理
// ====================================================================
async function showCustomerForm(show, customer = null) {
    const formContainer = document.getElementById('customerFormContainer');
    const listContainer = document.getElementById('customerListContainer');
    const quotesSection = document.getElementById('customer-quotes-section');
    listContainer.style.display = show ? 'none' : 'block';
    formContainer.style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('customerForm').reset();
        if (customer) {
            document.getElementById('customerFormTitle').textContent = '編輯客戶';
            document.getElementById('customerIdField').value = customer.id;
            document.getElementById('customerNameField').value = customer.name;
            document.getElementById('customerContactField').value = customer.contact || '';
            document.getElementById('customerPhoneField').value = customer.phone || '';
            document.getElementById('customerEmailField').value = customer.email || '';
            document.getElementById('customerSourceField').value = customer.source || '';
            document.getElementById('customerAddressField').value = customer.address || '';
            quotesSection.style.display = 'block';
            await renderCustomerQuotes(customer.id);
        } else {
            document.getElementById('customerFormTitle').textContent = '新增客戶';
            document.getElementById('customerIdField').value = '';
            quotesSection.style.display = 'none';
            document.getElementById('customerQuotesListContainer').innerHTML = '';
        }
    }
}
async function renderCustomerQuotes(customerId) { const container = document.getElementById('customerQuotesListContainer'); const customerQuotes = allQuotations.filter(q => q.customerId === customerId); renderQuotesList(customerQuotes, container, true); }
async function loadAndRenderCustomers() {
    try {
        allCustomers = await window.electronAPI.getCustomers();
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        const filteredCustomers = allCustomers.filter(c => (c.name && c.name.toLowerCase().includes(searchTerm)) || (c.contact && c.contact.toLowerCase().includes(searchTerm)));
        renderCustomerList(filteredCustomers);
    } catch (error) { console.error("載入客戶列表失敗:", error); showStatusMessage("載入客戶列表失敗", "error"); }
}
function renderCustomerList(customers) {
    const container = document.getElementById('customerCards');
    container.innerHTML = '';
    if (customers.length === 0) { container.innerHTML = '<p class="no-quotes">目前沒有符合條件的客戶。</p>'; return; }
    customers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `<h3>${customer.name || '未命名客戶'}</h3><p><strong>聯絡人:</strong> ${customer.contact || 'N/A'}</p><p><strong>電話:</strong> ${customer.phone || 'N/A'}</p><p><strong>來源:</strong> ${customer.source || 'N/A'}</p><div class="card-actions"><button class="edit-customer-btn" data-id="${customer.id}">編輯</button></div>`;
        container.appendChild(card);
    });
}
async function saveCustomer(event) {
    event.preventDefault();
    const customerId = document.getElementById('customerIdField').value;
    const customerData = { id: customerId || uuidv4(), name: document.getElementById('customerNameField').value.trim(), contact: document.getElementById('customerContactField').value.trim(), phone: document.getElementById('customerPhoneField').value.trim(), email: document.getElementById('customerEmailField').value.trim(), source: document.getElementById('customerSourceField').value.trim(), address: document.getElementById('customerAddressField').value.trim() };
    if (!customerData.name) { showStatusMessage("客戶/公司名稱為必填項。", "error"); return; }
    let customers = await window.electronAPI.getCustomers();
    if (customerId) { const index = customers.findIndex(c => c.id === customerId); if (index > -1) customers[index] = customerData; } else { customers.push(customerData); }
    try {
        await window.electronAPI.saveCustomers(customers);
        showStatusMessage("客戶資料已儲存！(展示模式：重新整理後將會重設)", "success");
        await loadAndRenderCustomers();
        showCustomerForm(false);
    } catch (error) { showStatusMessage("儲存客戶失敗。", "error"); console.error("儲存客戶失敗:", error); }
}
async function deleteCustomer(id) {
    if (!confirm('確定要刪除這位客戶嗎？')) { return; }
    try {
        let customers = await window.electronAPI.getCustomers();
        const updatedCustomers = customers.filter(c => c.id !== id);
        await window.electronAPI.saveCustomers(updatedCustomers);
        showStatusMessage("客戶已刪除！(展示模式：重新整理後將會重設)", "success");
        await loadAndRenderCustomers();
    } catch (error) { showStatusMessage("刪除客戶失敗。", "error"); console.error("刪除客戶失敗:", error); }
}

// ====================================================================
// 報價單
// ====================================================================
function resetQuotationForm() {
    document.getElementById('clientName').value = ''; document.getElementById('customerId').value = '';
    document.getElementById('projectName').value = ''; document.getElementById('telNumber').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quoteDate').value = today; document.getElementById('layoutDate').value = ''; document.getElementById('deadlineDate').value = '';
    document.getElementById('discount').textContent = '0';
    document.getElementById('itemTable').querySelector('tbody').innerHTML = '';
    document.getElementById('noteList').innerHTML = `<li contenteditable="true">簽約後支付50%(啟動金),專案完成驗收後支付餘額。</li><li contenteditable="true">客戶應於收到初稿3日內通知有無需要修改,如未於3日內通知則視為校稿通過。</li><li contenteditable="true">請於訂金確認後5日內提供完整資料與圖片素材,若因資料未齊而導致進度延誤,將順延整體製作時程。若需協助整理商品文字或重新撰寫,視需求可另外加價協助撰文與分類設計。</li><li contenteditable="true">如在報價簽署後取消該工作,將不予退還預付款。</li><li contenteditable="true">客戶需遵守本報價單的協議條款,簽署報價表明客戶已了解並接受協議條款內容。</li><li contenteditable="true">專案採用 SHOPLINE 平台進行建置,將依平台功能與限制設計,無法完全比擬客製化網站之自由度。</li><li contenteditable="true">設計成果及網站內容之最終使用權歸客戶所有,設計方保留設計作品之展示與作品集權利。</li><li contenteditable="true">專案完工後提供簡易後台操作說明(如需影片或一對一教學可加購)</li><li contenteditable="true">交付後提供14天基礎功能保固(限於設定錯誤或系統異常修正,不包含新增需求或內容變更)。</li><li contenteditable="true">首頁視覺、活動 banner、分類主圖等,於需求確認後15個工作天內初稿提交,包含3次修改內交付完成。若同時包含多圖,依實際設計數量與排程協議調整。</li><li contenteditable="true">設定轉址(301 Redirect),將於網站上線後3~5個工作天內完成設定與測試。客戶需協助提供原站 URL 清單或後台登入資訊,以利轉向設定作業。(無轉址需求請忽略)</li><li contenteditable="true">基於資訊安全及個資保護考量,金流(如信用卡、ATM轉帳、LINE Pay)與物流(如黑貓、7-11、全家)相關設定,建議由客戶自行於SHOPLINE 後台完成設定。SHOPLINE 提供完善的圖文教學與客服支援,設定流程簡單,且可依實際營業需求彈性調整。</li><li contenteditable="true">設計效果將依 SHOPLINE平台架構進行調整,視覺與功能無法完全對應客製化網站,屬合理差異範圍,雙方應事前確認可接受內容範圍</li><li contenteditable="true">每個項目(如首頁、商品圖等)提供1次初稿+3次小幅修正,超過次數或重新設計則另行報價。</li><li contenteditable="true">客戶提供之商品資料與圖片、文案,應以可直接應用於設計/排版的格式為主。若需協助整理、潤飾或排版調整,將酌收加值服務費。</li><li contenteditable="true">合作過程中如需非原本報價範圍的重大改版或素材重製,將另外評估加價與時程。</li><li contenteditable="true">整體工期大約是五到六週左右會完成,但會依您提供資料與確認的速度做彈性調整,如果有任何延遲提供的部分,也會順延交付時間,以確保內容品質與完整度。</li><li contenteditable="true">尾款請於網站上線與交件前全數結清。上線後如需內容變更將另行報價。</li><li contenteditable="true">聯絡與回覆時間:週一至週五10:00-18:00 為正常上班時段,將於此時段內回覆訊息與提供進度回報。如非緊急事項,請避免於晚上、假日聯繫,將統一於上班時間回覆處理。如有臨時狀況需安排假日工作,將視情況酌收急件處理費,並需雙方提前協議。</li>`;
    updateSummary(); isQuoteModified = false;
}
function updateSummary() {
    let subtotal = 0;
    document.querySelectorAll('#itemTable tbody tr').forEach(row => { const cost = parseFloat(row.querySelector('.cost input').value) || 0; const qty = parseInt(row.querySelector('.qty input').value) || 0; row.querySelector('.total').textContent = (cost * qty).toLocaleString(); subtotal += (cost * qty); });
    const discount = parseFloat(document.getElementById('discount').textContent.replace(/,/g, '')) || 0;
    const tax = Math.round((subtotal - discount) * 0.05); const grandTotal = (subtotal - discount) + tax;
    document.getElementById('subtotal').textContent = subtotal.toLocaleString(); document.getElementById('tax').textContent = tax.toLocaleString(); document.getElementById('grand-total').textContent = grandTotal.toLocaleString();
}
function addNewItemRow(itemData = {}) {
    const newRow = document.getElementById('itemTable').querySelector('tbody').insertRow();
    newRow.innerHTML = `
        <td data-label="Item/項目" contenteditable="true">${itemData.item || ''}</td>
        <td data-label="Description/說明" contenteditable="true" style="white-space: pre-wrap;">${itemData.description || ''}</td>
        <td data-label="Unit/單位" contenteditable="true">${itemData.unit || ''}</td>
        <td data-label="Cost/單價" class="cost"><input type="number" value="${itemData.cost || 0}"></td>
        <td data-label="Qty/數量" class="qty"><input type="number" value="${itemData.qty || 1}"></td>
        <td data-label="Total/複價" class="total">0</td>
    `;
    isQuoteModified = true;
    updateSummary();
}
function deleteItemRow() { const rows = document.querySelectorAll('#itemTable tbody tr'); if (rows.length > 0) { rows[rows.length - 1].remove(); isQuoteModified = true; updateSummary(); } }
function addNewNote(text = '新的補充說明...') { const li = document.createElement('li'); li.contentEditable = 'true'; li.textContent = text; document.getElementById('noteList').appendChild(li); isQuoteModified = true; }
function deleteNote() { const notes = document.querySelectorAll('#noteList li'); if (notes.length > 0) { notes[notes.length - 1].remove(); isQuoteModified = true; } }
async function saveQuotation() {
    const clientName = document.getElementById('clientName').value.trim(); if (!clientName) { showStatusMessage('客戶名稱不可為空！', 'error'); return; }
    const items = Array.from(document.querySelectorAll('#itemTable tbody tr')).map(r => ({ item: r.children[0].textContent.trim(), description: r.children[1].textContent.trim(), unit: r.children[2].textContent.trim(), cost: parseFloat(r.querySelector('.cost input').value) || 0, qty: parseInt(r.querySelector('.qty input').value) || 0, total: parseFloat(r.children[5].textContent.replace(/,/g, '')) || 0 }));
    const notes = Array.from(document.querySelectorAll('#noteList li')).map(n => n.textContent.trim());
    const quotation = { id: currentQuoteId || uuidv4(), client: clientName, customerId: document.getElementById('customerId').value, project: document.getElementById('projectName').value.trim(), tel: document.getElementById('telNumber').value.trim(), quoteDate: document.getElementById('quoteDate').value, layoutDate: document.getElementById('layoutDate').value, deadlineDate: document.getElementById('deadlineDate').value, items, notes, subtotal: parseFloat(document.getElementById('subtotal').textContent.replace(/,/g, '')) || 0, discount: parseFloat(document.getElementById('discount').textContent.replace(/,/g, '')) || 0, tax: parseFloat(document.getElementById('tax').textContent.replace(/,/g, '')) || 0, grandTotal: parseFloat(document.getElementById('grand-total').textContent.replace(/,/g, '')) || 0, timestamp: new Date().toISOString(), status: document.getElementById('statusSelect').value };
    let customerId = document.getElementById('customerId').value; let isNewCustomer = false;
    const existingCustomer = allCustomers.find(c => c && (c.id === customerId || (c.name && c.name.toLowerCase() === clientName.toLowerCase())));
    if (existingCustomer) { customerId = existingCustomer.id; if (quotation.tel && existingCustomer.phone !== quotation.tel) { existingCustomer.phone = quotation.tel; await window.electronAPI.saveCustomers(allCustomers); } } else { const newCustomer = { id: uuidv4(), name: clientName, phone: quotation.tel, contact: '', email: '', address: '', source: '來自報價單' }; allCustomers.push(newCustomer); await window.electronAPI.saveCustomers(allCustomers); customerId = newCustomer.id; isNewCustomer = true; }
    quotation.customerId = customerId;
    try {
        await window.electronAPI.saveQuotation(quotation); isQuoteModified = false; showStatusMessage('報價單已儲存！(展示模式：重新整理後將會重設)', 'success');
        allQuotations = await window.electronAPI.getQuotations();
        if (quotation.status === 'confirmed') {
            const allProjects = await window.electronAPI.getProjects();
            const projectExists = allProjects.some(p => p.quoteId === quotation.id);
            if (!projectExists && confirm('這份報價單已確認，您要為此建立一個新專案嗎？')) { await convertQuoteToProject(quotation.id, true); return; }
        }
        if (isNewCustomer) { showStatusMessage(`已為新客戶 "${clientName}" 建立資料。建議至客戶管理頁面補全詳細資訊。`, 'info'); }
        switchPage('quotationlistpage');
        loadAndFilterQuotes();
    } catch (error) { showStatusMessage('儲存報價單時發生錯誤。', 'error'); console.error("儲存報價單流程錯誤:", error); }
}
async function loadQuotationForEdit(id) {
    const quote = await window.electronAPI.getQuotation(id); if (!quote) { showStatusMessage('找不到指定的報價單。', 'error'); return; }
    currentQuoteId = quote.id;
    document.getElementById('clientName').value = quote.client; document.getElementById('customerId').value = quote.customerId || '';
    document.getElementById('projectName').value = quote.project; document.getElementById('telNumber').value = quote.tel;
    document.getElementById('quoteDate').value = quote.quoteDate; document.getElementById('layoutDate').value = quote.layoutDate;
    document.getElementById('deadlineDate').value = quote.deadlineDate; document.getElementById('discount').textContent = (quote.discount || 0).toLocaleString();
    document.getElementById('statusSelect').value = quote.status || 'draft';
    const itemBody = document.getElementById('itemTable').querySelector('tbody'); itemBody.innerHTML = '';
    (quote.items || []).forEach(item => addNewItemRow(item));
    const noteList = document.getElementById('noteList'); noteList.innerHTML = '';
    (quote.notes || []).forEach(note => { const li = document.createElement('li'); li.contentEditable = 'true'; li.textContent = note; noteList.appendChild(li); });
    updateSummary(); isQuoteModified = false; switchPage('quotationpage');
}
async function loadAndFilterQuotes() {
    try {
        allQuotations = await window.electronAPI.getQuotations(); 
        const searchTerm = document.getElementById('quoteSearch').value.toLowerCase();
        const sortValue = document.getElementById('sortSelect').value;
        const statusFilter = document.getElementById('statusFilter').value;
        let filtered = allQuotations.filter(q => (statusFilter === 'all' || (q.status || 'draft') === statusFilter) && (!searchTerm || (q.client && q.client.toLowerCase().includes(searchTerm)) || (q.project && q.project.toLowerCase().includes(searchTerm))));
        switch(sortValue) {
            case 'date-newest': filtered.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); break;
            case 'date-oldest': filtered.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)); break;
            case 'client-asc': filtered.sort((a,b) => (a.client || '').localeCompare(b.client || '', 'zh-TW')); break;
            case 'total-highest': filtered.sort((a,b) => (b.grandTotal || 0) - (a.grandTotal || 0)); break;
            case 'total-lowest': filtered.sort((a,b) => (a.grandTotal || 0) - (b.grandTotal || 0)); break;
        }
        renderQuotesList(filtered, document.getElementById('quotesListContainer'));
    } catch (error) { console.error("載入或篩選報價單時出錯:", error); showStatusMessage("載入報價單列表失敗", "error"); }
}
function renderQuotesList(quotes, container, isSubList = false) {
    container.innerHTML = '';
    if (quotes.length === 0) { container.innerHTML = `<p class="no-quotes">${isSubList ? '這位客戶沒有歷史報價單。' : '沒有符合條件的報價單。'}</p>`; if (!isSubList) { document.getElementById('quoteCount').textContent = '0'; document.getElementById('totalAmount').textContent = '0'; } return; }
    quotes.forEach(quote => {
        const card = document.createElement('div'); card.className = 'quote-card';
        const quoteStatus = quote.status || 'draft';
        const statusLabel = `<span class="quote-status status-${quoteStatus}">${QUOTATION_STATUSES[quoteStatus]}</span>`;
        const grandTotalText = (quote.grandTotal || 0).toLocaleString();
        const mainTitle = isSubList ? (quote.project || '未命名專案') : `${quote.client || '未知客戶'} - ${quote.project || '未命名專案'}`;
        card.innerHTML = `<div class="quote-card-info"><h3>${statusLabel}${mainTitle}</h3><p>日期：${quote.quoteDate || 'N/A'} | 總金額：NT$ ${grandTotalText}</p></div><div class="quote-card-actions"><button class="view-btn" data-id="${quote.id}" data-source="${isSubList ? 'customer-page' : 'main-list'}">查看</button><button class="customer-btn" data-customer-id="${quote.customerId || ''}" ${!quote.customerId ? 'disabled' : ''}>客戶</button></div>`;
        container.appendChild(card);
    });
    if (!isSubList) { const totalGrandTotal = quotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0); document.getElementById('quoteCount').textContent = quotes.length; document.getElementById('totalAmount').textContent = totalGrandTotal.toLocaleString(); }
}
async function deleteQuotation(id) {
    if (confirm('確定要刪除這筆報價單嗎？此操作無法復原。')) {
        try {
            await window.electronAPI.deleteQuotation(id); showStatusMessage('報價單已刪除！(展示模式：重新整理後將會重設)', 'success');
            allQuotations = await window.electronAPI.getQuotations();
            const currentPage = document.querySelector('.page-content.active').id;
            if (currentPage === 'customerspage') { const customerId = document.getElementById('customerIdField').value; if (customerId) await renderCustomerQuotes(customerId); }
            else { switchPage('quotationlistpage'); loadAndFilterQuotes(); }
        } catch (error) { showStatusMessage('刪除報價單失敗。', 'error'); }
    }
}
async function viewQuotationDetail(id) {
    const quote = await window.electronAPI.getQuotation(id); if (!quote) { showStatusMessage('找不到指定的報價單。', 'error'); return; }
    currentViewingQuoteId = id;
    document.getElementById('quotation-detail-document').innerHTML = generateDetailHtml(quote);
    document.getElementById('convertToProjectBtn').style.display = quote.status === 'confirmed' ? 'inline-block' : 'none';
    switchPage('quotationdetailpage');
}
function generateDetailHtml(quote) {
    const itemsHtml = (quote.items || []).map(item => `<tr><td data-label="Item/項目">${item.item || ''}</td><td data-label="Description/說明" style="white-space: pre-wrap;">${item.description || ''}</td><td data-label="Unit/單位">${item.unit || ''}</td><td data-label="Cost/單價" style="text-align: right;">${(item.cost || 0).toLocaleString()}</td><td data-label="Qty/數量" style="text-align: right;">${item.qty || 0}</td><td data-label="Total/複價" style="text-align: right;">${(item.total || 0).toLocaleString()}</td></tr>`).join('');
    const notesHtml = (quote.notes || []).map(note => `<li>${note}</li>`).join('');
    return `<header><div class="logo"><img src="vv.png" alt="Studio VV Logo"></div><h1>Production Budget Quotation 報價單</h1><div class="header-info"><div class="info-row"><span class="label">Client/客戶:</span><span class="value">${quote.client || ''}</span></div><div class="info-row"><span class="label">Date/製表日期:</span><span class="value">${quote.quoteDate || ''}</span></div><div class="info-row"><span class="label">Project/項目名:</span><span class="value">${quote.project || ''}</span></div><div class="info-row"><span class="label">Layout/樣稿日:</span><span class="value">${quote.layoutDate || ''}</span></div><div class="info-row"><span class="label">TEL/聯絡電話:</span><span class="value">${quote.tel || ''}</span></div><div class="info-row"><span class="label">Deadline/交稿日:</span><span class="value">${quote.deadlineDate || ''}</span></div></div></header><section class="itemized-list"><h2>Itemized List & Cost/費用明細</h2><table id="itemTable"><thead><tr><th>Item/項目</th><th>Description/說明</th><th>Unit/單位</th><th>Cost/單價</th><th>Qty/數量</th><th>Total/複價</th></tr></thead><tbody>${itemsHtml}</tbody></table></section><section class="final-section"><table class="final-table"><tr><td class="payment-cell"><h2>Terms & Conditions/付款方式:</h2><p>本報價於客戶簽章及匯款訂金50%後訂單生效。確認預付款後即開始製作。完稿無誤後,方可交付檔案。</p><div class="payment-info"><h3>Remittance Account/收款帳戶:</h3><ul><li><span>戶名 | Studio VV </span></li><li><span>帳戶 | 郵局局號(700)郵局 0012340-0567890</span></li></ul></div></td><td class="summary-cell"><div class="summary-section"><div class="summary-row"><span class="label">Subtotal/小計:</span><span class="value">${(quote.subtotal || 0).toLocaleString()}</span></div><div class="summary-row"><span class="label">Discount/折扣優惠:</span><span class="value">${(quote.discount || 0).toLocaleString()}</span></div><div class="summary-row"><span class="label">Tax/稅額: 5%</span><span class="value">${(quote.tax || 0).toLocaleString()}</span></div><div class="summary-row grand-total"><span class="label">Grand Total/含稅總計:</span><span class="value">${(quote.grandTotal || 0).toLocaleString()}</span></div></div></td></tr></table></section><section class="notes-container"><h2>Supplementary Notes/補充說明</h2><ol>${notesHtml}</ol><table class="signature-table"><tr><td class="signature-cell-left"><h2>SIGNATURE CONFIRMATION 簽字確認</h2><div class="signature-line"></div></td><td class="signature-cell-right-empty"></td></tr></table><table class="ninja-cat-table"><tr><td class="ninja-cat-cell">NINJA CAT</td></tr></table></section>`;
}
async function cloneQuotation(id) { 
    const originalQuote = await window.electronAPI.getQuotation(id); if (!originalQuote) { showStatusMessage('找不到要複製的報價單', 'error'); return; }
    delete originalQuote.id; originalQuote.quoteDate = new Date().toISOString().split('T')[0];
    originalQuote.status = 'draft'; originalQuote.project += ' (複製)';
    const newId = uuidv4(); const newQuote = { ...originalQuote, id: newId, timestamp: new Date().toISOString() };
    await window.electronAPI.saveQuotation(newQuote);
    allQuotations = await window.electronAPI.getQuotations();
    await loadQuotationForEdit(newId);
}
async function populateCustomerDatalist() {
    allCustomers = await window.electronAPI.getCustomers(); const datalist = document.getElementById('customer-list'); datalist.innerHTML = '';
    allCustomers.forEach(c => { const option = document.createElement('option'); option.value = c.name; datalist.appendChild(option); });
}

// ====================================================================
// 題庫 (Templates)
// ====================================================================
let selectedTemplateItemId = null;
async function openTemplateModal() {
    try {
        allTemplates = await window.electronAPI.getTemplates();
        if (!allTemplates || allTemplates.length === 0) { showStatusMessage('題庫中沒有任何資料，請至「題庫管理」頁面新增。', 'info'); return; }
        renderTemplateItemsForSelection(allTemplates);
        document.getElementById('templateDescList').innerHTML = '<p class="modal-placeholder">請先從左側選擇一個項目</p>';
        document.getElementById('templateItemSearch').value = '';
        document.getElementById('templateModalBackdrop').style.display = 'flex';
    } catch (error) { showStatusMessage('讀取題庫失敗', 'error'); console.error("讀取題庫失敗:", error); }
}
function closeTemplateModal() { document.getElementById('templateModalBackdrop').style.display = 'none'; selectedTemplateItemId = null; }
function renderTemplateItemsForSelection(items) {
    const list = document.getElementById('templateItemList');
    list.innerHTML = '';
    items.forEach(item => { const li = document.createElement('li'); li.textContent = item.name; li.dataset.itemId = item.id; list.appendChild(li); });
}
function handleTemplateItemClick(e) {
    const target = e.target.closest('li');
    if (!target) return;
    selectedTemplateItemId = target.dataset.itemId;
    document.querySelectorAll('#templateItemList li').forEach(li => li.classList.remove('active'));
    target.classList.add('active');
    const selectedItem = allTemplates.find(item => item.id === selectedTemplateItemId);
    const descList = document.getElementById('templateDescList');
    if (selectedItem && selectedItem.descriptions) { descList.innerHTML = selectedItem.descriptions.map(desc => `<label><input type="checkbox" data-desc-text="${desc.text}">${desc.text}</label>`).join('');
    } else { descList.innerHTML = '<p class="modal-placeholder">此項目沒有可用的說明</p>'; }
}
function handleTemplateConfirm() {
    if (!selectedTemplateItemId) { showStatusMessage('請先選擇一個項目。', 'warning'); return; }
    const selectedItem = allTemplates.find(item => item.id === selectedTemplateItemId);
    const checkedBoxes = document.querySelectorAll('#templateDescList input[type="checkbox"]:checked');
    const descriptions = Array.from(checkedBoxes).map(box => box.dataset.descText);
    addNewItemRow({ item: selectedItem.name, description: descriptions.join('\n') });
    closeTemplateModal();
}
function filterTemplateItems() {
    const searchTerm = document.getElementById('templateItemSearch').value.toLowerCase();
    const filtered = allTemplates.filter(item => item.name.toLowerCase().includes(searchTerm));
    renderTemplateItemsForSelection(filtered);
}
async function loadAndRenderTemplatesPage() {
    try {
        allTemplates = await window.electronAPI.getTemplates();
        renderTemplateManagementList(allTemplates);
    } catch (error) { showStatusMessage('讀取題庫資料失敗', 'error'); console.error(error); }
}
function renderTemplateManagementList(templates) {
    const container = document.getElementById('templateManagementContainer');
    container.innerHTML = '';
    if (!templates || templates.length === 0) { container.innerHTML = '<p class="no-quotes">目前題庫沒有任何項目。點擊右上角「新增項目」來建立你的第一個題庫項目吧！</p>'; return; }
    templates.forEach(item => {
        const card = document.createElement('div');
        card.className = 'template-card';
        const descriptionsHtml = (item.descriptions && item.descriptions.length > 0) ? `<ul class="template-descriptions">${item.descriptions.map(d => `<li>${d.text}</li>`).join('')}</ul>` : '<p style="font-size:12px; color: var(--text-secondary);">沒有說明</p>';
        card.innerHTML = `<div><h3>${item.name}</h3>${descriptionsHtml}</div><div class="card-actions"><button class="edit-template-btn" data-id="${item.id}">編輯</button></div>`;
        container.appendChild(card);
    });
}
function openEditTemplateModal(itemId = null) {
    const modalTitle = document.getElementById('editTemplateModalTitle');
    const deleteBtn = document.getElementById('deleteTemplateItemBtn');
    const idInput = document.getElementById('templateItemIdInput');
    const nameInput = document.getElementById('templateItemNameInput');
    const descriptionsEditor = document.getElementById('templateDescriptionsEditor');
    idInput.value = itemId || '';
    descriptionsEditor.innerHTML = '';
    if (itemId) {
        modalTitle.textContent = '編輯項目';
        const item = allTemplates.find(t => t.id === itemId);
        nameInput.value = item.name;
        (item.descriptions || []).forEach(desc => addDescriptionInput(desc.text));
        deleteBtn.style.display = 'block';
    } else {
        modalTitle.textContent = '新增項目';
        nameInput.value = '';
        addDescriptionInput();
        deleteBtn.style.display = 'none';
    }
    document.getElementById('editTemplateModalBackdrop').style.display = 'flex';
}
function closeEditTemplateModal() { document.getElementById('editTemplateModalBackdrop').style.display = 'none'; }
function addDescriptionInput(value = '') {
    const editor = document.getElementById('templateDescriptionsEditor');
    const entry = document.createElement('div');
    entry.className = 'description-entry';
    entry.innerHTML = `<input type="text" class="template-description-input" value="${value}" placeholder="輸入說明內容"><button type="button" class="delete-desc-btn">&times;</button>`;
    editor.appendChild(entry);
}
async function saveTemplateItem() {
    const id = document.getElementById('templateItemIdInput').value;
    const name = document.getElementById('templateItemNameInput').value.trim();
    if (!name) { showStatusMessage('項目名稱不可為空！', 'error'); return; }
    const descriptionInputs = document.querySelectorAll('.template-description-input');
    const descriptions = Array.from(descriptionInputs).map(input => ({ id: uuidv4(), text: input.value.trim() })).filter(desc => desc.text);
    const newItemData = { id: id || uuidv4(), name, descriptions };
    if (id) { const index = allTemplates.findIndex(t => t.id === id); if (index > -1) allTemplates[index] = newItemData;
    } else { allTemplates.unshift(newItemData); }
    try {
        await window.electronAPI.saveTemplates(allTemplates);
        showStatusMessage('題庫已儲存！(展示模式：重新整理後將會重設)', 'success');
        closeEditTemplateModal();
        loadAndRenderTemplatesPage();
    } catch (error) { showStatusMessage('儲存題庫失敗', 'error'); console.error(error); }
}
async function deleteTemplateItem() {
    const id = document.getElementById('templateItemIdInput').value;
    if (!id) return;
    if (confirm('確定要刪除這個項目及其所有說明嗎？此操作無法復原。')) {
        allTemplates = allTemplates.filter(t => t.id !== id);
        try {
            await window.electronAPI.saveTemplates(allTemplates);
            showStatusMessage('項目已刪除。(展示模式：重新整理後將會重設)', 'success');
            closeEditTemplateModal();
            loadAndRenderTemplatesPage();
        } catch (error) { showStatusMessage('刪除項目失敗', 'error'); console.error(error); }
    }
}

// ====================================================================
// 補充說明庫 (Notes Library)
// ====================================================================
async function loadAndRenderNotesPage() {
    try {
        allNotes = await window.electronAPI.getNotes();
        populateNoteCategoryFilter('noteCategoryFilter');
        renderNotesManagementList();
    } catch(e) { showStatusMessage('讀取補充說明失敗', 'error'); console.error(e); }
}
function renderNotesManagementList() {
    const container = document.getElementById('notesManagementContainer');
    const filter = document.getElementById('noteCategoryFilter').value;
    container.innerHTML = '';
    const filteredNotes = (filter === 'all') ? allNotes : allNotes.filter(n => n.categories.includes(filter));
    if (filteredNotes.length === 0) { container.innerHTML = '<p class="no-quotes">沒有符合條件的補充說明。</p>'; return; }
    filteredNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'note-item';
        const categoriesHtml = note.categories.map(c => `<span class="note-category-tag">${c}</span>`).join('');
        item.innerHTML = `<div class="note-item-info"><p>${note.text}</p><div class="note-categories">${categoriesHtml}</div></div><div class="note-item-actions"><button class="edit-note-btn" data-id="${note.id}">編輯</button><button class="delete-note-btn delete-btn-style" data-id="${note.id}">刪除</button></div>`;
        container.appendChild(item);
    });
}
function populateNoteCategoryFilter(elementId) {
    const select = document.getElementById(elementId);
    const existingValue = select.value;
    select.innerHTML = '<option value="all">所有類別</option>';
    const categories = [...new Set(allNotes.flatMap(n => n.categories))].sort();
    categories.forEach(c => { const option = document.createElement('option'); option.value = c; option.textContent = c; select.appendChild(option); });
    select.value = existingValue;
}
function openEditNoteModal(noteId = null) {
    const idInput = document.getElementById('noteIdInput');
    const textInput = document.getElementById('noteTextInput');
    const checkboxGroup = document.getElementById('noteCategoriesCheckboxGroup');
    const title = document.getElementById('editNoteModalTitle');
    const deleteBtn = document.getElementById('deleteNoteItemBtn');
    
    checkboxGroup.innerHTML = '';
    NOTE_CATEGORIES.forEach(cat => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="noteCategory" value="${cat}"> ${cat}`;
        checkboxGroup.appendChild(label);
    });

    if (noteId) {
        const note = allNotes.find(n => n.id === noteId);
        idInput.value = note.id;
        textInput.value = note.text;
        note.categories.forEach(cat => {
            const checkbox = checkboxGroup.querySelector(`input[value="${cat}"]`);
            if (checkbox) checkbox.checked = true;
        });
        title.textContent = '編輯說明';
        deleteBtn.style.display = 'block';
    } else {
        idInput.value = '';
        textInput.value = '';
        title.textContent = '新增說明';
        deleteBtn.style.display = 'none';
    }
    document.getElementById('editNoteModalBackdrop').style.display = 'flex';
}
function closeEditNoteModal() { document.getElementById('editNoteModalBackdrop').style.display = 'none'; }
async function saveNoteItem() {
    const id = document.getElementById('noteIdInput').value;
    const text = document.getElementById('noteTextInput').value.trim();
    if (!text) { showStatusMessage('說明內容不可為空!', 'error'); return; }
    
    const checkedBoxes = document.querySelectorAll('#noteCategoriesCheckboxGroup input:checked');
    let categories = Array.from(checkedBoxes).map(cb => cb.value);
    if (categories.length === 0) categories.push('通用');

    const noteData = { id: id || uuidv4(), text, categories };
    if (id) { const index = allNotes.findIndex(n => n.id === id); if (index > -1) allNotes[index] = noteData;
    } else { allNotes.unshift(noteData); }
    try {
        await window.electronAPI.saveNotes(allNotes);
        showStatusMessage('補充說明已儲存！(展示模式：重新整理後將會重設)', 'success');
        closeEditNoteModal();
        loadAndRenderNotesPage();
    } catch(e) { showStatusMessage('儲存失敗', 'error'); console.error(e); }
}
async function deleteNoteItem(noteId) {
    if (confirm('確定要刪除這條補充說明嗎？')) {
        allNotes = allNotes.filter(n => n.id !== noteId);
        try {
            await window.electronAPI.saveNotes(allNotes);
            showStatusMessage('補充說明已刪除。(展示模式：重新整理後將會重設)', 'success');
            loadAndRenderNotesPage();
        } catch(e) { showStatusMessage('刪除失敗', 'error'); console.error(e); }
    }
}
async function openSelectNoteModal() {
    try {
        allNotes = await window.electronAPI.getNotes();
        if (!allNotes || allNotes.length === 0) { showStatusMessage('補充說明庫是空的，請先至管理頁面新增。', 'info'); return; }
        populateNoteCategoryFilter('selectNoteCategoryFilter');
        renderNoteSelectionList();
        document.getElementById('selectNoteModalBackdrop').style.display = 'flex';
    } catch(e) { showStatusMessage('讀取補充說明失敗', 'error'); console.error(e); }
}
function closeSelectNoteModal() { document.getElementById('selectNoteModalBackdrop').style.display = 'none'; }
function renderNoteSelectionList() {
    const container = document.getElementById('noteSelectionList');
    const filter = document.getElementById('selectNoteCategoryFilter').value;
    container.innerHTML = '';
    const filteredNotes = (filter === 'all') ? allNotes : allNotes.filter(n => n.categories.includes(filter));
    if (filteredNotes.length === 0) { container.innerHTML = '<p class="modal-placeholder">此分類下沒有說明。</p>'; return; }
    container.innerHTML = filteredNotes.map(note => `<label><input type="checkbox" data-note-text="${note.text}"><span>${note.text}</span></label>`).join('');
}
function handleSelectNoteConfirm() {
    const checked = document.querySelectorAll('#noteSelectionList input:checked');
    checked.forEach(box => { addNewNote(box.dataset.noteText); });
    closeSelectNoteModal();
}

// ====================================================================
// 專案管理
// ====================================================================
function showProjectForm(show, project = null) {
    document.getElementById('projectListContainer').style.display = show ? 'none' : 'block';
    document.getElementById('projectFormContainer').style.display = show ? 'block' : 'none';
    isProjectModified = false;
    if (show) {
        document.getElementById('projectForm').reset(); document.getElementById('taskList').querySelector('tbody').innerHTML = '';
        if (project) {
            document.getElementById('projectFormTitle').textContent = '編輯專案';
            document.getElementById('projectIdField').value = project.id; document.getElementById('projectQuoteIdField').value = project.quoteId || '';
            document.getElementById('projectNameField').value = project.name; document.getElementById('projectClientField').value = project.client;
            document.getElementById('projectAmountField').value = project.projectAmount || 0; document.getElementById('projectStartDateField').value = project.startDate || '';
            document.getElementById('projectEndDateField').value = project.endDate || ''; document.getElementById('projectStatusField').value = project.status || 'pending';
            document.getElementById('photographerPhone').value = project.photographerPhone || ''; document.getElementById('designerPhone').value = project.designerPhone || '';
            document.getElementById('clientPhone').value = project.clientPhone || ''; document.getElementById('clientEmail').value = project.clientEmail || '';
            (project.tasks || []).forEach(task => addOrRenderTaskRow(task));
        } else { document.getElementById('projectFormTitle').textContent = '新增專案'; document.getElementById('projectIdField').value = ''; document.getElementById('projectQuoteIdField').value = ''; }
    }
}
async function loadAndRenderProjects() {
    allProjects = await window.electronAPI.getProjects();
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const filtered = allProjects.filter(p => (p.name && p.name.toLowerCase().includes(searchTerm)) || (p.client && p.client.toLowerCase().includes(searchTerm)));
    renderProjectList(filtered);
}
function renderProjectList(projects) {
    const container = document.getElementById('projectCards'); container.innerHTML = '';
    if (!projects || projects.length === 0) { container.innerHTML = '<p class="no-quotes">目前沒有專案。</p>'; return; }
    projects.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    projects.forEach(project => {
        const card = document.createElement('div'); const status = project.status || 'pending';
        const displayDate = project.timestamp ? new Date(project.timestamp).toLocaleDateString() : 'N/A';
        const statusText = PROJECT_STATUSES[status] || status; const amountText = (project.projectAmount || 0).toLocaleString();
        card.className = `project-card status-${status}`;
        card.innerHTML = `<h3>${project.name}</h3><p><strong>客戶:</strong> ${project.client || 'N/A'}</p><p><strong>金額:</strong> NT$ ${amountText}</p><p><strong>狀態:</strong> ${statusText}</p><p><strong>日期:</strong> ${displayDate}</p><div class="card-actions"><button class="edit-project-btn" data-id="${project.id}">編輯</button></div>`;
        container.appendChild(card);
    });
}
async function saveProject(event) {
    event.preventDefault();
    const projectId = document.getElementById('projectIdField').value;
    const tasks = Array.from(document.querySelectorAll('#taskList tbody tr')).map(row => ({ done: row.querySelector('.task-status-checkbox').checked, description: row.querySelector('.task-description').value, dueDate: row.querySelector('.task-duedate').value }));
    const projectData = { id: projectId || uuidv4(), quoteId: document.getElementById('projectQuoteIdField').value, name: document.getElementById('projectNameField').value, client: document.getElementById('projectClientField').value, projectAmount: parseFloat(document.getElementById('projectAmountField').value) || 0, startDate: document.getElementById('projectStartDateField').value, endDate: document.getElementById('projectEndDateField').value, status: document.getElementById('projectStatusField').value, photographerPhone: document.getElementById('photographerPhone').value.trim(), designerPhone: document.getElementById('designerPhone').value.trim(), clientPhone: document.getElementById('clientPhone').value.trim(), clientEmail: document.getElementById('clientEmail').value.trim(), tasks: tasks, timestamp: new Date().toISOString() };
    const quoteId = document.getElementById('projectQuoteIdField').value;
    if (quoteId) {
        const quote = allQuotations.find(q => q.id === quoteId);
        if (quote && quote.customerId) {
            const customerIndex = allCustomers.findIndex(c => c.id === quote.customerId);
            if (customerIndex > -1) {
                let customerModified = false;
                if (allCustomers[customerIndex].phone !== projectData.clientPhone) { allCustomers[customerIndex].phone = projectData.clientPhone; customerModified = true; }
                if (allCustomers[customerIndex].email !== projectData.clientEmail) { allCustomers[customerIndex].email = projectData.clientEmail; customerModified = true; }
                if (allCustomers[customerIndex].name !== projectData.client) { allCustomers[customerIndex].name = projectData.client; customerModified = true; }
                if (customerModified) { await window.electronAPI.saveCustomers(allCustomers); }
            }
        }
    }
    try {
        await window.electronAPI.saveProject(projectData); isProjectModified = false; showStatusMessage('專案已儲存！(展示模式：重新整理後將會重設)', 'success');
        allProjects = await window.electronAPI.getProjects();
        showProjectForm(false);
        await loadAndRenderProjects();
    } catch(err) { showStatusMessage('儲存專案失敗', 'error'); console.error(err); }
}
async function deleteProject(id) {
    if (confirm('確定要刪除這個專案嗎？此操作無法復原。')) {
        try {
            await window.electronAPI.deleteProject(id); showStatusMessage('專案已刪除。(展示模式：重新整理後將會重設)', 'success');
            allProjects = await window.electronAPI.getProjects();
            showProjectForm(false);
            await loadAndRenderProjects();
        } catch(err) { showStatusMessage('刪除專案失敗', 'error'); console.error(err); }
    }
}
function addOrRenderTaskRow(task = { done: false, description: '', dueDate: '' }) {
    const tbody = document.getElementById('taskList').querySelector('tbody'); const row = tbody.insertRow();
    row.innerHTML = `<td><input type="checkbox" class="task-status-checkbox" ${task.done ? 'checked' : ''}></td><td><input type="text" class="task-description" value="${task.description}"></td><td><input type="date" class="task-duedate" value="${task.dueDate}"></td><td><button type="button" class="delete-task-btn">&times;</button></td>`;
}
async function convertQuoteToProject(quoteId, fromSave = false) {
    const quote = await window.electronAPI.getQuotation(quoteId); if (!quote) { showStatusMessage('找不到對應的報價單', 'error'); return; }
    let customerDetails = { phone: quote.tel, email: '' };
    if (quote.customerId) { const customer = allCustomers.find(c => c.id === quote.customerId); if (customer) { customerDetails.phone = customer.phone || quote.tel; customerDetails.email = customer.email || ''; } }
    const newProject = { id: uuidv4(), quoteId: quote.id, name: quote.project, client: quote.client, projectAmount: quote.grandTotal, startDate: new Date().toISOString().split('T')[0], endDate: quote.deadlineDate || '', status: 'pending', tasks: [], timestamp: new Date().toISOString(), clientPhone: customerDetails.phone, clientEmail: customerDetails.email };
    await window.electronAPI.saveProject(newProject);
    allProjects = await window.electronAPI.getProjects();
    showStatusMessage('已成功轉為專案！(展示模式：重新整理後將會重設)', 'success');
    switchPage('projectspage');
    showProjectForm(true, newProject);
}

// ====================================================================
// 行事曆
// ====================================================================
async function renderCalendar() {
    const year = calendarDate.getFullYear(); const month = calendarDate.getMonth();
    document.getElementById('calendar-month-year').textContent = `${year} 年 ${month + 1} 月`;
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
    const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) { grid.insertAdjacentHTML('beforeend', '<div class="calendar-day empty"></div>'); }
    for (let day = 1; day <= daysInMonth; day++) { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; grid.insertAdjacentHTML('beforeend', `<div class="calendar-day" data-date="${dateStr}"><div class="day-number">${day}</div><div class="events"></div></div>`); }
    await populateCalendarEvents();
}
async function handleCalendarEventClick(event) {
    const { type, id } = event.currentTarget.dataset; if (!id) return;
    if (type === 'quotation') { await viewQuotationDetail(id); }
    else if (type === 'project') { const project = await window.electronAPI.getProject(id); if (project) { switchPage('projectspage'); showProjectForm(true, project); } else { showStatusMessage('找不到對應的專案。', 'error'); } }
}
async function populateCalendarEvents() {
    const addEventToCalendar = (date, className, title, content, type, id) => {
        if (!date) return;
        const dayCell = document.querySelector(`.calendar-day[data-date="${date}"] .events`);
        if (dayCell) { const eventEl = document.createElement('div'); eventEl.className = `event ${className}`; eventEl.title = content; eventEl.textContent = title; eventEl.dataset.type = type; eventEl.dataset.id = id; eventEl.addEventListener('click', handleCalendarEventClick); dayCell.appendChild(eventEl); }
    };
    allQuotations.forEach(q => { const client = q.client || '未知客戶'; addEventToCalendar(q.quoteDate, 'event-quote', '報價', `報價 | ${client} - ${q.project}`, 'quotation', q.id); addEventToCalendar(q.layoutDate, 'event-layout', '樣稿', `樣稿 | ${client} - ${q.project}`, 'quotation', q.id); addEventToCalendar(q.deadlineDate, 'event-deadline', '交稿', `交稿 | ${client} - ${q.project}`, 'quotation', q.id); });
    allProjects.forEach(p => { const client = p.client || '未知客戶'; addEventToCalendar(p.startDate, 'event-project-start', '專案始', `專案開始 | ${client} - ${p.name}`, 'project', p.id); addEventToCalendar(p.endDate, 'event-project-end', '專案末', `專案結束 | ${p.name}`, 'project', p.id); (p.tasks || []).forEach(task => { if (task.dueDate && task.description) { addEventToCalendar(task.dueDate, 'event-task', '任務', `任務 | ${p.name}: ${task.description}`, 'project', p.id); } }); });
}

// ====================================================================
// 報表
// ====================================================================
async function generateReport() {
    const startDate = document.getElementById('reportStartDate').value; const endDate = document.getElementById('reportEndDate').value;
    const clientFilter = document.getElementById('clientFilter').value.toLowerCase(); const statusFilter = document.getElementById('statusReportFilter').value;
    const reportType = document.getElementById('reportType').value; const resultContainer = document.getElementById('reportResult');
    if (charts.report) { charts.report.destroy(); charts.report = null; }
    let filteredProjects = allProjects.filter(p => { let isMatch = true; if (startDate && p.startDate < startDate) isMatch = false; if (endDate && p.startDate > endDate) isMatch = false; if (clientFilter && p.client && !p.client.toLowerCase().includes(clientFilter)) isMatch = false; if (statusFilter !== 'all' && (p.status || 'pending') !== statusFilter) isMatch = false; return isMatch; });
    let html = `<h2>${document.querySelector('#reportType option:checked').textContent}</h2>`;
    if (reportType !== 'customer_source' && filteredProjects.length === 0) { resultContainer.innerHTML = html + '<p>在選定條件下找不到任何專案。</p>'; return; }
    switch (reportType) {
        case 'summary': const totalAmount = filteredProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0); const statusCounts = filteredProjects.reduce((counts, p) => { const status = p.status || 'pending'; counts[status] = (counts[status] || 0) + 1; return counts; }, {}); html += `<p><strong>總專案數：</strong>${filteredProjects.length} 筆</p><p><strong>總專案金額：</strong>NT$ ${totalAmount.toLocaleString()}</p><h3>各狀態數量：</h3><ul>`; Object.keys(PROJECT_STATUSES).forEach(statusKey => { if (statusCounts[statusKey]) { html += `<li>${PROJECT_STATUSES[statusKey]}: ${statusCounts[statusKey]} 筆</li>`; } }); html += '</ul>'; resultContainer.innerHTML = html; break;
        case 'client': const clientGroups = filteredProjects.reduce((groups, p) => { const client = p.client || '未知客戶'; if (!groups[client]) groups[client] = { projects: [], total: 0 }; groups[client].projects.push(p); groups[client].total += (p.projectAmount || 0); return groups; }, {}); html += '<table class="data-table"><thead><tr><th>客戶</th><th>專案數</th><th>總金額</th></tr></thead><tbody>'; Object.keys(clientGroups).sort().forEach(client => { html += `<tr><td>${client}</td><td>${clientGroups[client].projects.length}</td><td style="text-align: right;">${clientGroups[client].total.toLocaleString()}</td></tr>`; }); html += '</tbody></table>'; resultContainer.innerHTML = html; break;
        case 'monthly': const monthlyGroups = filteredProjects.reduce((groups, p) => { if (!p.startDate) return groups; const month = p.startDate.substring(0, 7); if (!groups[month]) groups[month] = { projects: [], total: 0 }; groups[month].projects.push(p); groups[month].total += (p.projectAmount || 0); return groups; }, {}); const sortedMonths = Object.keys(monthlyGroups).sort(); const chartLabels = sortedMonths; const chartData = sortedMonths.map(month => monthlyGroups[month].total); html += `<div class="chart-container-wrapper"><div class="chart-container"><canvas id="monthlyReportChart"></canvas></div></div><h3>每月詳細資料</h3><table class="data-table"><thead><tr><th>月份</th><th>專案數</th><th>總金額</th></tr></thead><tbody>`; sortedMonths.forEach(month => { html += `<tr><td>${month}</td><td>${monthlyGroups[month].projects.length}</td><td style="text-align: right;">${monthlyGroups[month].total.toLocaleString()}</td></tr>`; }); html += '</tbody></table>'; resultContainer.innerHTML = html; const ctx = document.getElementById('monthlyReportChart').getContext('2d'); charts.report = new Chart(ctx, { type: 'bar', data: { labels: chartLabels, datasets: [{ label: '月總金額', data: chartData, backgroundColor: '#1F2937', borderRadius: 4 }] }, options: { scales: { y: { beginAtZero: true } }, maintainAspectRatio: false } }); break;
        case 'customer_source': const sourceCounts = allCustomers.reduce((counts, customer) => { const source = customer.source?.trim() || '未分類'; counts[source] = (counts[source] || 0) + 1; return counts; }, {}); if (Object.keys(sourceCounts).length === 0) { resultContainer.innerHTML = html + '<p>找不到任何客戶來源資料。</p>'; return; } const sortedSources = Object.entries(sourceCounts).sort(([,a],[,b]) => b-a); const sourceLabels = sortedSources.map(([source, _]) => source); const sourceData = sortedSources.map(([_, count]) => count); html += `<div class="chart-container-wrapper"><div class="chart-container chart-pie-container"><canvas id="sourceReportChart"></canvas></div></div><h3>客戶來源分析 (依客戶數)</h3><table class="data-table"><thead><tr><th>客戶來源</th><th>客戶數量</th></tr></thead><tbody>`; sortedSources.forEach(([source, count]) => { html += `<tr><td>${source}</td><td style="text-align: right;">${count}</td></tr>`; }); html += '</tbody></table>'; resultContainer.innerHTML = html; const sourceCtx = document.getElementById('sourceReportChart').getContext('2d'); charts.report = new Chart(sourceCtx, { type: 'pie', data: { labels: sourceLabels, datasets: [{ label: '客戶來源', data: sourceData, backgroundColor: ['#1F2937', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'] }] }, options: { maintainAspectRatio: false, responsive: true } }); break;
        case 'detailed': html += '<table class="data-table"><thead><tr><th>開始日期</th><th>客戶</th><th>專案</th><th>狀態</th><th>金額</th></tr></thead><tbody>'; let detailedTotal = 0; filteredProjects.sort((a,b) => new Date(b.startDate) - new Date(a.startDate)).forEach(p => { detailedTotal += (p.projectAmount || 0); html += `<tr><td>${p.startDate || 'N/A'}</td><td>${p.client}</td><td>${p.name}</td><td>${PROJECT_STATUSES[p.status || 'pending']}</td><td style="text-align: right;">${(p.projectAmount || 0).toLocaleString()}</td></tr>`; }); html += `<tr class="report-total-row"><td colspan="4">總計</td><td style="text-align: right;">${detailedTotal.toLocaleString()}</td></tr>`; html += '</tbody></table>'; resultContainer.innerHTML = html; break;
    }
}

// ====================================================================
// 列印與匯出
// ====================================================================
function handlePrintLayout() {
    const dateInputIds = ['quoteDate', 'layoutDate', 'deadlineDate'];
    const activeDoc = document.querySelector('.page-content.active .quotation-container');
    if (!activeDoc) return;
    dateInputIds.forEach(id => {
        const input = activeDoc.querySelector(`#${id}`) || document.getElementById(id);
        if (input && !input.value) {
            const valueContainer = input.closest('.value');
            if (valueContainer) {
                valueContainer.classList.add('hide-on-print-value');}}});
    const detailRows = activeDoc.querySelectorAll('.info-row');
    detailRows.forEach(row => {
        const label = row.querySelector('.label');
        const value = row.querySelector('.value');
        if (label && value && (label.textContent.includes('日期') || label.textContent.includes('日'))) {
             if (!value.textContent.trim()) {
                 value.classList.add('hide-on-print-value');}}});}
function cleanupPrintLayout() {
    document.querySelectorAll('.hide-on-print-value').forEach(el => {
        el.classList.remove('hide-on-print-value');});
    document.querySelectorAll('.hide-on-print').forEach(el => {
        el.classList.remove('hide-on-print');});}
function triggerPrint() {
    handlePrintLayout();
    window.print();}
// ====================================================================
// 事件監聽器
// ====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // --- 初始資料載入 ---
    allQuotations = await window.electronAPI.getQuotations();
    allCustomers = await window.electronAPI.getCustomers();
    allProjects = await window.electronAPI.getProjects();
    allTemplates = await window.electronAPI.getTemplates();
    allNotes = await window.electronAPI.getNotes();
    
    // --- 導覽列事件 ---
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
        const pageId = btn.dataset.page;
        switch (pageId) {
            case 'homepage': renderDashboard(); break;
            case 'quotationlistpage': loadAndFilterQuotes(); break;
            case 'customerspage': showCustomerForm(false); loadAndRenderCustomers(); break;
            case 'projectspage': showProjectForm(false); loadAndRenderProjects(); break;
            case 'templatespage': loadAndRenderTemplatesPage(); break;
            case 'notespage': loadAndRenderNotesPage(); break;
            case 'reportspage': generateReport(); break;
            case 'calendarpage': renderCalendar(); break;
            case 'quotationpage': currentQuoteId = null; resetQuotationForm(); populateCustomerDatalist(); break;
        }
        switchPage(pageId);
    }));

    // --- RWD ---
    setupMobileMenu();

    // 初始頁面載入
    switchPage('homepage');
    renderDashboard();

    // --- 報價單列表頁 ---
    document.getElementById('newQuoteFromListBtn').addEventListener('click', () => { currentQuoteId = null; resetQuotationForm(); populateCustomerDatalist(); switchPage('quotationpage'); });
    ['quoteSearch', 'statusFilter', 'sortSelect'].forEach(id => document.getElementById(id).addEventListener('input', loadAndFilterQuotes));

    // --- 報價單詳情頁 ---
    document.getElementById('editFromDetailBtn').addEventListener('click', () => { if (currentViewingQuoteId) loadQuotationForEdit(currentViewingQuoteId); });
    document.getElementById('cloneFromDetailBtn').addEventListener('click', () => { if (currentViewingQuoteId) cloneQuotation(currentViewingQuoteId); });
    document.getElementById('convertToProjectBtn').addEventListener('click', () => { if(currentViewingQuoteId) convertQuoteToProject(currentViewingQuoteId) });
    document.getElementById('deleteFromDetailBtn').addEventListener('click', async () => { if (currentViewingQuoteId) await deleteQuotation(currentViewingQuoteId); });
    
    // --- 報價單編輯頁 ---
    document.getElementById('saveQuoteBtn').addEventListener('click', saveQuotation);
    document.getElementById('addItemBtn').addEventListener('click', () => addNewItemRow());
    document.getElementById('deleteItemBtn').addEventListener('click', deleteItemRow);
    document.getElementById('addFromNoteLibraryBtn').addEventListener('click', openSelectNoteModal);
    document.getElementById('addNoteBtn').addEventListener('click', () => addNewNote()); // 恢復手動新增
    document.getElementById('deleteNoteBtn').addEventListener('click', deleteNote);
    document.getElementById('quotationpage').addEventListener('input', e => { isQuoteModified = true; if (e.target.closest('#itemTable') || e.target.id === 'discount') { updateSummary(); } });
    document.getElementById('clientName').addEventListener('input', e => { const customer = allCustomers.find(c => c && c.name === e.target.value); if (customer) { document.getElementById('customerId').value = customer.id; document.getElementById('telNumber').value = customer.phone || ''; } else { document.getElementById('customerId').value = ''; } isQuoteModified = true; });

    // --- 題庫選擇 Modal 事件 ---
    document.getElementById('addFromTemplateBtn').addEventListener('click', openTemplateModal);
    document.getElementById('templateModalCloseBtn').addEventListener('click', closeTemplateModal);
    document.getElementById('templateModalCancelBtn').addEventListener('click', closeTemplateModal);
    document.getElementById('templateModalConfirmBtn').addEventListener('click', handleTemplateConfirm);
    document.getElementById('templateItemList').addEventListener('click', handleTemplateItemClick);
    document.getElementById('templateItemSearch').addEventListener('input', filterTemplateItems);
    document.getElementById('templateModalBackdrop').addEventListener('click', (e) => { if(e.target === e.currentTarget) closeTemplateModal(); });

    // --- 題庫管理頁 & 編輯 Modal 事件 ---
    document.getElementById('addNewTemplateItemBtn').addEventListener('click', () => openEditTemplateModal());
    document.getElementById('templateManagementContainer').addEventListener('click', e => { if (e.target.closest('.edit-template-btn')) openEditTemplateModal(e.target.closest('.edit-template-btn').dataset.id); });
    document.getElementById('editTemplateModalCloseBtn').addEventListener('click', closeEditTemplateModal);
    document.getElementById('editTemplateModalCancelBtn').addEventListener('click', closeEditTemplateModal);
    document.getElementById('editTemplateModalSaveBtn').addEventListener('click', saveTemplateItem);
    document.getElementById('deleteTemplateItemBtn').addEventListener('click', deleteTemplateItem);
    document.getElementById('addTemplateDescriptionBtn').addEventListener('click', () => addDescriptionInput());
    document.getElementById('templateDescriptionsEditor').addEventListener('click', e => { if (e.target.classList.contains('delete-desc-btn')) e.target.closest('.description-entry').remove(); });
    document.getElementById('editTemplateModalBackdrop').addEventListener('click', e => { if(e.target === e.currentTarget) closeEditTemplateModal(); });

    // --- 補充說明庫管理頁 & Modal 事件 ---
    document.getElementById('addNewNoteItemBtn').addEventListener('click', () => openEditNoteModal());
    document.getElementById('noteCategoryFilter').addEventListener('input', renderNotesManagementList);
    document.getElementById('notesManagementContainer').addEventListener('click', e => {
        if(e.target.closest('.edit-note-btn')) openEditNoteModal(e.target.closest('.edit-note-btn').dataset.id);
        if(e.target.closest('.delete-note-btn')) deleteNoteItem(e.target.closest('.delete-note-btn').dataset.id);
    });
    document.getElementById('editNoteModalCloseBtn').addEventListener('click', closeEditNoteModal);
    document.getElementById('editNoteModalCancelBtn').addEventListener('click', closeEditNoteModal);
    document.getElementById('editNoteModalSaveBtn').addEventListener('click', saveNoteItem);
    document.getElementById('deleteNoteItemBtn').addEventListener('click', () => deleteNoteItem(document.getElementById('noteIdInput').value));
    document.getElementById('editNoteModalBackdrop').addEventListener('click', e => { if(e.target === e.currentTarget) closeEditNoteModal(); });
    document.getElementById('selectNoteModalCloseBtn').addEventListener('click', closeSelectNoteModal);
    document.getElementById('selectNoteModalCancelBtn').addEventListener('click', closeSelectNoteModal);
    document.getElementById('selectNoteConfirmBtn').addEventListener('click', handleSelectNoteConfirm);
    document.getElementById('selectNoteCategoryFilter').addEventListener('input', renderNoteSelectionList);
    document.getElementById('selectNoteModalBackdrop').addEventListener('click', e => { if(e.target === e.currentTarget) closeSelectNoteModal(); });
    
    // --- 客戶管理頁 ---
    document.getElementById('addNewCustomerBtn').addEventListener('click', () => showCustomerForm(true));
    document.getElementById('customerForm').addEventListener('submit', saveCustomer);
    document.getElementById('customerSearch').addEventListener('input', loadAndRenderCustomers);
    document.getElementById('backToCustomerListBtn').addEventListener('click', () => showCustomerForm(false));
    document.getElementById('customerCards').addEventListener('click', e => { const target = e.target.closest('.edit-customer-btn'); if (target) { const customer = allCustomers.find(c => c.id === target.dataset.id); showCustomerForm(true, customer); }});

    // --- 專案管理頁 ---
    document.getElementById('projectSearch').addEventListener('input', loadAndRenderProjects);
    document.getElementById('addNewProjectBtn').addEventListener('click', () => showProjectForm(true));
    document.getElementById('backToProjectListBtn').addEventListener('click', () => { if (isProjectModified && !confirm('您有未儲存的專案修改。確定要離開嗎？')) return; isProjectModified = false; showProjectForm(false); });
    document.getElementById('projectForm').addEventListener('submit', saveProject);
    document.getElementById('projectForm').addEventListener('input', () => { isProjectModified = true; });
    document.getElementById('projectCards').addEventListener('click', async e => { const target = e.target.closest('.edit-project-btn'); if (target) { const project = await window.electronAPI.getProject(target.dataset.id); if (project) showProjectForm(true, project); } });
    document.getElementById('deleteProjectBtn').addEventListener('click', () => { const projectId = document.getElementById('projectIdField').value; if (projectId) deleteProject(projectId); });
    document.getElementById('addNewTaskBtn').addEventListener('click', () => { addOrRenderTaskRow(); isProjectModified = true; });
    document.getElementById('taskList').addEventListener('click', e => { if (e.target.classList.contains('delete-task-btn')) { e.target.closest('tr').remove(); isProjectModified = true; } });

    // --- 報表頁 ---
    ['reportStartDate', 'reportEndDate', 'statusReportFilter', 'reportType', 'clientFilter'].forEach(id => document.getElementById(id).addEventListener('input', generateReport));

    // --- 行事曆 ---
    document.getElementById('calendar-prev-month').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('calendar-next-month').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });

    // --- PDF 匯出 ---
    ['exportEditPdfBtn', 'exportDetailBtn', 'exportReportBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', triggerPrint));
    window.addEventListener('afterprint', cleanupPrintLayout);

    // --- 列表點擊代理 ---
    ['quotesListContainer', 'customerQuotesListContainer'].forEach(containerId => {
        document.getElementById(containerId).addEventListener('click', e => {
            const viewBtn = e.target.closest('.view-btn'); if (viewBtn) { viewQuotationDetail(viewBtn.dataset.id); return; }
            const customerBtn = e.target.closest('.customer-btn'); if (customerBtn && !customerBtn.disabled) { const customer = allCustomers.find(c => c.id === customerBtn.dataset.customerId); if (customer) { switchPage('customerspage'); showCustomerForm(true, customer); } }
        });
    });
});
