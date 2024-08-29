# ■ 入力: 写真（original_imagesに保存されている）
# ■ 出力: 写真（imagesに保存されている）とHTMLに埋め込むためのタグ（html_tags.txt）
# ■ 処理:
# 1. 位置情報以外のメタデータを削除
# 2. 画像サイズを小さくする
# 3. 画像の保存
# 4. HTMLに埋め込むためのタグを生成

import os
from pathlib import Path

import piexif
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()


def process_images(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    html_tag_list = []

    for filename in os.listdir(input_dir):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".heic")):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(
                output_dir, os.path.splitext(filename)[0] + ".jpg"
            )

            with Image.open(input_path) as img:
                # メタデータを削除（位置情報は保持）
                exif_dict = piexif.load(img.info.get("exif", b""))
                gps_data = exif_dict.pop("GPS", None)
                new_exif = {"GPS": gps_data} if gps_data else {}
                exif_bytes = piexif.dump(new_exif)

                # 画像サイズを小さくする
                width, height = img.size
                if width > 4000:
                    new_size = (width // 2, height // 2)
                elif width > 3000:
                    new_size = (int(width / 1.5), int(height / 1.5))
                else:
                    new_size = (width, height)
                resized_img = img.resize(new_size, Image.LANCZOS)

                # JPGとして保存
                resized_img.convert("RGB").save(output_path, "JPEG", exif=exif_bytes)
                filename = Path(output_path).stem
                html_tag = f'<img id="{filename}" src="images/{filename}.jpg" style="width: 1px; height: 1px; position: absolute; top: -1000px;">'
                html_tag_list.append(html_tag)

    html_tag_list = sorted(html_tag_list)
    # テキストファイルとして保存
    with open("html_tags.txt", "w") as file:
        file.write("\n".join(html_tag_list))


process_images("original_images", "images")
