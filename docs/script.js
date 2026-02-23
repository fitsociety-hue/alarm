// script.js

// 상태
let cronSchedules = []; // { hour, minute, displayTime, cronExpr }

// 요소
const scheduleSection = document.getElementById('schedule-section');
const timeList = document.getElementById('time-list');
const btnAdd = document.getElementById('btn-add-time');
const btnSave = document.getElementById('btn-save');
const statusMsg = document.getElementById('status-message');

// 모달
const modal = document.getElementById('time-modal');
const timeInput = document.getElementById('time-input');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');

function showMessage(msg, type = 'success') {
    statusMsg.textContent = msg;
    statusMsg.className = 'status-msg ' + type;
    setTimeout(() => { statusMsg.textContent = ''; }, 5000);
}

// KST -> UTC Cron (`MM HH * * 1-5`)
function kstToUtcCron(hour, min) {
    let utcHour = Math.floor((hour - 9 + 24) % 24);
    return `- cron: '${min} ${utcHour} * * 1-5'`;
}

// UTC Cron -> KST Time string "HH:MM (AM/PM)"
function utcCronToKst(cronStr) {
    const match = cronStr.match(/- cron:\s*['"](\d+)\s+(\d+).*?['"]/);
    if (!match) return null;

    let min = parseInt(match[1], 10);
    let utcHour = parseInt(match[2], 10);
    let kstHour = Math.floor((utcHour + 9) % 24);

    let ampm = kstHour >= 12 ? 'PM' : 'AM';
    let displayHour = kstHour % 12 || 12;

    const displayTime = `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;

    return {
        hour: kstHour,
        minute: min,
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
window.removeTime = function (index) {
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
    const cronExpr = kstToUtcCron(h, m); // 들여쓰기 제거 후 순수 cron 문자열만 저장

    cronSchedules.push({ hour: h, minute: m, displayTime, cronExpr });
    cronSchedules.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));

    renderTimeList();
    modal.classList.add('hidden');
});

// 페이지 로드 시 공개 리포지토리에서 바로 읽어오기
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // 캐시 방지를 위해 고유 타임스탬프 쿼리 파라미터 추가
        const t = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/fitsociety-hue/alarm/main/.github/workflows/notify.yml?t=${t}`);
        if (!response.ok) throw new Error("설정 파일을 불러올 수 없습니다.");

        const yamlContent = await response.text();
        window.originalYaml = yamlContent;
        parseSchedule(yamlContent);

        scheduleSection.classList.remove('hidden');
    } catch (error) {
        showMessage(error.message, "error");
    }
});

// 코드 생성 및 에디터 열기 (PAT 입력 없이)
btnSave.addEventListener('click', () => {
    if (!window.originalYaml) {
        showMessage("설정 파일이 로드되지 않았습니다.", "error");
        return;
    }

    try {
        let lines = window.originalYaml.split('\n');
        let newLines = [];
        let inScheduleBlock = false;
        let scheduleAdded = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (line.trim() === 'schedule:') {
                inScheduleBlock = true;
                newLines.push(line);
                newLines.push('    # KST is UTC+9');
                cronSchedules.forEach(s => {
                    newLines.push(`    ${s.cronExpr}`); // 들여쓰기 추가
                });
                scheduleAdded = true;
                continue;
            }

            if (inScheduleBlock) {
                if (!line.trim().startsWith('-') && !line.trim().startsWith('#') && line.trim() !== '') {
                    inScheduleBlock = false;
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }

        const newYaml = newLines.join('\n');

        // 클립보드에 복사
        navigator.clipboard.writeText(newYaml).then(() => {
            alert("✅ 설정이 복사되었습니다!\n\n이제 열리는 페이지에서 원래 내용 전체를 지우고 [붙여넣기(Ctrl+V)] 한 후 우측 상단의 [Commit changes...] 버튼을 눌러주세요.");
            // GitHub 에디터 페이지 열기
            window.open('https://github.com/fitsociety-hue/alarm/edit/main/.github/workflows/notify.yml', '_blank');
            showMessage("코드가 복사되었습니다. 새 탭에서 적용을 완료해 주세요.");
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            prompt("아래 코드를 복사해서 반영해 주세요:", newYaml);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
});
