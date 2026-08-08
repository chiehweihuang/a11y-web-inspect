# A+ scoring fix — 40-site wild-corpus movement

Engine `beacon-static-audit@16` (old, thin evidence excluded from scoring) -> `beacon-static-audit@17` (new, thin evidence scores with a `thin: true` flag). Same 40 real captured snapshots, same finding keys (verified byte-identical by `node --test`); only `overall_score`/`coverage_percent` move.

Summary: 38/40 sites moved, median |delta| 7, max |delta| 58.

| id | url | old | new | delta | newly-scored categories (pass/fail) |
|---|---|---|---|---|---|
| 100020 | https://a-mo.net | 0 | 0 | 0 | responsive 0/1=0 |
| 100116 | https://debian.org | 74 | 81 | +7 | responsive 1/0=100 |
| 100136 | https://googleadservices.com | 34 | 56 | +22 | responsive 1/0=100 |
| 100320 | https://epa.gov | 97 | 90 | -7 | responsive 1/0=100, motion 0/1=0 |
| 100322 | https://cnet.com | 72 | 84 | +12 | forms 1/0=100, responsive 1/0=100, motion 1/0=100 |
| 100356 | https://paloaltonetworks.com | 92 | 94 | +2 | responsive 1/0=100, motion 1/0=100 |
| 100461 | https://sina.com.cn | 7 | 12 | +5 | forms 1/1=38, responsive 0/1=0, motion 0/1=0 |
| 100515 | https://scribd.com | 100 | 92 | -8 | forms 2/0=100, responsive 1/0=100, motion 0/1=0 |
| 100652 | https://hbr.org | 78 | 80 | +2 | forms 1/0=100, responsive 1/0=100, motion 0/1=0 |
| 100671 | https://flashtalking.com | 60 | 70 | +10 | forms 1/0=100, responsive 1/0=100, motion 0/1=0 |
| 100675 | https://livejournal.com | 28 | 39 | +11 | responsive 1/0=100, motion 0/1=0 |
| 100683 | https://bild.de | 75 | 85 | +10 | forms 1/0=100, responsive 1/0=100 |
| 100728 | https://discord.media | 27 | 65 | +38 | keyboard 1/0=100, responsive 1/0=100 |
| 100759 | https://un.org | 63 | 72 | +9 | responsive 1/0=100 |
| 100851 | https://baidu.com | 15 | 45 | +30 | keyboard 1/0=100, forms 2/0=100, responsive 0/1=0, motion 0/1=0 |
| 100900 | https://qq.com | 24 | 31 | +7 | forms 0/1=0, responsive 1/0=100, motion 0/1=0 |
| 101069 | https://hwg.org | 13 | 8 | -5 | responsive 0/1=0 |
| 101082 | https://nishinippon.co.jp | 73 | 78 | +5 | forms 1/0=100, responsive 1/0=100, motion 0/1=0 |
| 101337 | https://dns.com | 11 | 16 | +5 | responsive 1/1=45, motion 0/1=0 |
| 101380 | https://cuni.cz | 0 | 58 | +58 | keyboard 2/0=100, forms 2/0=100, responsive 1/0=100, motion 0/1=0 |
| 101475 | https://transip.eu | 88 | 82 | -6 | responsive 1/0=100, motion 0/1=0 |
| 101512 | https://vietnamnet.vn | 7 | 23 | +16 | responsive 1/0=100, motion 0/1=0 |
| 101538 | https://digi24.ro | 54 | 57 | +3 | forms 1/0=100, responsive 1/1=45, motion 0/1=0 |
| 101550 | https://minhngoc.net.vn | 40 | 22 | -18 | keyboard 0/2=0, responsive 0/1=0, motion 0/1=0 |
| 101559 | https://bhg.com | 2 | 2 | 0 | responsive 0/1=0 |
| 101676 | https://larazon.es | 72 | 71 | -1 | responsive 1/0=100, motion 0/1=0 |
| 101804 | https://gotomeeting.com | 95 | 89 | -6 | responsive 1/0=100, motion 0/1=0 |
| 101895 | https://facebook-hardware.com | 37 | 24 | -13 | responsive 0/1=0 |
| 102099 | https://meb.gov.tr | 18 | 21 | +3 | responsive 1/1=45, motion 0/1=0 |
| 102117 | https://anker-in.com | 56 | 60 | +4 | responsive 1/0=100, motion 0/1=0 |
| 102163 | https://hentaila.tv | 51 | 57 | +6 | responsive 1/0=100, motion 0/1=0 |
| 102195 | https://wpzoom.com | 82 | 79 | -3 | responsive 1/0=100, motion 0/1=0 |
| 102300 | https://mp4moviez.bot | 85 | 93 | +8 | forms 1/0=100, responsive 1/0=100 |
| 102328 | https://lazada.sg | 45 | 25 | -20 | keyboard 0/2=0, responsive 0/1=0, motion 0/1=0 |
| 102403 | https://xv-ru.com | 19 | 29 | +10 | forms 0/2=0, responsive 1/0=100, motion 0/1=0 |
| 102559 | https://pavietnam.vn | 14 | 45 | +31 | forms 2/0=100, responsive 1/0=100, motion 0/1=0 |
| 102579 | https://sexlog.com | 95 | 75 | -20 | responsive 1/1=45, motion 0/1=0 |
| 102741 | https://vu.edu.pk | 39 | 59 | +20 | forms 2/0=100, responsive 1/0=100, motion 0/1=0 |
| 102980 | https://yesstyle.com | 43 | 50 | +7 | responsive 1/0=100, motion 0/1=0 |
| 102985 | https://lexmark.com | 89 | 86 | -3 | forms 1/0=100, responsive 1/0=100, motion 0/1=0 |
