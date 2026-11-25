import json,sys
f=sys.argv[1]
m=json.load(open('tools/fx_atlas_mau.json'));d=json.load(open('www/img/fx/fx.json'))
have={t['f'] for t in d['tam']}
for t in m['tam']:
    if t['f']==f and f not in have: d['tam'].append(t)
json.dump(d,open('www/img/fx/fx.json','w'),ensure_ascii=False,separators=(',',':'));print(len(d['tam']))
