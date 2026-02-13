# 강동어울림복지관 게시판 Google Chat 알림 시스템

강동어울림복지관 '이용상담문의 게시판'에 새로운 글이 올라오면 Google Chat으로 자동 알림을 보내는 시스템입니다.

## 📋 기능

- 게시판 새 글 자동 모니터링
- Google Chat Webhook을 통한 알림 전송
- 하루 5회 정해진 시간에 자동 실행 (09:10, 11:00, 13:30, 15:00, 17:00)
- 이미 확인한 글 추적 (중복 알림 방지)

## 🔧 설치 방법

### 1. Python 패키지 설치

```bash
pip install -r requirements.txt
```

### 2. Google Chat Webhook URL 설정

1. Google Chat에서 스페이스 생성 또는 기존 스페이스 선택
2. 스페이스 설정 > Apps & Integrations > Webhooks 클릭
3. "Add webhook" 클릭
4. Webhook 이름 입력 (예: "게시판 알림")
5. 생성된 Webhook URL 복사
6. `config.json` 파일의 `webhook_url`에 붙여넣기

### 3. 설정 파일 구성

`config.json` 파일을 편집하여 설정:

```json
{
  "board_url": "https://gde.or.kr/counseling",
  "webhook_url": "YOUR_GOOGLE_CHAT_WEBHOOK_URL_HERE",
  "check_times": ["09:10", "11:00", "13:30", "15:00", "17:00"],
  "last_checked_file": "last_checked.json"
}
```

## 🚀 사용 방법

### 수동 실행 (테스트용)

```bash
python check_board.py
```

### Windows Task Scheduler 자동 실행 설정 (간편)

포함된 `setup_scheduler.bat` 파일을 실행하면 자동으로 5개의 작업이 등록됩니다.

1. `setup_scheduler.bat` 파일을 더블 클릭하여 실행 (또는 우클릭 후 "관리자 권한으로 실행")
2. "Successfully registered" 메시지가 5번 나오면 성공!
3. 아무 키나 눌러 창 닫기

### 설정 확인

명령 프롬프트에서 다음 명령어로 등록된 작업을 확인할 수 있습니다:

```cmd
schtasks /Query /TN "BoardNotification_*"
```

또는 Windows 작업 스케줄러(`taskschd.msc`)를 열어 "BoardNotification_"으로 시작하는 작업들을 확인하세요.

## 📁 파일 구조

```
board-notification-gchat/
├── README.md              # 프로젝트 설명서
├── requirements.txt       # Python 패키지 의존성
├── config.json           # 설정 파일
├── check_board.py        # 메인 스크립트
├── setup_scheduler.ps1   # Windows 스케줄러 자동 설정 스크립트
└── last_checked.json     # 마지막 확인 상태 저장 (자동 생성)
```

## 🔍 작동 원리

1. 설정된 시간에 스크립트 자동 실행
2. 게시판 웹페이지 스크래핑
3. 새로운 글 감지 (이전 확인 시점과 비교)
4. 새 글 발견 시 Google Chat으로 알림 전송
5. 확인 상태 저장 (last_checked.json)

## ⚠️ 주의사항

- Python 3.7 이상 필요
- 인터넷 연결 필수
- Google Chat Webhook URL은 비공개로 관리
- Windows 작업 스케줄러는 컴퓨터가 켜져 있을 때만 작동

## 🛠️ 문제 해결

### 알림이 오지 않는 경우

1. `check_board.py` 수동 실행하여 에러 확인
2. Google Chat Webhook URL 정확성 확인
3. 인터넷 연결 상태 확인
4. Windows 작업 스케줄러에서 작업 실행 기록 확인

### 중복 알림이 오는 경우

- `last_checked.json` 파일 삭제 후 재실행

## 📞 문의

- 강동어울림복지관: 02-478-0741
- 이메일: <gds0741@naver.com>

## ☁️ 24/7 자동화 (GitHub Actions)

컴퓨터가 꺼져 있어도 알림을 받으려면 GitHub Actions를 사용하세요.

### 1단계: GitHub 저장소 설정

1. GitHub에 로그인하고 새 저장소를 만듭니다 (Public 또는 Private).
2. 이 폴더의 모든 파일을 해당 저장소에 업로드(Push)합니다.

### 2단계: Webhook URL 비밀 설정 (중요!)

1. 저장소의 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Secrets and variables** -> **Actions** 클릭
3. **New repository secret** 버튼 클릭
4. 정보 입력:
   - **Name**: `WEBHOOK_URL`
   - **Secret**: `config.json`에 있는 Webhook URL 전체 (<https://chat.googleapis.com>...)
5. **Add secret** 클릭

### 3단계: 작동 확인

1. **Actions** 탭 클릭
2. `Board Notification` 워크플로우가 보이는지 확인
3. 왼쪽 리스트에서 `Board Notification` 클릭 -> 오른쪽 `Run workflow` 버튼으로 수동 실행 테스트
4. 초록색 체크 표시(✅)가 뜨면 성공!

이제 설정된 시간(한국 시간 09:10, 11:00, 13:30, 15:00, 17:00)에 자동으로 실행됩니다.

> **참고**: GitHub Actions는 무료 계정에서도 매월 2,000분 무료 실행 시간을 제공하므로 이 스크립트를 돌리기에 충분합니다.
