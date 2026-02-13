#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
강동어울림복지관 게시판 Google Chat 알림 시스템
이용상담문의 게시판에 새 글이 올라오면 Google Chat으로 알림을 전송합니다.
"""

import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup


class BoardNotifier:
    """게시판 모니터링 및 알림 클래스"""
    
    def __init__(self, config_path: str = "config.json"):
        """
        초기화
        
        Args:
            config_path: 설정 파일 경로
        """
        self.config = self._load_config(config_path)
        self.board_url = self.config["board_url"]
        self.webhook_url = self.config["webhook_url"]
        self.last_checked_file = self.config["last_checked_file"]
        
    def _load_config(self, config_path: str) -> Dict:
        """설정 파일 로드 (환경변수 우선)"""
        config = {}
        
        # 1. Load from file
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except FileNotFoundError:
            print(f"[WARN] 설정 파일을 찾을 수 없습니다: {config_path}")
            # Continue if env vars are present
        except json.JSONDecodeError:
            print(f"[ERROR] 설정 파일 형식이 잘못되었습니다: {config_path}")
            sys.exit(1)
            
        # 2. Override with environment variables (for GitHub Actions)
        env_webhook = os.environ.get('WEBHOOK_URL')
        if env_webhook:
            config['webhook_url'] = env_webhook
            print("[INFO] 환경변수에서 Webhook URL을 로드했습니다.")
            
        env_board = os.environ.get('BOARD_URL')
        if env_board:
            config['board_url'] = env_board
            
        # Validate critical config
        if not config.get('board_url'):
            config['board_url'] = "https://gde.or.kr/counseling" # Default
            
        if not config.get('last_checked_file'):
            config['last_checked_file'] = "last_checked.json"
            
        return config
            
    def fetch_board_posts(self) -> List[Dict]:
        """
        게시판에서 게시글 목록을 가져옵니다.
        
        Returns:
            게시글 정보 리스트 [{"id": ..., "title": ..., "author": ..., "date": ...}, ...]
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(self.board_url, headers=headers, timeout=10)
            response.raise_for_status()
            response.encoding = 'utf-8'
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            posts = []
            
            # 게시판 테이블 또는 리스트에서 게시글 추출
            # URL에서 확인된 구조를 기반으로 파싱
            board_items = soup.select('a[href*="wr_id="]')
            
            for item in board_items:
                href = item.get('href', '')
                
                # wr_id 추출 (게시글 고유 ID)
                if 'wr_id=' in href:
                    try:
                        wr_id = href.split('wr_id=')[1].split('&')[0]
                        
                        # 공지글 제외
                        if wr_id == '6':  # 공지글 ID
                            continue
                        
                        title = item.get_text(strip=True)
                        
                        # 상위 요소(div.bo_tit) 찾기
                        # ul.bo_tit_ul2 -> div.bo_tit
                        parent_ul = item.find_parent('ul')
                        grandparent_div = parent_ul.find_parent('div')
                        
                        author = "정보 없음"
                        date = "정보 없음"
                        
                        if grandparent_div:
                            info_ul = grandparent_div.find('ul', class_='bo_tit_ul3')
                            if info_ul:
                                # 작성자
                                author_li = info_ul.find('li', class_='name')
                                if author_li:
                                    author = author_li.get_text(strip=True)
                                
                                # 날짜 (li.date 혹은 순서로 찾기)
                                date_li = info_ul.find('li', class_='date')
                                if date_li:
                                    # 아이콘 텍스트 제외하고 날짜만 추출
                                    date = date_li.get_text(strip=True)
                        
                        post_info = {
                            "id": wr_id,
                            "title": title,
                            "url": f"https://gde.or.kr{href}" if href.startswith('/') else href,
                            "author": author,
                            "date": date
                        }
                        
                        posts.append(post_info)
                        
                    except IndexError:
                        continue
            
            # 중복 제거 (같은 ID)
            unique_posts = {post['id']: post for post in posts}
            posts = list(unique_posts.values())
            
            print(f"[INFO] {len(posts)}개의 게시글을 찾았습니다.")
            return posts
            
        except requests.RequestException as e:
            print(f"[ERROR] 게시판 접속 실패: {e}")
            return []
        except Exception as e:
            print(f"[ERROR] 게시글 파싱 오류: {e}")
            return []
    
    def load_last_checked(self) -> Dict:
        """마지막 확인 상태 로드"""
        if not os.path.exists(self.last_checked_file):
            return {"last_post_ids": [], "last_check_time": None}
        
        try:
            with open(self.last_checked_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"last_post_ids": [], "last_check_time": None}
    
    def save_last_checked(self, post_ids: List[str]):
        """마지막 확인 상태 저장"""
        data = {
            "last_post_ids": post_ids,
            "last_check_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        with open(self.last_checked_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def find_new_posts(self, current_posts: List[Dict]) -> List[Dict]:
        """
        새로운 게시글 찾기
        
        Args:
            current_posts: 현재 게시판의 게시글 목록
            
        Returns:
            새로운 게시글 목록
        """
        last_checked = self.load_last_checked()
        last_post_ids = set(last_checked.get("last_post_ids", []))
        
        current_post_ids = {post['id'] for post in current_posts}
        new_post_ids = current_post_ids - last_post_ids
        
        new_posts = [post for post in current_posts if post['id'] in new_post_ids]
        
        print(f"[NEW] {len(new_posts)}개의 새 게시글을 발견했습니다.")
        return new_posts
    
    def send_google_chat_notification(self, posts: List[Dict]):
        """
        Google Chat으로 알림 전송
        
        Args:
            posts: 알림 보낼 게시글 목록
        """
        if not posts:
            print("[INFO] 새 게시글이 없습니다.")
            return
        
        # Webhook URL 검증
        if self.webhook_url == "YOUR_GOOGLE_CHAT_WEBHOOK_URL_HERE":
            print("[ERROR] Google Chat Webhook URL을 설정해주세요!")
            print("config.json 파일의 webhook_url을 수정하세요.")
            return
        
        for post in posts:
            message = self._create_message(post)
            
            try:
                response = requests.post(
                    self.webhook_url,
                    json=message,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"[SUCCESS] 알림 전송 성공: {post['title']}")
                else:
                    print(f"[ERROR] 알림 전송 실패 (상태 코드: {response.status_code}): {post['title']}")
                    
            except requests.RequestException as e:
                print(f"[ERROR] Google Chat 알림 전송 오류: {e}")
    
    def _create_message(self, post: Dict) -> Dict:
        """Google Chat 메시지 생성"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        message = {
            "text": f"🔔 *새 게시글 알림*",
            "cards": [{
                "header": {
                    "title": "이용상담문의 게시판",
                    "subtitle": "강동어울림복지관"
                },
                "sections": [{
                    "widgets": [
                        {
                            "keyValue": {
                                "topLabel": "제목",
                                "content": post['title'],
                                "contentMultiline": True
                            }
                        },
                        {
                            "keyValue": {
                                "topLabel": "작성자",
                                "content": post.get('author', '정보 없음')
                            }
                        },
                        {
                            "keyValue": {
                                "topLabel": "작성일",
                                "content": post.get('date', '정보 없음')
                            }
                        },
                        {
                            "keyValue": {
                                "topLabel": "확인 시간",
                                "content": current_time
                            }
                        },
                        {
                            "buttons": [{
                                "textButton": {
                                    "text": "게시글 확인하기",
                                    "onClick": {
                                        "openLink": {
                                            "url": post['url']
                                        }
                                    }
                                }
                            }]
                        }
                    ]
                }]
            }]
        }
        
        return message
    
    def run(self):
        """메인 실행 함수"""
        print("=" * 60)
        print(f"[INFO] 게시판 모니터링 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[INFO] 게시판 URL: {self.board_url}")
        print("=" * 60)
        
        # 1. 게시판에서 게시글 가져오기
        current_posts = self.fetch_board_posts()
        
        if not current_posts:
            print("[WARN] 게시글을 가져오지 못했습니다.")
            return
        
        # 2. 새 게시글 찾기
        new_posts = self.find_new_posts(current_posts)
        
        # 3. 새 게시글이 있으면 알림 전송
        if new_posts:
            self.send_google_chat_notification(new_posts)
        
        # 4. 확인 상태 저장
        current_post_ids = [post['id'] for post in current_posts]
        self.save_last_checked(current_post_ids)
        
        print("=" * 60)
        print(f"[OK] 모니터링 완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)


def main():
    """메인 함수"""
    # 스크립트 디렉토리로 작업 디렉토리 변경
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # 알림 시스템 실행
    notifier = BoardNotifier()
    notifier.run()


if __name__ == "__main__":
    main()
