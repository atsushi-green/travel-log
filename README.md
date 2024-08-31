# Travel-Log
<p align="center">
  <img src="assets/travel-log.png"/>
</p>

旅行の計画を立てる際、Google Maps を開きながらどこに行こうかなあ、と考えたことはありませんか？ Goole Maps を使えば興味深いスポットを見つけることはできますが、Travel-Logでは [@redtea](https://twitter.com/Syuiro_2) が訪れた場所を写真付きでごく簡単に紹介します。旅行の行き先探しではWEB検索も使いますが、土地勘のない地域では距離感覚が全然わからなかったり、有名なスポットしか情報が得にくいです。そんな時に、Travel-Logを参考にしていただければと思います。

是非、「XX県の方に旅行にいくことになったけど、空き時間にどこにいこう」と悩んだ時にお役立てください。

本リポジトリでは、「自分だけのTravel-Log」を作成するための手順とソースコードを公開しています。

# セットアップ
## For Mac OS
### Python
```sh
rye sync
```

### HEIC対応のための設定
```sh
brew install x265 libheif
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
rye sync
```

### 顔のモザイク処理のための設定
```sh
brew install cmake
```
## For Windows
TBD...


# データの作り方
## 画像データ
`images`ディレクトリに画像を保存してください。位置情報以外のメタ情報やファイルサイズが気になる方は一度`original_images`ディレクトリに保存してから以下のコマンドでPythonスクリプトを実行してください。位置情報以外のメタデータを削除し、ファイルサイズを小さくします。
```sh
rye run prepaer_photo.py
```

## テキストデータ
以下の例に従って、自前の`docs/example.json`を作成してください。説明文の改行には`<br>`を使用してください。

```json
{
    "13_01_東京タワー": {
        "title": "東京タワー",
        "date": "2019-12-23",
        "image_name": "13_01_東京タワー.jpg",
        "description": "ライトアップが綺麗。<br>展望台には底がガラス張りのスペースがあり、足元が見える。",
        "tags": [
            "観光地"
        ],
        "url": "https://www.tokyotower.co.jp/"
    },    
    "26_01_下鴨神社": {
        "title": "下鴨神社",
        "date": "2022-11-18",
        "image_name": "26_01_下鴨神社.jpg",
        "description": "秋の紅葉が美しい。",
        "tags": [
            "観光地"
        ],
        "url": "https://www.shimogamo-jinja.or.jp/"
    }
}
```