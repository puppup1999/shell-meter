// Staff Specific Logic
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzoo0VGJL2hPfQvbgE6NbNRLohDjzeIjmfJi-_ddbtbX6X7BCLf46UE9NTRRbC6tyEF/exec";

let meterData = JSON.parse(localStorage.getItem('meterData')) || [];

const headNames = [
    "หัวที่ 1 (VPG)", "หัวที่ 2 (VPG)", "หัวที่ 3 (G91)", "หัวที่ 4 (G91)",
    "หัวที่ 5 (G91)", "หัวที่ 6 (G91)", "หัวที่ 7 (VPG)", "หัวที่ 8 (VPG)",
    "หัวที่ 9 (G95)", "หัวที่ 10 (G95)", "หัวที่ 11 (DIESEL)", "หัวที่ 12 (DIESEL)",
    "หัวที่ 13 (VPD)", "หัวที่ 14 (VPD)", "หัวที่ 15 (DIESEL)", "หัวที่ 16 (DIESEL)",
    "หัวที่ 17 (DIESEL)", "หัวที่ 18 (DIESEL)"
];

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    fetchData();
    setupEventListeners();
    generateInputs();
});

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('th-TH', options);
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
        renderMeterHistory();
    } catch (error) {
        console.error("Fetch error:", error);
        renderMeterHistory(); // Use local if failed
    }
}

function formatDateForInput(dateStr) {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
}

function setupEventListeners() {
    const modal = document.getElementById('entryModal');
    document.getElementById('addBtn').addEventListener('click', () => openModal());
    document.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (e) => { 
        if (e.target == modal) modal.style.display = 'none';
        if (e.target == document.getElementById('pinModal')) document.getElementById('pinModal').style.display = 'none';
    };
    document.getElementById('meterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveData();
    });

    document.getElementById('managerPin').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPin();
    });
}

window.showPinModal = function() {
    const modal = document.getElementById('pinModal');
    const input = document.getElementById('managerPin');
    input.value = '';
    document.getElementById('pinError').style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 100);
}

window.checkPin = function() {
    const pin = document.getElementById('managerPin').value;
    if (pin === "160999") {
        window.location.href = "manager.html";
    } else {
        document.getElementById('pinError').style.display = 'block';
        document.getElementById('managerPin').value = '';
    }
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
            <input type="number" step="1" name="head_${i}" placeholder="0" required>
        `;
        grid.appendChild(div);
    });
}

function renderMeterHistory() {
    const main = document.getElementById('mainContent');
    const sortedData = [...meterData].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    main.innerHTML = `
        <div class="view">
            <h2 style="margin-bottom: 15px;">ประวัติการบันทึกของคุณ</h2>
            ${sortedData.length === 0 ? '<p style="text-align:center; opacity:0.5;">กำลังโหลดข้อมูล...</p>' : ''}
            ${sortedData.map((item, idx) => `
                <div class="card clickable" onclick="toggleDetails(${idx})">
                    <h2>${formatDate(item.date)} <span style="font-size: 0.8rem; opacity: 0.5;">#${item.readings.length} หัว</span></h2>
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

async function saveData() {
    const submitBtn = document.querySelector('#meterForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    const date = document.getElementById('inputDate').value;
    const readings = [];
    for (let i = 0; i < 18; i++) {
        readings.push(parseInt(document.querySelector(`input[name="head_${i}"]`).value) || 0);
    }

    const payload = { date, readings };

    try {
        submitBtn.textContent = 'กำลังบันทึก...';
        submitBtn.disabled = true;

        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Apps Script
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Optimistic update
        const existingIndex = meterData.findIndex(d => d.date === date);
        if (existingIndex > -1) meterData[existingIndex].readings = readings;
        else meterData.push(payload);

        localStorage.setItem('meterData', JSON.stringify(meterData));
        document.getElementById('entryModal').style.display = 'none';
        renderMeterHistory();
        
        // Final sync
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
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
}
