// script.js

// 상태
let cronSchedules = []; // { hour, minute, ampm, displayTime, cronExpr }
let fileSha = ""; // GitHub 파일 업데이트를 위한 SHA
let pat = "";
let repo = "";

// 요소
const patInput = document.getElementById('github-pat');
const repoInput = document.getElementById('github-repo');
const btnLoad = document.getElementById('btn-load');
const scheduleSection = document.getElementById('schedule-section');
const timeList = document.getElementById('time-list');
const btnAdd = document.getElementById('btn-add-time');
const btnSave = document.getElementById('btn-save');
const statusMsg = document.getElementById('status-message');
const loadingOverlay = document.getElementById('loading-overlay');

// 모달
const modal = document.getElementById('time-modal');
const timeInput = document.getElementById('time-input');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');

// 유틸리티: Base64 디코딩 (Unicode 지원)
function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

// 유틸리티: Base64 인코딩 (Unicode 지원)
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showMessage(msg, type = 'success') {
    statusMsg.textContent = msg;
    statusMsg.className = 'status-msg ' + type;
    setTimeout(() => { statusMsg.textContent = ''; }, 5000);
}

// KST -> UTC Cron (`MM HH * * 1-5`)
function kstToUtcCron(hour, min) {
    let date = new Date();
    date.setHours(hour, min, 0, 0);
    // KST는 UTC+9 이므로 9시간을 뺌
    date.setHours(date.getHours() - 9);
    
    let utcHour = date.getHours();
    let utcMin = date.getMinutes();
    
    return `- cron: '${utcMin} ${utcHour} * * 1-5'`;
}

// UTC Cron -> KST Time string "HH:MM (AM/PM)"
function utcCronToKst(cronStr) {
    const match = cronStr.match(/- cron:\s*'(\d+)\s+(\d+)\s+\*\s+\*\s+[1-5\*]'/);
    if (!match) return null;

    let min = parseInt(match[1], 10);
    let hour = parseInt(match[2], 10);

    let date = new Date();
    date.setHours(hour + 9, min, 0, 0); // KST = UTC + 9

    let kstHour = date.getHours();
    let kstMin = date.getMinutes();
    
    let ampm = kstHour >= 12 ? 'PM' : 'AM';
    let displayHour = kstHour % 12 || 12;

    const displayTime = `${String(displayHour).padStart(2, '0')}:${String(kstMin).padStart(2, '0')} ${ampm}`;
    
    return {
        hour: kstHour,
        minute: kstMin,
        displayTime,
        cronExpr: cronStr.trim()
    };
}

// YAML 문자열 파싱
function parseSchedule(yamlStr) {
    const lines = yamlStr.split('\n');
    const schedules = [];
    
    let inScheduleBlock = false;
    for (const line of lines) {
        if (line.trim() === 'schedule:') {
            inScheduleBlock = true;
            continue;
        }
        
        if (inScheduleBlock) {
            if (line.trim().startsWith('- cron:')) {
                const parsed = utcCronToKst(line.trim());
                if (parsed) schedules.push(parsed);
            } else if (!line.trim().startsWith('#') && line.trim() !== '') {
                // 다른 설정 블록 시작 시 종료
                if (!line.includes('- cron')) {
                    inScheduleBlock = false;
                }
            }
        }
    }
    
    // 시간순 정렬
    schedules.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
    cronSchedules = schedules;
    renderTimeList();
}

// 화면 업데이트
function renderTimeList() {
    timeList.innerHTML = '';
    
    if (cronSchedules.length === 0) {
        timeList.innerHTML = '<p class="desc" style="text-align: center;">설정된 알림이 없습니다.</p>';
        return;
    }

    cronSchedules.forEach((sched, index) => {
        const div = document.createElement('div');
        div.className = 'time-item';
        div.innerHTML = `
            <span class="time-val">${sched.displayTime}</span>
            <button class="del-btn" onclick="removeTime(${index})" title="삭제">✖</button>
        `;
        timeList.appendChild(div);
    });
}

// 시간 삭제
window.removeTime = function(index) {
    cronSchedules.splice(index, 1);
    renderTimeList();
};

// 모달 제어
btnAdd.addEventListener('click', () => {
    timeInput.value = '';
    modal.classList.remove('hidden');
});

btnModalCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
});

btnModalConfirm.addEventListener('click', () => {
    const val = timeInput.value;
    if (!val) {
        alert("시간을 선택해주세요.");
        return;
    }

    const [h, m] = val.split(':').map(Number);
    
    // 중복 체크
    const exists = cronSchedules.some(s => s.hour === h && s.minute === m);
    if (exists) {
        alert("이미 같은 시간에 설정된 알림이 있습니다.");
        return;
    }

    let ampm = h >= 12 ? 'PM' : 'AM';
    let displayHour = h % 12 || 12;
    const displayTime = `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    const cronExpr = `    ${kstToUtcCron(h, m)}`; // 들여쓰기 포함

    cronSchedules.push({ hour: h, minute: m, displayTime, cronExpr });
    cronSchedules.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
    
    renderTimeList();
    modal.classList.add('hidden');
});

// GitHub API: 파일 가져오기
btnLoad.addEventListener('click', async () => {
    pat = patInput.value.trim();
    repo = repoInput.value.trim();

    if (!pat || !repo) {
        showMessage("PAT와 저장소 정보를 모두 입력해주세요.", "error");
        return;
    }

    showLoading();
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/.github/workflows/notify.yml`, {
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`저장소 접근 실패 (${response.status})`);
        }

        const data = await response.json();
        fileSha = data.sha;
        const decodedContent = b64DecodeUnicode(data.content);
        
        // 현재 파일 전체 내용 저장 (수정할 때 재사용)
        window.originalYaml = decodedContent;
        
        parseSchedule(decodedContent);
        scheduleSection.classList.remove('hidden');
        showMessage("설정을 성공적으로 불러왔습니다.");

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        hideLoading();
    }
});

// GitHub API: 파일 업데이트
btnSave.addEventListener('click', async () => {
    if (!pat || !repo || !fileSha || !window.originalYaml) return;

    showLoading();

    try {
        // 기존 schedule 블록을 새 블록으로 교체
        let lines = window.originalYaml.split('\n');
        let newLines = [];
        let inScheduleBlock = false;
        let scheduleAdded = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            if (line.trim() === 'schedule:') {
                inScheduleBlock = true;
                newLines.push(line);
                
                // 기존 주석 보존 위한 임시 처리 (단순화를 위해 스케줄만 주입)
                newLines.push('    # KST is UTC+9');
                cronSchedules.forEach(s => {
                    newLines.push(s.cronExpr);
                });
                scheduleAdded = true;
                continue;
            }

            if (inScheduleBlock) {
                // schedule 블록 내의 기존 항목(- cron이나 주석)은 무시
                if (!line.trim().startsWith('-') && !line.trim().startsWith('#') && line.trim() !== '') {
                    inScheduleBlock = false;
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }

        const newYaml = newLines.join('\n');
        const encodedContent = b64EncodeUnicode(newYaml);

        const payload = {
            message: "Update schedule via Dashboard",
            content: encodedContent,
            sha: fileSha
        };

        const response = await fetch(`https://api.github.com/repos/${repo}/contents/.github/workflows/notify.yml`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`저장 실패 (${response.status})`);
        }

        const data = await response.json();
        fileSha = data.content.sha; // 새 SHA 업데이트
        window.originalYaml = newYaml;

        showMessage("알림 시간이 성공적으로 업데이트되었습니다! 🎉");

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        hideLoading();
    }
});
