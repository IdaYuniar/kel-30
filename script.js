// ************************ GLOBAL INITIALIZATION & TAB LOGIC ************************

// Fungsi global yang perlu diakses dari HTML
function mulaiChat() {
    let konselor = document.querySelector("input[name='konselor']:checked");
    if (!konselor) {
        alert("Pilih konselor dulu");
        return;
    }

    // Simpan nama konselor yang dipilih (permanen)
    localStorage.setItem("konselor", konselor.value);

    // Reset/hapus log chat lama saat konselor baru dipilih (opsional, tergantung kebutuhan)
    // localStorage.removeItem("chatLog"); 

    // Tampilkan bagian chat dan sembunyikan bagian pemilihan
    document.getElementById("namaKonselor").innerText = konselor.value + " (Online)";
    document.getElementById("selectionSection").style.display = 'none';
    document.getElementById("chatSection").style.display = 'block';

    loadChatLog(); // Muat log chat (akan memuat pesan sambutan baru jika log kosong)
}

function sendMsg() {
    let inputElement = document.getElementById("msg");
    let text = inputElement.value;

    if (text.trim() === "") return;

    let box = document.getElementById("chatBox");

    // 1. Tambahkan Pesan Pengguna (ME)
    let userBubble = document.createElement("div");
    userBubble.className = "msg bubble me";
    userBubble.innerText = text;
    box.appendChild(userBubble);

    // Kosongkan input dan scroll
    inputElement.value = "";
    box.scrollTop = box.scrollHeight;

    // Simpan log setelah pesan pengguna
    saveChatLog();

    // 2. Simulasi Balasan Konselor setelah jeda (Untuk Log)
    setTimeout(() => {
        let replyText = generateKonselorReply(text);
        let conselorBubble = document.createElement("div");
        conselorBubble.className = "msg bubble other";
        conselorBubble.innerText = replyText;
        box.appendChild(conselorBubble);

        box.scrollTop = box.scrollHeight;

        // Simpan log setelah balasan konselor
        saveChatLog();
    }, 1000); // Balas setelah 1 detik
}

function handleKey(event) {
    if (event.key === 'Enter') {
        sendMsg();
    }
}


