import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import re
import time
from playwright.sync_api import sync_playwright, Page, TimeoutError
import os

# =========================================================
# УСТАНОВКА КОДИРОВКИ ДЛЯ WINDOWS
# =========================================================
try:
    if sys.platform.startswith('win'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# =========================================================
# ЛОГИРОВАНИЕ
# =========================================================

def log_error(message: str):
    sys.stderr.write(f"[PARSER ERROR] {message}\n")
    sys.stderr.flush()

def log_info(message: str):
    sys.stderr.write(f"[PARSER INFO] {message}\n")
    sys.stderr.flush()

# =========================================================
# ДАТЫ ДЛЯ ПАРСИНГА
# =========================================================

def get_target_dates() -> List[str]:
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)

    # Если сегодня понедельник (0), берем Пятницу, Субботу, Воскресенье
    if today.weekday() == 0:
        target_dates = [
            (today - timedelta(days=1)).strftime('%d.%m.%Y'),
            (today - timedelta(days=2)).strftime('%d.%m.%Y'),
            (today - timedelta(days=3)).strftime('%d.%m.%Y'),
            today.strftime('%d.%m.%Y') # Добавляем и сегодняшний день на всякий случай
        ]
    else:
        # В обычные дни берем вчера и сегодня
        target_dates = [yesterday.strftime('%d.%m.%Y'), today.strftime('%d.%m.%Y')]

    log_info(f"Целевые даты для парсинга: {target_dates}")
    return target_dates

# =========================================================
# КЭШ
# =========================================================

def save_events_to_cache(events: List[Dict[str, Any]], filename: str = 'events_cache.json'):
    file_path = os.path.join(os.getcwd(), filename)
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=4)
        log_info(f"Кэш событий сохранен: {file_path}. Количество: {len(events)}")
    except Exception as e:
        log_error(f"Ошибка сохранения кэша: {e}")

# =========================================================
# METAL-TRADE (ИСПРАВЛЕННЫЙ СЕКЦИЯ)
# =========================================================

def parse_metal_trade(page: Page, target_dates: List[str]) -> List[Dict[str, Any]]:
    all_events = []
    base_url = "https://www.metal-trade.ru/buy/"
    page_offset = 0
    target_date_set = set(target_dates)

    MAX_OFFSET = 150 # Примерно 5 страниц
    PAGE_SIZE = 30

    log_info("--- MetalTrade: Начало парсинга ---")

    while page_offset <= MAX_OFFSET:
        url = f"{base_url}?curPos={page_offset}" if page_offset > 0 else base_url
        log_info(f"MetalTrade: Переход на {url}")

        try:
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('table.tradetable', timeout=15000)

            # Берем все строки основной таблицы
            rows = page.locator('table.tradetable tr').all()
            
            if not rows:
                log_info("MetalTrade: Строки в таблице не найдены.")
                break

            found_on_page = 0

            for row in rows:
                content = row.inner_text()
                
                # Ищем дату и время регуляркой (напр. 15.12.2025 14:36)
                date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})', content)
                if not date_match:
                    continue

                event_date = date_match.group(1)
                event_time = date_match.group(2)

                # Пропускаем, если дата не совпадает с нашими целями
                if event_date not in target_date_set:
                    continue

                # Название товара (обычно жирным или в ссылке h3size)
                product_loc = row.locator('div.h3size a, b a, td:first-child b').first
                if product_loc.count() > 0:
                    product = product_loc.inner_text().strip().replace('\xa0', ' ')
                else:
                    # Запасной вариант - первая ячейка
                    product = row.locator('td').first.inner_text().split('\n')[0].strip()

                # Компания (ссылка с классом link)
                company_loc = row.locator('a.link').first
                company = company_loc.inner_text().strip() if company_loc.count() > 0 else "Не указана"

                # Регион (последняя строка в ячейке с компанией/датой)
                try:
                    # Берем текстовое содержимое ячеек и очищаем от пустых строк
                    lines = [line.strip() for line in content.split('\n') if line.strip()]
                    region = lines[-1] if lines else "Не указан"
                except:
                    region = "Не указан"

                all_events.append({
                    'id': 0,
                    'product': product,
                    'company': company,
                    'region': region,
                    'volume': product,
                    'event_date': f"{event_date} {event_time}",
                    'status': 'potential',
                    'confidence': 70,
                    'source': base_url
                })
                found_on_page += 1

            log_info(f"MetalTrade: Добавлено {found_on_page} заявок.")
            
            # Если мы на странице ничего не нашли, а офсет уже большой - выходим
            if found_on_page == 0 and page_offset > 0:
                log_info("MetalTrade: Заявки за выбранные даты закончились.")
                break

            page_offset += PAGE_SIZE
            time.sleep(1.5)

        except Exception as e:
            log_error(f"MetalTrade ошибка: {e}")
            break

    return all_events

