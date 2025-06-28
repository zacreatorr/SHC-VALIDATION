// --- UTILITY FUNCTIONS ---
window.openImageModal = (dataUrl) => {
    document.getElementById('modal-img').src = dataUrl;
    document.getElementById('image-modal').classList.remove('hidden');
    document.getElementById('image-modal').classList.add('flex');
};
window.closeImageModal = () => {
    document.getElementById('image-modal').classList.add('hidden');
    document.getElementById('image-modal').classList.remove('flex');
};

document.addEventListener('DOMContentLoaded', function () {
    // --- DATA & STATE ---
    const shiftsData = {
        1: [{ plot: "D18", shc: "1", valve: "2" },{ plot: "D19", shc: "02", valve: "4" },{ plot: "D20", shc: "03", valve: "6" },{ plot: "D21", shc: "04", valve: "7" },{ plot: "D22", shc: "05", valve: "9" },{ plot: "D24", shc: "07", valve: "13" },{ plot: "E17", shc: "9", valve: "17" },{ plot: "E20", shc: "12", valve: "24" },{ plot: "E22", shc: "14", valve: "27" },{ plot: "E23", shc: "15", valve: "30" },{ plot: "E25", shc: "17", valve: "33" },{ plot: "E26", shc: "18", valve: "36" }],
        2: [{ plot: "D18", shc: "01", valve: "1" },{ plot: "D23", shc: "06", valve: "11" },{ plot: "D20", shc: "03", valve: "5" },{ plot: "E17", shc: "9", valve: "18" },{ plot: "E21", shc: "13", valve: "25" },{ plot: "E25", shc: "17", valve: "34" },{ plot: "E24", shc: "16", valve: "31" },{ plot: "E22", shc: "13", valve: "26" },{ plot: "D25", shc: "08", valve: "15" },{ plot: "E27", shc: "19", valve: "37" }],
        3: [{ plot: "D19", shc: "02", valve: "3" },{ plot: "D21", shc: "04", valve: "8" },{ plot: "D23", shc: "06", valve: "12" },{ plot: "D24", shc: "07", valve: "14" },{ plot: "D25", shc: "08", valve: "16" },{ plot: "E20", shc: "12", valve: "23" },{ plot: "E21", shc: "13", valve: "26" },{ plot: "E23", shc: "15", valve: "29" },{ plot: "E24", shc: "16", valve: "32" },{ plot: "E26", shc: "18", valve: "35" },{ plot: "E27", shc: "19", valve: "38" }]
    };
    let currentShift = 1;
    // Ini akan menyimpan data base64 dari foto sementara sebelum disimpan
    let photoDataCache = {};

    // --- DOM ELEMENTS ---
    const beforeTbody = document.getElementById('before-cleaning-tbody');
    const afterTbody = document.getElementById('after-cleaning-tbody');

    // --- CORE FUNCTIONS ---
    const renderInputTables = (shiftNumber) => {
        currentShift = shiftNumber;
        beforeTbody.innerHTML = '';
        afterTbody.innerHTML = '';
        photoDataCache = {}; // Reset cache saat render ulang

        const locations = shiftsData[shiftNumber];
        if (!locations) return;

        locations.forEach(loc => {
            beforeTbody.appendChild(createTableRow(loc, 'before'));
            afterTbody.appendChild(createTableRow(loc, 'after'));
        });
        document.getElementById('save-btn').disabled = false;
    };

    const createTableRow = (loc, type, data = {}, isReadOnly = false) => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b';
        const key = `${loc.plot}-${loc.shc}-${loc.valve}-${type}`;
        row.dataset.key = key;

        const readOnlyAttr = isReadOnly ? 'readonly class="bg-gray-100"' : '';

        row.innerHTML = `
            <td class="px-4 py-2 font-medium text-gray-900">${loc.plot}</td>
            <td class="px-4 py-2">${loc.shc}</td>
            <td class="px-4 py-2">${loc.valve}</td>
            <td class="px-4 py-2"><input type="number" step="any" data-field="inlet" ${readOnlyAttr} value="${data.inlet || ''}" class="w-24 p-1 border rounded"></td>
            <td class="px-4 py-2"><input type="number" step="any" data-field="outlet" ${readOnlyAttr} value="${data.outlet || ''}" class="w-24 p-1 border rounded"></td>
            <td class="px-4 py-2"><input type="text" data-field="variance" readonly value="${data.variance || ''}" class="w-24 p-1 border rounded bg-gray-200"></td>
            <td class="px-4 py-2"><input type="number" step="any" data-field="needle" ${readOnlyAttr} value="${data.needle || ''}" class="w-24 p-1 border rounded"></td>
            <td class="px-4 py-2" data-field="photos">
                ${isReadOnly 
                    ? (data.photos || []).map((p, i) => `<img src="${p.dataUrl}" alt="Foto ${i+1}" class="photo-thumbnail inline-block" onclick="openImageModal('${p.dataUrl}')">`).join('')
                    : `<input type="file" multiple accept="image/*" class="text-sm">
                       <div class="photo-preview mt-1 text-xs text-gray-500"></div>`
                }
            </td>`;
        return row;
    };

    const calculateVariance = (row) => {
        const inlet = parseFloat(row.querySelector('[data-field="inlet"]').value) || 0;
        const outlet = parseFloat(row.querySelector('[data-field="outlet"]').value) || 0;
        const varianceInput = row.querySelector('[data-field="variance"]');
        if (inlet > 0 || outlet > 0) {
            varianceInput.value = +(inlet - outlet).toFixed(2);
        } else {
            varianceInput.value = '';
        }
    };

    const handleSaveData = () => {
        const today = new Date().toISOString().slice(0, 10); // format YYYY-MM-DD
        let allReports = JSON.parse(localStorage.getItem('shcReports') || '[]');
        const rows = document.querySelectorAll('#before-cleaning-tbody tr, #after-cleaning-tbody tr');

        rows.forEach(row => {
            const key = row.dataset.key;
            const inlet = row.querySelector('[data-field="inlet"]').value;
            const outlet = row.querySelector('[data-field="outlet"]').value;
            if (!inlet && !outlet) return; // Lewati baris kosong

            const [plot, shc, valve, type] = key.split('-');
            const report = {
                date: today, shift: currentShift, plot, shc, valve, type,
                inlet, outlet,
                variance: row.querySelector('[data-field="variance"]').value,
                needle: row.querySelector('[data-field="needle"]').value,
                photos: photoDataCache[key] || []
            };
            allReports.push(report);
        });

        localStorage.setItem('shcReports', JSON.stringify(allReports));
        alert('Data berhasil disimpan!');
        renderInputTables(currentShift); // Reset tabel
    };

    const handleViewReport = () => {
        const date = document.getElementById('report-date').value;
        if (!date) {
            alert('Silakan pilih tanggal terlebih dahulu.');
            return;
        }
        const allReports = JSON.parse(localStorage.getItem('shcReports') || '[]');
        const filteredReports = allReports.filter(r => r.date === date);

        if (filteredReports.length === 0) {
            alert(`Tidak ada laporan yang ditemukan untuk tanggal ${date}.`);
            beforeTbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Tidak ada data.</td></tr>';
            afterTbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Tidak ada data.</td></tr>';
            return;
        }

        beforeTbody.innerHTML = '';
        afterTbody.innerHTML = '';
        filteredReports.forEach(report => {
            const loc = { plot: report.plot, shc: report.shc, valve: report.valve };
            const row = createTableRow(loc, report.type, report, true);
            if (report.type === 'before') {
                beforeTbody.appendChild(row);
            } else {
                afterTbody.appendChild(row);
            }
        });
        document.getElementById('save-btn').disabled = true; // Nonaktifkan tombol simpan saat mode lihat
    };
    
    const handleExport = () => {
         const allReports = JSON.parse(localStorage.getItem('shcReports') || '[]');
         if(allReports.length === 0){
             alert("Tidak ada data untuk diekspor.");
             return;
         }
         let csvContent = "data:text/csv;charset=utf-8,";
         const headers = ["Tanggal", "Shift", "Tipe", "Plot", "SHC", "Valve", "Inlet Pressure (bar)", "Outlet Pressure (bar)", "Variance Inlet-Outlet Pressure (bar)", "Needle Point (bar)"];
         csvContent += headers.join(",") + "\r\n";
         allReports.forEach(r => {
             const row = [r.date, r.shift, r.type, r.plot, r.shc, r.valve, r.inlet, r.outlet, r.variance, r.needle];
             csvContent += row.join(",") + "\r\n";
         });
         const encodedUri = encodeURI(csvContent);
         const link = document.createElement("a");
         link.setAttribute("href", encodedUri);
         link.setAttribute("download", `laporan_validasi_shc_lengkap.csv`);
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
    };
    
    // --- EVENT LISTENERS ---
    document.getElementById('shift-selector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const shift = e.target.dataset.shift;
            document.querySelectorAll('.shift-btn').forEach(btn => {
                btn.classList.toggle('bg-blue-600', btn === e.target);
                btn.classList.toggle('bg-gray-500', btn !== e.target);
            });
            renderInputTables(parseInt(shift));
        }
    });
    
    document.getElementById('view-report-btn').addEventListener('click', handleViewReport);
    document.getElementById('save-btn').addEventListener('click', handleSaveData);
    document.getElementById('export-btn').addEventListener('click', handleExport);

    const tableContainer = document.querySelector('.container');
    tableContainer.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        // Hitung varians saat input
        if (e.target.dataset.field === 'inlet' || e.target.dataset.field === 'outlet') {
            calculateVariance(row);
        }
    });

    tableContainer.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        if (!row || e.target.type !== 'file') return;
        
        const key = row.dataset.key;
        const previewContainer = row.querySelector('.photo-preview');
        previewContainer.innerHTML = 'Memproses...';
        photoDataCache[key] = []; // Reset foto untuk baris ini
        
        const files = Array.from(e.target.files).slice(0, 3); // Maks 3 file
        if(files.length === 0) {
            previewContainer.innerHTML = '';
            return;
        }

        let processedCount = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                photoDataCache[key].push({ name: file.name, dataUrl: event.target.result });
                processedCount++;
                if (processedCount === files.length) {
                    previewContainer.innerHTML = files.map(f => f.name).join(', ');
                }
            };
            reader.readAsDataURL(file);
        });
    });

    // --- INITIALIZATION ---
    document.getElementById('report-date').value = new Date().toISOString().slice(0,10);
    renderInputTables(currentShift);
});