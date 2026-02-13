# 🚀 빠른 시작 가이드

강동어울림복지관 게시판 → Google Chat 자동 알림 시스템

## ⚡ 5단계로 시작하기

### 1️⃣ Google Chat Webhook URL 생성

1. **Google Chat 접속**: <https://chat.google.com>
2. **스페이스 만들기**: 왼쪽 상단 "+" → "스페이스 만들기"
3. **이름 입력**: "게시판 알림" (원하는 이름)
4. **Webhook 추가**:
   - 스페이스 이름 옆 ▼ 클릭
   - "Apps & integrations" → "Webhooks"
   - "+ Add webhook" 클릭
   - 이름: "게시판 알림봇"
   - "Save" 클릭
5. **URL 복사**: 생성된 Webhook URL 복사 (<https://chat.googleapis.com/v1/spaces/>... 형태)

### 2️⃣ 설정 파일 수정

`config.json` 파일을 열고 Webhook URL 붙여넣기:

```json
{
  "board_url": "https://gde.or.kr/counseling",
  "webhook_url": "여기에_복사한_URL_붙여넣기",
  "check_times": ["09:10", "11:00", "13:30", "15:00", "17:00"],
  "last_checked_file": "last_checked.json",
  "notification_recipient": "alias1004@gde.or.kr"
}
```

### 3️⃣ 테스트 실행

PowerShell 또는 명령 프롬프트에서:

```bash
cd C:\Users\user\.gemini\antigravity\scratch\antigravity_skills\board-notification-gchat
python check_board.py
```

✅ **성공 시**: Google Chat 스페이스에 알림 메시지 도착!

### 4️⃣ 자동 실행 설정

PowerShell을 **관리자 권한으로** 실행:

```powershell
cd C:\Users\user\.gemini\antigravity\scratch\antigravity_skills\board-notification-gchat
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup_scheduler.ps1
```

### 5️⃣ 완료! 🎉

이제 매일 자동으로 다음 시간에 게시판을 확인합니다:

- 09:10
- 11:00
- 13:30
- 15:00
- 17:00

---

## 📋 작동 확인

### 작업 스케줄러 확인

```powershell
Get-ScheduledTask -TaskName "게시판알림_*"
```

5개의 작업이 표시되어야 합니다.

### 수동 실행 테스트

```powershell
Start-ScheduledTask -TaskName "게시판알림_09:10"
```

---

## ❓ 문제 해결

### ❌ "Python이 설치되어 있지 않습니다"

Python 설치: <https://www.python.org/downloads/>

### ❌ "Google Chat Webhook URL을 설정해주세요"

`config.json` 파일에서 `webhook_url` 값을 실제 URL로 변경했는지 확인

### ❌ "게시판 접속 실패"

- 인터넷 연결 확인
- 방화벽 설정 확인

### ⚠️ 알림이 오지 않는 경우

1. 수동으로 `python check_board.py` 실행하여 오류 메시지 확인
2. Google Chat Webhook URL이 올바른지 확인
3. Windows 작업 스케줄러에서 작업 실행 기록 확인

---

## 📚 상세 문서

- **README.md**: 전체 프로젝트 설명
- **TESTING.md**: 자세한 테스트 및 문제 해결 가이드

---

## 🔔 알림 예시

Google Chat에 다음과 같은 카드 메시지가 전송됩니다:

```
🔔 새 게시글 알림

이용상담문의 게시판
강동어울림복지관

제목: 이용문의
작성자: 당당나라
작성일: 2026-02-11
확인 시간: 2026-02-13 15:00:05

[게시글 확인하기] 버튼
```

---

## 📞 지원

**강동어울림복지관**

- 전화: 02-478-0741
- 이메일: <gds0741@naver.com>
- 주소: 서울특별시 강동구 올림픽로 741

---

**Enjoy! 🎉**
