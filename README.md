# Travel-Log


# セットアップ
## Python
```sh
rye sync
```

## HEIC対応のための設定
```sh
brew install x265 libheif
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
rye sync
```

# データの作り方
## 画像データ
`images`ディレクトリに画像を保存してください。位置情報以外のメタ情報やファイルサイズが気になる方は一度`original_images`ディレクトリに保存してから以下のコマンドでPythonスクリプトを実行してください。位置情報以外のメタデータを削除し、ファイルサイズを小さくします。
```sh
rye run prepaer_photo.py
```

## テキストデータ
以下の例に従って、自前の`docs/example.json`を作成してください。

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