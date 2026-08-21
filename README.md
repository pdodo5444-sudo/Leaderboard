# Siyu伺服器的時間排行榜

Siyu server's Leaderboard — GitHub Pages 靜態排行榜網站。

## 檔案

- `index.html`：網站頁面
- `style.css`：網站外觀
- `app.js`：地圖、賽事、級別篩選與 CSV 排序
- `leaderboard.csv`：所有成績的單一資料來源
- `assets/`：地圖與賽事示意圖

## CSV 格式

每一筆成績一行：

```csv
track,event,class,player,time,car,date
Mt.Otsuki,Otsuki Death Trial,T1,PlayerName,1:52.411,FD3S,2026-08-21
```

必填：
- `track`
- `event`
- `class`：T1 / T2 / T3 / T4
- `player`
- `time`

選填：
- `car`
- `date`

時間可以使用 `1:52.411` 或 `52.411`。網站會自動依時間由快到慢排序；DNF / DSQ / DNS 會排在最後。

## GitHub Pages

1. 把整個資料夾內容上傳到 GitHub repository。
2. `index.html`、`style.css`、`app.js`、`leaderboard.csv` 必須放在同一層。
3. 到 repository 的 **Settings → Pages**。
4. Source 選 **Deploy from a branch**。
5. 選你的 branch（通常是 `main`）與 `/ (root)`。
6. 儲存後等待 GitHub Pages 部署完成。
7. 之後只要更新 `leaderboard.csv` 並 push，排行榜就會讀取最新資料。

## 賽道與賽事順序

- Mt.Otsuki
  - Otsuki Death Trial
  - Uphill Battle
  - Downhill Battle
- Ichikawa
  - Goliath's Marathon
  - Ichikawa Taikyu Stage
- Shuto Expressway
  - Clockwise Loop
  - Counter Clockwise Loop
- Tokyo Bay Area
  - Fujigawa Cannon Run
  - Midnight Marathon
- Tsukuba Circuit
  - Laptime
- Shirosato Racing Center
  - Shirosato Trial
  - Shirosato touge uphill
  - Shirosato touge downhill
