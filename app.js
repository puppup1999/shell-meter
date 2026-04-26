// Manager Portal Logic
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzoo0VGJL2hPfQvbgE6NbNRLohDjzeIjmfJi-_ddbtbX6X7BCLf46UE9NTRRbC6tyEF/exec";

let currentTab = 'meter';
let meterData = JSON.parse(localStorage.getItem('meterData')) || [];

const headNames = [
    "หัวที่ 1 (VPG)", "หัวที่ 2 (VPG)", "หัวที่ 3 (G91)", "หัวที่ 4 (G91)",
    "หัวที่ 5 (G91)", "หัวที่ 6 (G91)", "หัวที่ 7 (VPG)", "หัวที่ 8 (VPG)",
    "หัวที่ 9 (G95)", "หัวที่ 10 (G95)", "หัวที่ 11 (DIESEL)", "หัวที่ 12 (DIESEL)",
    "หัวที่ 13 (VPD)", "หัวที่ 14 (VPD)", "หัวที่ 15 (DIESEL)", "หัวที่ 16 (DIESEL)",
    "หัวที่ 17 (DIESEL)", "หัวที่ 18 (DIESEL)"
];

const pumpMapping = {
    "ปั๊ม 1-1": [0], "ปั๊ม 1-2": [2], "ปั๊ม 2-1": [3], "ปั๊ม 2-2": [1],
    "ปั๊ม 3-1": [4], "ปั๊ม 3-2": [6], "ปั๊ม 4-1": [7], "ปั๊ม 4-2": [5],
    "ปั๊ม 5": [8], "ปั๊ม 6": [9], "ปั๊ม 7": [10], "ปั๊ม 8": [11],
    "ปั๊ม 9": [12], "ปั๊ม 10": [13], "ปั๊ม 11": [14], "ปั๊ม 12": [15],
    "ปั๊ม 13": [16], "ปั๊ม 14": [17]
};

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    fetchData();
    setupEventListeners();
    generateInputs();
});

function updateDate() {
    const d = new Date();
    document.getElementById('currentDate').textContent = formatDate(d);
}

async function fetchData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        meterData = data.map(item => ({
            ...item,
            date: formatDateForInput(item.date)
        }));
        localStorage.setItem('meterData', JSON.stringify(meterData));
        renderContent();
    } catch (error) {
        console.error("Fetch error:", error);
        renderContent();
    }
}

function formatDateForInput(dateStr) {
    const d = new Date(dateStr);
    if (d.getFullYear() > 2400) {
        d.setFullYear(d.getFullYear() - 543);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderContent();
        });
    });

    const modal = document.getElementById('entryModal');
    document.getElementById('addBtn').addEventListener('click', () => openModal());
    document.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
    document.getElementById('meterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveData();
    });
}

function openModal(data = null) {
    const modal = document.getElementById('entryModal');
    const form = document.getElementById('meterForm');
    const dateInput = document.getElementById('inputDate');
    const headerTitle = modal.querySelector('.modal-header h3');

    form.reset();
    if (data) {
        headerTitle.textContent = 'แก้ไขเลขมิเตอร์';
        dateInput.value = data.date;
        dateInput.readOnly = true;
        data.readings.forEach((val, i) => {
            const input = form.querySelector(`input[name="head_${i}"]`);
            if (input) input.value = val;
        });
    } else {
        headerTitle.textContent = 'บันทึกเลขมิเตอร์';
        dateInput.valueAsDate = new Date();
        dateInput.readOnly = false;
    }
    modal.style.display = 'flex';
}

function generateInputs() {
    const grid = document.getElementById('headsGrid');
    grid.innerHTML = '';
    headNames.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'input-item';
        div.innerHTML = `
            <label>${name}</label>
            <input type="number" step="1" name="head_${i}" placeholder="0">
        `;
        grid.appendChild(div);
    });
}

function renderContent() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '';

    if (currentTab === 'meter') renderMeterTab(main);
    else if (currentTab === 'sales') renderSalesTab(main);
    else if (currentTab === 'reco') renderRecoTab(main);
}