document.addEventListener('DOMContentLoaded', () => {

    // Tab logic
    document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        // Nonaktifkan semua tab
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        // Tampilkan tab yang diklik
        btn.classList.add('active');

        // Sembunyikan semua section
        document.getElementById('finance').style.display = 'none';
        document.getElementById('career').style.display = 'none';
        document.getElementById('mental').style.display = 'none';

        // Tampilkan section yang sesuai
        document.getElementById(tabName).style.display = 'block';

        // Panggil fungsi inisialisasi jika diperlukan
        if (tabName === 'mental') {
            loadMessages();
        }
    }));

    // ************************ FINANCE ZONE LOGIC ************************

    // Fungsi untuk format angka ke Rupiah
    function formatRupiah(number) {
        return 'Rp ' + number.toLocaleString('id-ID');
    }

    // Fungsi untuk menghitung budget
    function calculateBudget() {
        const income = parseFloat(document.getElementById('income').value) || 0;
        const fixedExp = parseFloat(document.getElementById('fixed').value) || 0;
        const savePct = parseFloat(document.getElementById('savePct').value) || 0;

        if (income <= 0) {
            document.getElementById('budgetResult').innerHTML = '<p style="color:red;">Penghasilan harus lebih dari 0.</p>';
            document.getElementById('summaryText').innerHTML = 'Belum ada perhitungan.';
            updateDistributionGraph(0, 0, 0, income); // Reset graph
            return;
        }

        // Hitung Simpanan (Saving)
        const saving = income * (savePct / 100);

        // Hitung Variabel (Variable Expense)
        const variable = income - fixedExp - saving;

        if (variable < 0) {
            document.getElementById('budgetResult').innerHTML = '<p style="color:var(--delete-red); font-weight:bold;">Saran: Jumlah pengeluaran tetap dan simpanan target melebihi penghasilan. Kurangi pengeluaran tetap atau target simpanan.</p>';
            document.getElementById('summaryText').innerHTML = `<p style="color:var(--delete-red); font-weight:bold;">Over-budget! Sisa variabel: ${formatRupiah(variable)}</p>`;
            updateDistributionGraph(fixedExp, saving, variable, income); // Tampilkan graph dengan variabel negatif
            return;
        }

        // Tampilkan Hasil
        const resultHTML = `
            <h4 style="margin-bottom:8px;">Saran:</h4>
            <div style="font-weight:bold;">
                <p style="margin:4px 0;">Simpanan: ${formatRupiah(saving)} (${savePct}%)</p>
                <p style="margin:4px 0;">Pengeluaran Tetap: ${formatRupiah(fixedExp)} (${((fixedExp / income) * 100).toFixed(0)}%)</p>
                <p style="margin:4px 0; color:var(--primary);">Pengeluaran Variabel Maksimum: ${formatRupiah(variable)} (${((variable / income) * 100).toFixed(0)}%)</p>
            </div>
        `;
        document.getElementById('budgetResult').innerHTML = resultHTML;

        // Update Ringkasan
        document.getElementById('summaryText').innerHTML = `
            <p style="margin:4px 0;">Simpanan: <b>${formatRupiah(saving)}</b></p>
            <p style="margin:4px 0;">Variabel Maks: <b>${formatRupiah(variable)}</b></p>
        `;

        // Simpan hasil ke Local Storage
        localStorage.setItem('budgetData', JSON.stringify({ income, fixedExp, saving, variable, savePct }));

        // Update Bar Graph
        updateDistributionGraph(fixedExp, saving, variable, income);
        // Update Progress Bar
        updateExpenseProgress();
    }

    // Fungsi untuk mengupdate bar graph
    function updateDistributionGraph(fixed, saving, variable, total) {
        const fixedBar = document.getElementById('fixedBar');
        const saveBar = document.getElementById('saveBar');
        const variableBar = document.getElementById('variableBar');
        const barContainer = document.getElementById('barContainer');

        if (total === 0) {
            fixedBar.style.width = '0%';
            saveBar.style.width = '0%';
            variableBar.style.width = '0%';
            fixedBar.textContent = '';
            saveBar.textContent = '';
            variableBar.textContent = '';
            barContainer.style.border = 'none'; // Hapus border jika total 0
            return;
        }

        barContainer.style.border = 'none'; // Default

        // Persentase
        const fixedPct = (fixed / total) * 100;
        const savePct = (saving / total) * 100;
        const variablePct = (variable / total) * 100;

        fixedBar.style.width = `${fixedPct.toFixed(1)}%`;
        saveBar.style.width = `${savePct.toFixed(1)}%`;

        // Teks di dalam bar
        fixedBar.textContent = fixedPct > 0 ? `${fixedPct.toFixed(0)}%` : '';
        saveBar.textContent = savePct > 0 ? `${savePct.toFixed(0)}%` : '';

        if (variable < 0) {
            // Kasus Over-budget
            variableBar.style.width = '0%'; // Bar variabel tidak perlu ditampilkan
            variableBar.textContent = '';
            barContainer.style.border = '2px solid var(--delete-red)';
        } else {
            // Kasus Normal
            variableBar.style.width = `${variablePct.toFixed(1)}%`;
            variableBar.textContent = variablePct > 0 ? `${variablePct.toFixed(0)}%` : '';
        }
    }

    // Fungsi untuk update progress bar pengeluaran
    function updateExpenseProgress() {
        const budgetData = JSON.parse(localStorage.getItem('budgetData'));
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

        if (!budgetData || budgetData.variable <= 0) {
            document.getElementById('variableProgress').style.width = '0%';
            document.getElementById('spentRatio').textContent = '0%';
            return;
        }

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const variableBudget = budgetData.variable;
        const ratio = (totalSpent / variableBudget) * 100;
        const cappedRatio = Math.min(ratio, 100);

        document.getElementById('variableProgress').style.width = `${cappedRatio}%`;
        document.getElementById('spentRatio').textContent = `${ratio.toFixed(1)}% (${formatRupiah(totalSpent)} dari ${formatRupiah(variableBudget)})`;

        // Ubah warna jika melebihi budget
        const progressBar = document.getElementById('variableProgress');
        if (ratio > 100) {
            progressBar.style.backgroundColor = 'var(--delete-red)';
        } else {
            progressBar.style.backgroundColor = 'var(--accent)';
        }
    }

    // Fungsi untuk render daftar pengeluaran
    function renderExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const expList = document.getElementById('expList');
        expList.innerHTML = '';

        expenses.forEach((exp, index) => {
            const li = document.createElement('li');

            li.innerHTML = `
                <span>${exp.name}</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="font-weight:bold;">${formatRupiah(exp.amount)}</span>
                    <button class="btn-delete" data-index="${index}">Hapus</button>
                </div>
            `;
            expList.appendChild(li);
        });

        updateExpenseProgress();
    }

    // Fungsi untuk menambah pengeluaran
    function addExpense() {
        const expName = document.getElementById('expName').value.trim();
        const expAmt = parseFloat(document.getElementById('expAmt').value);

        if (expName && expAmt > 0) {
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            expenses.push({ name: expName, amount: expAmt });
            localStorage.setItem('expenses', JSON.stringify(expenses));

            document.getElementById('expName').value = '';
            document.getElementById('expAmt').value = '';

            renderExpenses();
        } else {
            alert('Masukkan nama pengeluaran dan jumlah yang valid.');
        }
    }

    // Fungsi untuk menghapus pengeluaran
    function deleteExpense(index) {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
    }

    // Event Listeners Finance Zone
    document.getElementById('calcBudget').addEventListener('click', calculateBudget);
    document.getElementById('resetBudget').addEventListener('click', () => {
        // Menggunakan nilai default
        document.getElementById('income').value = '5000000';
        document.getElementById('fixed').value = '2000000';
        document.getElementById('savePct').value = '20';
        document.getElementById('budgetResult').innerHTML = '';
        document.getElementById('summaryText').innerHTML = 'Belum ada perhitungan.';
        localStorage.removeItem('budgetData');
        localStorage.removeItem('expenses');
        renderExpenses();
        updateDistributionGraph(0, 0, 0, 1); // Reset visual graph
        document.getElementById('variableProgress').style.width = '0%';
        document.getElementById('spentRatio').textContent = '0%';
    });
    document.getElementById('addExp').addEventListener('click', addExpense);
    document.getElementById('expList').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            deleteExpense(index);
        }
    });

    // Load initial data for Finance Zone
    function initFinance() {
        const budgetData = JSON.parse(localStorage.getItem('budgetData'));
        if (budgetData) {
            document.getElementById('income').value = budgetData.income;
            document.getElementById('fixed').value = budgetData.fixedExp;
            document.getElementById('savePct').value = budgetData.savePct;
            calculateBudget();
        }
        renderExpenses();
    }


    // ************************ CAREER ZONE LOGIC ************************

    // Fungsi untuk menyimpan rencana karir
    function saveCareerPlan() {
        const currentPos = document.getElementById('currentPos').value;
        const targetPos = document.getElementById('targetPos').value;
        const actions = document.getElementById('careerActions').value;

        if (!currentPos || !targetPos) {
            document.getElementById('planPreview').innerHTML = '<p style="color:red;">Isi Posisi Saat Ini dan Target Posisi.</p>';
            return;
        }

        const planHTML = `
            <div style="border: 1px dashed var(--accent); padding: 10px; border-radius: 8px;">
                <p style="font-weight: bold; margin: 0 0 5px 0;">Rencana Disimpan:</p>
                <p style="margin: 3px 0; font-size: 14px;">Saat Ini: <b>${currentPos}</b></p>
                <p style="margin: 3px 0; font-size: 14px;">Target: <b>${targetPos}</b></p>
                <p style="margin: 3px 0; font-size: 14px;">Langkah: ${actions.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        document.getElementById('planPreview').innerHTML = planHTML;

        // Simpan ke Local Storage
        localStorage.setItem('careerPlan', JSON.stringify({ currentPos, targetPos, actions }));
    }

    // Fungsi untuk membuat Resume Preview
    function generateResume() {
        const fullName = document.getElementById('fullName').value;
        const profile = document.getElementById('profile').value;
        const xp = document.getElementById('xp').value;

        if (!fullName) {
            document.getElementById('resumePreview').textContent = 'Nama harus diisi.';
            return;
        }

        const resumeText = `
Nama: ${fullName}
Posisi: ${document.getElementById('currentPos').value || 'Belum Ditentukan'}

--- Ringkasan Diri ---
${profile || 'Tuliskan ringkasan diri Anda di form di atas.'}

--- Pengalaman / Proyek Utama ---
${xp || 'Tuliskan pengalaman/proyek Anda di form di atas.'}

---
Generated by Vinix 7 Asisten
        `;

        const resumeHTML = resumeText.replace(/\n/g, '<br>').replace(/---/g, '<hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;">').trim();
        document.getElementById('resumePreview').innerHTML = resumeHTML;

        // Simpan data mentah untuk download
        localStorage.setItem('resumeContent', resumeText.trim());
    }

    // Fungsi untuk mengunduh Resume
    function downloadResume() {
        const content = localStorage.getItem('resumeContent');
        if (!content) {
            alert('Buat Resume terlebih dahulu!');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Resume_Vinix7.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Fungsi untuk menampilkan jalur skill
    function showSkillPath() {
        const skill = document.getElementById('skillSelect').value;
        const pathArea = document.getElementById('pathArea');
        let pathContent = '';

        const skillData = {
            web: {
                path: "Basic: HTML/CSS/JS (30%) → Mid: React/Vue (50%) → Advance: State Management, Server-Side Rendering (70%)",
                industry: "Rata-rata Gaji Junior: Rp 5 Juta. Kebutuhan industri: 70% cari React, 30% cari Vue."
            },
            data: {
                path: "Basic: Python/R, Statistik (30%) → Mid: SQL, Machine Learning (50%) → Advance: Deep Learning, Big Data (70%)",
                industry: "Rata-rata Gaji Junior: Rp 6 Juta. Kebutuhan industri: Fokus ke Python & Cloud Services (AWS/GCP)."
            },
            uiux: {
                path: "Basic: Figma/Sketch, Prinsip Dasar (30%) → Mid: User Research, Prototyping (50%) → Advance: Design Systems, Accessibility (70%)",
                industry: "Rata-rata Gaji Junior: Rp 4.5 Juta. Kebutuhan industri: Skill Figma & Pemahaman mendalam tentang User Journey."
            }
        };

        const data = skillData[skill];

        pathContent = `
            <p style="font-weight:bold; margin-top:5px;">Jalur Perkembangan:</p>
            <div class="progress-bar-container" style="height: 15px;">
                <div class="progress-bar" style="width: 30%; background-color:#1E5EAE;"></div>
                <div class="progress-bar" style="width: 20%; background-color:#15488c;"></div>
                <div class="progress-bar" style="width: 20%; background-color:#0f386b;"></div>
            </div>
            <p class="muted" style="margin-top:5px; font-size:11px;">*Visualisasi 30% Basic, 20% Mid, 20% Advance</p>
            <p style="margin: 5px 0 0 0;">${data.path}</p>
            <div class="skill-data" style="margin-top: 10px;">
                <strong>Data Industri:</strong> ${data.industry}
            </div>
        `;

        pathArea.innerHTML = pathContent;
    }

    // Event Listeners Career Zone
    document.getElementById('savePlan').addEventListener('click', saveCareerPlan);
    document.getElementById('genResume').addEventListener('click', generateResume);
    document.getElementById('downloadResume').addEventListener('click', downloadResume);
    document.getElementById('showPath').addEventListener('click', showSkillPath);

    // Reminder (menggunakan browser Notification API - perlu izin)
    document.getElementById('setReminder').addEventListener('click', () => {
        if (!("Notification" in window)) {
            alert("Browser ini tidak mendukung notifikasi desktop.");
            return;
        }

        if (Notification.permission === "granted") {
            const targetPos = document.getElementById('targetPos').value;
            const msg = targetPos ? `Ingat target kariermu: ${targetPos}` : 'Jangan lupa cek rencana kariermu!';
            // Ganti 'img/logo.png' dengan path logo yang valid jika ada
            new Notification("Vinix 7: Pengingat Karir", { body: msg, icon: 'img/logo.png' });
            alert("Pengingat diatur (muncul segera jika browser aktif).");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    document.getElementById('setReminder').click(); // Coba lagi
                } else {
                    alert("Izin notifikasi ditolak.");
                }
            });
        } else {
            alert("Izin notifikasi ditolak secara permanen. Silakan ubah di pengaturan browser.");
        }
    });

    // Portofolio Image Preview
    document.getElementById('projImg').addEventListener('change', function (event) {
        const preview = document.getElementById('imgPreview');
        preview.innerHTML = '';
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                // Gaya image sudah diatur di CSS .image-preview img
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // Load initial data for Career Zone
    function initCareer() {
        const careerPlan = JSON.parse(localStorage.getItem('careerPlan'));
        if (careerPlan) {
            document.getElementById('currentPos').value = careerPlan.currentPos;
            document.getElementById('targetPos').value = careerPlan.targetPos;
            document.getElementById('careerActions').value = careerPlan.actions;
            saveCareerPlan(); // Render preview
        }
    }


    // ************************ MENTAL ZONE LOGIC ************************

    let replyingToId = null;

    // Fungsi untuk membuat HTML pesan
    function createMessageHTML(msg) {
        let replyIndicator = '';
        if (msg.replyTo) {
            // Cari pesan yang dibalas
            const msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
            const repliedMsg = msgs.find(m => m.id === msg.replyTo);
            if (repliedMsg) {
                const repliedText = repliedMsg.text.length > 50 ? repliedMsg.text.substring(0, 50) + '...' : repliedMsg.text;
                replyIndicator = `<div class="msg-reply-indicator">Membalas ${repliedMsg.name}: ${repliedText}</div>`;
            }
        } 
        return `
            <div class="msg" data-id="${msg.id}">
                ${stickerModalHTML}
                ${replyIndicator}
                <p style="margin:0; font-weight:bold; font-size:15px; color:var(--accent);">${msg.name} ${msg.mood}</p>
                <p style="margin:4px 0 8px 0;">${msg.text.replace(/\n/g, '<br>')}</p>
                <div style="display:flex; justify-content: flex-end; gap: 8px;">
                    <button class="reaction-trigger-btn" data-id="${msg.id}">➕</button>
                    <button class="btn-ghost reply-btn" data-id="${msg.id}">Balas</button>
                    <button class="btn-delete" data-id="${msg.id}">Hapus</button>
                </div>
                ${reactionDisplayHTML}
            </div>
        `;
    }

    // Fungsi untuk memuat pesan
    function loadMessages() {
        const msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
        const msgList = document.getElementById('msgList');
        msgList.innerHTML = '';

        // Urutkan berdasarkan ID (terbaru di atas, untuk UI chat)
        msgs.sort((a, b) => b.id - a.id);

        msgs.forEach(msg => {
            msgList.innerHTML += createMessageHTML(msg);
        });
    }

    // Fungsi untuk mengirim pesan
    function postMessage() {
        const cmName = document.getElementById('cmName').value.trim() || 'Anonim';
        const cmMsg = document.getElementById('cmMsg').value.trim();
        const cmMood = document.getElementById('cmMood').value;

        if (!cmMsg) {
            alert('Pesan tidak boleh kosong.');
            return;
        }

        const msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
        const newMsg = {
            id: Date.now(),
            name: cmName,
            text: cmMsg,
            mood: cmMood,
            replyTo: replyingToId,
            reactions: {}
        };

        msgs.push(newMsg);
        localStorage.setItem('communityMessages', JSON.stringify(msgs));

        document.getElementById('cmMsg').value = '';
        replyingToId = null; // Reset status balasan
        document.getElementById('replyingTo').style.display = 'none';

        loadMessages();
    }

    // Fungsi untuk menghapus pesan
    function deleteMessage(id) {
        if (confirm("Yakin ingin menghapus pesan ini?")) {
            let msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
            msgs = msgs.filter(msg => msg.id !== id);
            localStorage.setItem('communityMessages', JSON.stringify(msgs));
            loadMessages();
        }
    }

    // Fungsi untuk menambahkan Reaksi/Stiker
    function addReaction(msgId, emoji) {
        let msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
        const msgIndex = msgs.findIndex(msg => msg.id === msgId);

        if (msgIndex !== -1) {
            const msg = msgs[msgIndex];
            // Inisialisasi reactions jika belum ada
            if (!msg.reactions) {
                msg.reactions = {};
            }

            // Tambahkan reaksi (toggle)
            if (msg.reactions[emoji]) {
                msg.reactions[emoji]++;
            } else {
                msg.reactions[emoji] = 1;
            }

            localStorage.setItem('communityMessages', JSON.stringify(msgs));
            loadMessages();
        }
    }

    // Event Listeners Mental Zone
    document.getElementById('postMsg').addEventListener('click', postMessage);
    document.getElementById('clearMsgs').addEventListener('click', () => {
        if (confirm("Yakin ingin menghapus semua pesan? Tindakan ini tidak dapat dibatalkan!")) {
            localStorage.removeItem('communityMessages');
            loadMessages();
        }
    });

    // Delegation untuk tombol Balas, Hapus, dan Trigger Reaksi
    document.getElementById('msgList').addEventListener('click', (e) => {
        const target = e.target;
        // Cari data-id di elemen yang diklik atau parent terdekat (untuk tombol di dalam msg)
        const msgElement = target.closest('.msg');
        const msgIdAttr = target.getAttribute('data-id') || (msgElement ? msgElement.getAttribute('data-id') : null);
        const msgId = parseInt(msgIdAttr);

        if (!msgIdAttr || isNaN(msgId)) return;


        // Tombol Balas
        if (target.classList.contains('reply-btn')) {
            const msgs = JSON.parse(localStorage.getItem('communityMessages')) || [];
            const msgToReply = msgs.find(msg => msg.id === msgId);

            if (msgToReply) {
                replyingToId = msgId;
                const previewText = msgToReply.text.length > 30 ? msgToReply.text.substring(0, 30) + '...' : msgToReply.text;
                document.getElementById('replyingText').textContent = `${msgToReply.name}: "${previewText}"`;
                document.getElementById('replyingTo').style.display = 'flex';
            }
        }

        // Tombol Hapus
        if (target.classList.contains('btn-delete')) {
            deleteMessage(msgId);
        }

        // Tombol Trigger Reaksi
        if (target.classList.contains('reaction-trigger-btn')) {
            // Sembunyikan semua modal stiker
            document.querySelectorAll('.sticker-modal').forEach(modal => modal.style.display = 'none');

            // Tampilkan modal stiker yang sesuai
            const modal = document.querySelector(`.sticker-modal[data-msg-id="${msgId}"]`);
            if (modal) {
                modal.style.display = 'flex';
            }
        }

        // Pilih Stiker dari Modal
        if (target.classList.contains('modal-sticker')) {
            const msgIdFromModal = parseInt(target.closest('.sticker-modal').getAttribute('data-msg-id'));
            const emoji = target.getAttribute('data-emoji');
            addReaction(msgIdFromModal, emoji);
            target.closest('.sticker-modal').style.display = 'none'; // Sembunyikan setelah memilih
        }

        // Klik pada Reaksi yang Sudah Ada (anggap sebagai toggle/tambahan)
        if (target.classList.contains('reaction-count')) {
            const msgIdFromCount = parseInt(target.getAttribute('data-msg-id'));
            const emoji = target.getAttribute('data-emoji');
            addReaction(msgIdFromCount, emoji);
        }
    });

    // Tombol Batal Balasan
    document.getElementById('cancelReply').addEventListener('click', () => {
        replyingToId = null;
        document.getElementById('replyingTo').style.display = 'none';
    });

    // Sembunyikan modal stiker jika klik di luar
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.reaction-trigger-btn') && !e.target.closest('.sticker-modal') && !e.target.closest('.reaction-count')) {
            document.querySelectorAll('.sticker-modal').forEach(modal => modal.style.display = 'none');
        }
    });


    // ************************ MENTAL ZONE (CHAT KONSELROR) LOGIC ************************

    // Fungsi untuk memuat log chat dari localStorage saat halaman dimuat
    function loadChatLog() {
        const chatBox = document.getElementById("chatBox");
        const storedLog = localStorage.getItem("chatLog");

        // Jika log chat ada, tampilkan
        if (storedLog) {
            chatBox.innerHTML = storedLog;
        } else {
            // Jika tidak ada log, tambahkan pesan sambutan awal
            const welcomeMsg = '<div class="bubble other">Halo, saya siap mendengarkan. Apa yang ingin Anda curhatkan hari ini?</div>';
            chatBox.innerHTML = welcomeMsg;
            // Simpan pesan sambutan sebagai log awal
            saveChatLog();
        }
        // Scroll ke bawah
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Fungsi untuk menyimpan log chat ke localStorage
    function saveChatLog() {
        const chatBox = document.getElementById("chatBox");
        localStorage.setItem("chatLog", chatBox.innerHTML);
    }

    // Fungsi untuk membalas pesan (Simulasi)
    function generateKonselorReply(userMsg) {
        const msgLower = userMsg.toLowerCase();

        if (msgLower.includes("halo") || msgLower.includes("hai") || msgLower.includes("selamat")) {
            return "Terima kasih sudah menghubungi. Bagaimana perasaan Anda hari ini?";
        } else if (msgLower.includes("sedih") || msgLower.includes("depresi") || msgLower.includes("stress")) {
            return "Saya turut prihatin. Bisakah Anda ceritakan lebih detail tentang hal yang membuat Anda merasa seperti itu?";
        } else if (msgLower.includes("terima kasih") || msgLower.includes("makasih")) {
            return "Sama-sama. Ingat, saya selalu di sini jika Anda butuh bicara lagi.";
        } else if (msgLower.includes("nama")) {
            let konselorName = localStorage.getItem("konselor") || "Konselor";
            return `Anda sedang berbicara dengan ${konselorName}. Apa yang bisa saya bantu?`;
        } else {
            return "Saya mengerti. Silakan jelaskan lebih lanjut. Saya mendengarkan.";
        }
    }


    // ************************ GLOBAL INITIALIZATION ************************

    // Jalankan fungsi inisialisasi saat halaman dimuat
    initFinance();
    initCareer();

    // Tampilkan jalur skill default saat pertama kali dimuat
    showSkillPath();

    // PENGATURAN AWAL: Cek status konselor dan muat log saat dokumen siap
    const storedKonselor = localStorage.getItem("konselor");
    if (storedKonselor) {
        // Jika ada konselor, tampilkan chat
        document.getElementById("namaKonselor").innerText = storedKonselor + " (Online)";
        document.getElementById("selectionSection").style.display = 'none';
        document.getElementById("chatSection").style.display = 'block';
        loadChatLog();
    } else {
        // Jika belum ada, tampilkan pemilihan konselor
        document.getElementById("selectionSection").style.display = 'block';
        document.getElementById("chatSection").style.display = 'none';
    }

});
