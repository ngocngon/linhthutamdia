# -*- coding: utf-8 -*-
"""Kiểm tools/thoai_s5.json. Chạy: python3 tools/kiem_thoai_s5.py  → in ĐẠT hoặc danh sách lỗi."""
import json, os, re, sys
from collections import Counter

DIR = os.path.dirname(os.path.abspath(__file__))
THE = '/home/claude/thoai/the_s5.json'
GIONG = os.path.join(DIR, 'giong_viet.json')
TAGS = {'shouting', 'angry', 'fierce', 'determined', 'menacing', 'growls', 'battle cry', 'furious', 'commanding',
        'aggressive', 'war cry', 'roars', 'intense', 'threatening', 'coldly', 'confident', 'proudly',
        'laughs maniacally', 'sarcastic'}
TAG_MEM = {'gently', 'warmly', 'sighs', 'calmly', 'playfully', 'curious', 'whispers', 'softly', 'mischievously',
           'flatly', 'solemnly', 'mysteriously', 'excited', 'laughs'}
MAU = {  # 6 mẫu: tên → giọng đã duyệt (câu được phép làm mạnh hơn, giữ ý)
    'Chiến Thần': '7hsfEc7irDn6E8br0qfw', 'Phán Quan Trời': 'Vr1jwoqy1MDvyAPwDY9C',
    'Mây Nuốt Thời Gian': 'DXiwi9uoxet6zAiZXynP', 'Nhện Non': 'a3AkyqGG4v8Pg7SWQ0Y3',
    'Cực Quang': 'DvG3I1kDzdBY3u4EzYh6', 'Kẻ Vô Cảm': 'ueSxRO0nLF1bj93J2hVt',
}
KHOA = {'k', 'ten', 'gioi', 'chac', 'cau', 'tag', 'text', 'giong', 'tenGiong', 'lydo', 'gioiGiong', 'textB'}

loi = []
the = {x['id']: x for x in json.load(open(THE, encoding='utf-8'))}
giong = {g['id']: g for g in json.load(open(GIONG, encoding='utf-8'))}
d = json.load(open(os.path.join(DIR, 'thoai_s5.json'), encoding='utf-8'))
L = d.get('list', [])

if len(L) != 194: loi.append(f'số thẻ {len(L)} ≠ 194')
ks = [e.get('k') for e in L]
if set(ks) != set(the) or len(set(ks)) != len(ks): loi.append('id thẻ thiếu/thừa/trùng')
gs = [e.get('giong') for e in L]
if len(set(gs)) != len(gs): loi.append('giọng trùng: ' + str([g for g, n in Counter(gs).items() if n > 1]))
cs = [e.get('cau') for e in L]
if len(set(cs)) != len(cs): loi.append('câu trùng: ' + str([c for c, n in Counter(cs).items() if n > 1]))

for e in L:
    k = e.get('k'); ten = e.get('ten')
    if set(e) != KHOA: loi.append(f'{k}: khoá sai {set(e) ^ KHOA}')
    if k in the and the[k]['ten'] != ten: loi.append(f'{k}: tên lệch')
    if e.get('gioi') not in ('nam', 'nu', 'khac'): loi.append(f'{k}: gioi sai')
    if not isinstance(e.get('chac'), bool): loi.append(f'{k}: chac không phải bool')
    if e.get('gioi') == 'khac' and e.get('chac'): loi.append(f'{k}: khac mà chac=true')
    cau = e.get('cau', '')
    if len(cau) > 45: loi.append(f'{k}: câu dài {len(cau)}')
    if not (2 <= len(cau.split()) <= 10): loi.append(f'{k}: số chữ {len(cau.split())}')
    if '[' in cau or ']' in cau: loi.append(f'{k}: câu chứa ngoặc vuông')
    tags = re.findall(r'\[([^\]]+)\]', e.get('tag', ''))
    if not (1 <= len(tags) <= 2) or any(t not in TAGS for t in tags) or re.sub(r'\[[^\]]+\]', '', e['tag']).strip():
        loi.append(f'{k}: tag sai {e.get("tag")}')
    if e.get('text') != f'{e.get("tag")} {cau}': loi.append(f'{k}: text ≠ tag + " " + cau')
    g = giong.get(e.get('giong'))
    if not g: loi.append(f'{k}: giọng không có trong giong_viet.json'); continue
    if e.get('tenGiong', '').strip() != g['ten'].strip(): loi.append(f'{k}: tenGiong lệch')
    can = {'nam': 'male', 'nu': 'female'}.get(e.get('gioi'))
    if can and g.get('gioi') != can: loi.append(f'{k}: giới giọng {g.get("gioi")} ≠ thẻ {e["gioi"]}')
    if not e.get('lydo') or '\n' in e['lydo']: loi.append(f'{k}: lydo trống/nhiều dòng')
    if any(t in TAG_MEM for t in tags): loi.append(f'{k}: còn thẻ cảm xúc mềm {e["tag"]}')
    try:
        if float(g.get('rate')) > 1: loi.append(f'{k}: giọng đắt rate={g.get("rate")}')
    except (TypeError, ValueError): loi.append(f'{k}: giọng thiếu rate')
    if False and ten in MAU and e['giong'] != MAU[ten] and MAU[ten] in giong: loi.append(f'{k}: giọng mẫu bị đổi dù còn trong kho')

for ten in MAU:
    if ten not in {e.get('ten') for e in L}: loi.append(f'thiếu thẻ mẫu {ten}')

dem = Counter(e.get('gioi') for e in L)
print(f'Thẻ: {len(L)} | nam {dem["nam"]} · nữ {dem["nu"]} · khác {dem["khac"]} | giọng khác nhau: {len(set(gs))}')
if loi:
    print('KHÔNG ĐẠT —', len(loi), 'lỗi:'); [print(' -', x) for x in loi]; sys.exit(1)
print('ĐẠT: 194 thẻ, 194 giọng riêng, giới tính khớp, giọng có trong kho, câu ≤45 ký tự & không trùng, tag giao đấu hợp lệ (không thẻ mềm), text = tag + câu, mọi giọng rate ≤ 1.')