function renderMeterTab(container) {
    const sortedData = [...meterData].sort((a,b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = `
        <div class="view">
            <h2 style="margin-bottom: 15px;">ประวัติการบันทึก</h2>
            ${sortedData.length === 0 ? '<p style="text-align:center; opacity:0.5;">กำลังโหลดข้อมูล...</p>' : ''}
            ${sortedData.map((item, idx) => `
                <div class="card clickable" onclick="toggleDetails(${idx})">
                    <h2>${formatDate(item.date)}</h2>
                    <div id="details-${idx}" class="card-details" style="display: none; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                        <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">
                            ${item.readings.map((val, i) => `
                                <div class="detail-item" style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                    <span style="color: var(--text-secondary);">${headNames[i].replace('หัวที่ ', 'H')}</span>
                                    <span>${val.toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-secondary" onclick="event.stopPropagation(); editEntry('${item.date}')">แก้ไขข้อมูล</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.toggleDetails = function(index) {
    const el = document.getElementById(`details-${index}`);
    const isVisible = el.style.display === 'block';
    el.style.display = isVisible ? 'none' : 'block';
}

window.editEntry = function(date) {
    const data = meterData.find(d => d.date === date);
    if (data) openModal(data);
}

function renderSalesTab(container) {
    const sorted = [...meterData].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = `
        <div class="view">
            <h2>รายงานยอดขายรายวัน</h2>
            ${sorted.map((item, index) => {
                const prev = sorted[index + 1];
                if (!prev) return '';
                
                const diffs = item.readings.map((val, i) => val - prev.readings[i]);
                const totalSales = diffs.reduce((a,b) => a+b, 0);

                return `
                    <div class="card">
                        <h2>${formatDate(item.date)} <span class="positive">${totalSales.toLocaleString()} ลิตร</span></h2>
                        <table class="data-table">
                            <thead>
                                <tr><th>กลุ่มน้ำมัน</th><th style="text-align: right;">ยอดขาย</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>เบนซิน 91</td><td style="text-align: right;">${calculateGroup(diffs, [2,3,4,5]).toLocaleString()}</td></tr>
                                <tr><td>เบนซิน 95</td><td style="text-align: right;">${calculateGroup(diffs, [8,9]).toLocaleString()}</td></tr>
                                <tr><td>ดีเซล</td><td style="text-align: right;">${calculateGroup(diffs, [10,11,14,15,16,17]).toLocaleString()}</td></tr>
                                <tr><td>VPD</td><td style="text-align: right;">${calculateGroup(diffs, [12,13]).toLocaleString()}</td></tr>
                                <tr><td>VPG</td><td style="text-align: right;">${calculateGroup(diffs, [0,1,6,7]).toLocaleString()}</td></tr>
                                <tr style="border-top: 2px solid var(--glass-border); font-weight: 600;">
                                    <td>รวม V-power</td>
                                    <td style="text-align: right; color: var(--accent-color);">${calculateGroup(diffs, [0,1,6,7,12,13]).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderRecoTab(container) {
    const latest = [...meterData].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    if (!latest) return;

    container.innerHTML = `
        <div class="view">
            <h2>สถานะมิเตอร์แยกตามปั๊ม</h2>
            <div class="card">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">อ้างอิงข้อมูลวันที่: ${formatDate(latest.date)}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${Object.entries(pumpMapping).map(([pump, indexes]) => `
                        <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">${pump}</div>
                            <div style="font-size: 0.9rem;">${indexes.map(idx => latest.readings[idx].toLocaleString()).join(' | ')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function calculateGroup(diffs, indexes) {
    return indexes.reduce((sum, i) => sum + diffs[i], 0);
}

async function saveData() {
    const submitBtn = document.querySelector('#meterForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    const date = document.getElementById('inputDate').value;
    
    // หาข้อมูลก่อนหน้านี้เพื่อใช้กรณีเว้นว่าง
    const sorted = [...meterData].sort((a,b) => new Date(b.date) - new Date(a.date));
    const previousEntry = sorted.find(d => new Date(d.date) < new Date(date));

    const readings = [];
    for (let i = 0; i < 18; i++) {
        const inputVal = document.querySelector(`input[name="head_${i}"]`).value;
        if (inputVal === "" && previousEntry) {
            // ถ้าว่าง ให้ใช้ค่าของวันก่อนหน้า
            readings.push(previousEntry.readings[i] || 0);
        } else {
            readings.push(parseInt(inputVal) || 0);
        }
    }

    const payload = { date, readings };

    try {
        submitBtn.textContent = 'กำลังบันทึก...';
        submitBtn.disabled = true;

        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const existingIndex = meterData.findIndex(d => d.date === date);
        if (existingIndex > -1) meterData[existingIndex].readings = readings;
        else meterData.push(payload);

        localStorage.setItem('meterData', JSON.stringify(meterData));
        document.getElementById('entryModal').style.display = 'none';
        renderContent();
        
        setTimeout(fetchData, 2000); 
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const month = monthNames[d.getMonth()];
    let year = d.getFullYear();
    // บังคับให้เป็นปี พ.ศ. เสมอเพื่อการแสดงผล
    if (year < 2400) year += 543;
    return `${day} ${month} ${year}`;
}