# =========================================================
# METAL-INFO
# =========================================================

def parse_metal_info_board(page: Page, target_dates: List[str]) -> List[Dict[str, Any]]:
    all_events = []
    base_url = "https://www.metalinfo.ru/ru/board"

    month_ru = {
        1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
        5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
        9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря'
    }

    target_patterns = []
    for d in target_dates:
        dt = datetime.strptime(d, '%d.%m.%Y')
        target_patterns.append((f"{dt.day} {month_ru[dt.month]}", d))

    current_target_date = None

    log_info("--- MetalInfo: Начало парсинга ---")

    for page_num in range(1, 6):
        try:
            page.goto(f"{base_url}?category=b&page={page_num}", wait_until='domcontentloaded', timeout=20000)
            page.wait_for_selector('#bulletinList > li', timeout=10000)

            items = page.locator('#bulletinList > li').all()

            for i, item in enumerate(items):
                cls = item.get_attribute('class') or ""

                if 'row date' in cls:
                    date_text = item.inner_text()
                    current_target_date = None
                    for pattern, date_str in target_patterns:
                        if pattern in date_text:
                            current_target_date = date_str
                            break

                elif 'row bulletin' in cls and current_target_date:
                    product = item.locator('span.title a').inner_text().strip()
                    company = item.locator('span.company').inner_text().strip()
                    region = item.locator('span.region').inner_text().strip()
                    event_time = item.locator('span.time').inner_text().strip()

                    volume = "Не указано"
                    if i + 1 < len(items) and 'description' in (items[i + 1].get_attribute('class') or ''):
                        volume = items[i + 1].inner_text().strip()

                    all_events.append({
                        'id': 0,
                        'product': product,
                        'company': company,
                        'region': region,
                        'volume': volume,
                        'event_date': f"{current_target_date} {event_time}",
                        'status': 'potential',
                        'confidence': 55,
                        'source': base_url
                    })

            time.sleep(1)

        except Exception as e:
            log_error(f"MetalInfo ошибка: {e}")
            break

    return all_events

# =========================================================
# СБОР
# =========================================================

def collect_all_applications() -> List[Dict[str, Any]]:
    log_info("--- НАЧАЛО СБОРА (Playwright) ---")
    target_dates = get_target_dates()
    all_events: List[Dict[str, Any]] = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.set_extra_http_headers({
                'Accept-Language': 'ru-RU,ru;q=0.9'
            })

            all_events.extend(parse_metal_trade(page, target_dates))
            all_events.extend(parse_metal_info_board(page, target_dates))

            browser.close()

    except Exception as e:
        log_error(f"Критическая ошибка Playwright: {e}")

    log_info(f"Всего до дедупликации: {len(all_events)}")

    final_events = []
    seen = set()

    for event in all_events:
        # Уникальный ключ для удаления дублей
        key = f"{event['product']}-{event['volume']}-{event['event_date']}-{event['company']}"
        h = hash(key)
        if h not in seen:
            event['id'] = abs(h)
            final_events.append(event)
            seen.add(h)

    log_info(f"Всего после дедупликации: {len(final_events)}")
    return final_events

# =========================================================
# ENTRYPOINT
# =========================================================

if __name__ == '__main__':
    log_info("Скрипт Python запущен.")
    events = collect_all_applications()
    save_events_to_cache(events)
    log_info("Скрипт Python завершен.")
    # Финальный вывод JSON для Node.js
    print(json.dumps(events, ensure_ascii=False))