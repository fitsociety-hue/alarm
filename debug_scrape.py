import requests
from bs4 import BeautifulSoup

url = "https://gde.or.kr/counseling"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

response = requests.get(url, headers=headers)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'lxml')

items = soup.select('a[href*="wr_id="]')
for item in items[:1]:
    # Print the link and its parent structure
    print(f"Link: {item}")
    parent = item.find_parent()
    print(f"Parent: {parent.name}")
    grandparent = parent.find_parent()
    print(f"Grandparent: {grandparent.name}")
    print(f"Grandparent HTML: {grandparent.prettify()}")
