from datetime import datetime
from check_board import BoardNotifier

def test_today_posts():
    notifier = BoardNotifier()
    print("게시글 가져오는 중...")
    posts = notifier.fetch_board_posts()
    
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"오늘 날짜: {today}")
    
    today_posts = [p for p in posts if p.get('date') == today]
    
    if today_posts:
        print(f"오늘 작성된 게시글 {len(today_posts)}개를 찾았습니다.")
        notifier.send_google_chat_notification(today_posts)
    else:
        print("오늘 작성된 게시글이 없습니다.")

if __name__ == "__main__":
    test_today_posts()
