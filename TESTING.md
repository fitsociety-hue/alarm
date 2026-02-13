# 강동어울림복지관 게시판 Google Chat 알림 시스템 - 테스트 가이드

이 문서는 알림 시스템을 설정하고 테스트하는 방법을 안내합니다.

## 📋 Google Chat Webhook URL 설정하기

### 1. Google Chat 스페이스 생성

1. Google Chat 웹사이트 접속: <https://chat.google.com>
2. 왼쪽 사이드바에서 "+" 버튼 클릭 → "스페이스 만들기" 선택
3. 스페이스 이름: "게시판 알림" (원하는 이름)
4. "만들기" 클릭

### 2. Webhook 생성

1. 생성한 스페이스 클릭
2. 상단의 스페이스 이름 옆 ▼ 클릭
3. "Apps & integrations" 선택
4. "Webhooks" 탭 클릭
5. "+ Add webhook" 클릭
6. Webhook 이름: "게시판 알림봇"
7. (선택) Avatar URL 또는 이미지 업로드
8. "Save" 클릭
9. **생성된 Webhook URL 복사** (<https://chat.googleapis.com/v1/spaces/>... 형태)

### 3. config.json에 Webhook URL 설정

```json
{
  "board_url": "https://gde.or.kr/counseling",
  "webhook_url": "여기에_복사한_Webhook_URL_붙여넣기",
  "check_times": ["09:10", "11:00", "13:30", "15:00", "17:00"],
  "last_checked_file": "last_checked.json",
  "notification_recipient": "alias1004@gde.or.kr"
}
```

## 🧪 테스트 방법

### 1. Python 패키지 설치

PowerShell이나 명령 프롬프트에서:

```bash
cd C:\Users\user\.gemini\antigravity\scratch\antigravity_skills\board-notification-gchat
pip install -r requirements.txt
```

### 2. 수동 실행 테스트

```bash
python check_board.py
```

**예상 출력:**

```
============================================================
🔍 게시판 모니터링 시작: 2026-02-13 14:30:00
📋 게시판 URL: https://gde.or.kr/counseling
============================================================
✅ 15개의 게시글을 찾았습니다.
🆕 2개의 새 게시글을 발견했습니다.
✅ 알림 전송 성공: 이용문의
✅ 알림 전송 성공: 연구 모집 문의 드립니다.
============================================================
✅ 모니터링 완료: 2026-02-13 14:30:05
============================================================
```

### 3. Google Chat에서 알림 확인

- 생성한 Google Chat 스페이스에 알림 메시지가 도착했는지 확인
- 메시지에 게시글 제목, 작성자, 날짜 정보가 포함되어 있는지 확인
- "게시글 확인하기" 버튼을 클릭하여 실제 게시판으로 이동되는지 확인

### 4. 중복 알림 방지 테스트

다시 한 번 실행:

```bash
python check_board.py
```

**예상 출력:**

```
🆕 0개의 새 게시글을 발견했습니다.
📭 새 게시글이 없습니다.
```

이미 확인한 게시글에 대해서는 알림이 오지 않아야 합니다.

## 🔧 문제 해결

### ❌ "설정 파일을 찾을 수 없습니다"

- `config.json` 파일이 스크립트와 같은 폴더에 있는지 확인
- 파일명 철자 확인

### ❌ "Google Chat Webhook URL을 설정해주세요!"

- `config.json`에서 `webhook_url` 값을 실제 Webhook URL로 변경했는지 확인
- URL이 `https://chat.googleapis.com/v1/spaces/`로 시작하는지 확인

### ❌ "게시판 접속 실패"

- 인터넷 연결 확인
- 게시판 URL이 올바른지 확인
- 방화벽 또는 프록시 설정 확인

### ❌ "알림 전송 실패"

- Webhook URL이 정확한지 재확인
- Google Chat 스페이스가 활성화되어 있는지 확인
- 네트워크 연결 확인

### ⚠️ "게시글을 찾지 못함" 또는 "0개의 게시글"

게시판 HTML 구조가 변경되었을 수 있습니다. `check_board.py`의 파싱 로직을 수정해야 할 수 있습니다.

## 🚀 Windows 작업 스케줄러 설정

테스트가 성공적으로 완료되면 자동 실행을 설정합니다:

### 자동 설정 (권장)

PowerShell을 **관리자 권한으로** 실행 후:

```powershell
cd C:\Users\user\.gemini\antigravity\scratch\antigravity_skills\board-notification-gchat
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup_scheduler.ps1
```

### 설정 확인

```powershell
Get-ScheduledTask -TaskName "게시판알림_*"
```

5개의 작업이 표시되어야 합니다 (09:10, 11:00, 13:30, 15:00, 17:00).

### 수동 작업 실행 테스트

```powershell
Start-ScheduledTask -TaskName "게시판알림_09:10"
```

작업 실행 후 Google Chat에 알림이 도착하는지 확인합니다.

## 📊 로그 확인

작업 스케줄러에서 실행 기록 확인:

1. Win + R → `taskschd.msc` 입력
2. "작업 스케줄러 라이브러리" 클릭
3. "게시판알림_" 작업들 확인
4. 작업 선택 → 하단 "기록" 탭에서 실행 결과 확인

## 💡 팁

### 알림 테스트를 위해 임시로 초기화

```bash
del last_checked.json
python check_board.py
```

이렇게 하면 모든 게시글을 "새 글"로 인식하여 알림이 전송됩니다.

### 게시판에 실제로 글을 작성하여 테스트

1. 게시판에 테스트 글 작성
2. 5분 정도 대기
3. 수동으로 `python check_board.py` 실행
4. Google Chat에 알림이 도착하는지 확인

### 다른 시간에 테스트하고 싶은 경우

`config.json`의 `check_times`를 임시로 수정:

```json
{
  ...
  "check_times": ["14:50", "15:00"],
  ...
}
```

그 후 `setup_scheduler.ps1`을 다시 실행합니다.

## 📞 추가 지원

문제가 지속되면 다음 정보를 포함하여 문의하세요:

1. 오류 메시지 전체 복사
2. `python check_board.py` 실행 결과
3. `config.json` 내용 (Webhook URL은 마스킹)
4. Python 버전: `python --version`
