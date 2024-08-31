# ■ 入力: 写真（original_imagesに保存されている）
# ■ 出力: 写真（imagesに保存されている）とHTMLに埋め込むためのタグ（html_tags.txt）
# ■ 処理:
# 1. 位置情報以外のメタデータを削除
# 2. 顔のモザイク処理
# 3. 画像サイズを小さくする
# 4. 画像の保存
# 5. HTMLに埋め込むためのタグを生成
import os
from pathlib import Path

import cv2
import face_recognition
import numpy as np
import piexif
from PIL import Image
from pillow_heif import register_heif_opener
from tqdm import tqdm

register_heif_opener()


def process_images(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    html_tag_list = []

    for filename in tqdm(os.listdir(input_dir), total=len(os.listdir(input_dir))):
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

                # 顔のモザイク処理
                img = add_mosaic_faces(img)

                # GitHubで写真をたくさん保存するために、画像サイズを小さくする
                width, height = img.size
                if width > 4000:
                    new_size = (width // 2, height // 2)
                elif width > 3000:
                    new_size = (int(width / 1.5), int(height / 1.5))
                else:
                    new_size = (width, height)
                resized_img = img.resize(new_size, Image.LANCZOS)

                # jpgとして保存
                resized_img.convert("RGB").save(output_path, "JPEG", exif=exif_bytes)
                filename = Path(output_path).stem

                # HTMLに埋め込むためのタグを生成
                html_tag = f'<img id="{filename}" src="images/{filename}.jpg" style="width: 1px; height: 1px; position: absolute; top: -1000px;">'
                html_tag_list.append(html_tag)

    html_tag_list = sorted(html_tag_list)
    # テキストファイルとして保存
    with open("html_tags.txt", "w") as file:
        file.write("\n".join(html_tag_list))


def pil2cv(image: Image) -> np.ndarray:
    """PIL型 -> OpenCV型"""
    new_image = np.array(image, dtype=np.uint8)
    if new_image.ndim == 2:  # モノクロ
        pass
    elif new_image.shape[2] == 3:  # カラー
        new_image = cv2.cvtColor(new_image, cv2.COLOR_RGB2BGR)
    elif new_image.shape[2] == 4:  # 透過
        new_image = cv2.cvtColor(new_image, cv2.COLOR_RGBA2BGRA)
    return new_image


def cv2pil(image: np.ndarray) -> Image:
    """OpenCV型 -> PIL型"""
    new_image = image.copy()
    if new_image.ndim == 2:  # モノクロ
        pass
    elif new_image.shape[2] == 3:  # カラー
        new_image = cv2.cvtColor(new_image, cv2.COLOR_BGR2RGB)
    elif new_image.shape[2] == 4:  # 透過
        new_image = cv2.cvtColor(new_image, cv2.COLOR_BGRA2RGBA)
    new_image = Image.fromarray(new_image)
    return new_image


def add_mosaic_faces(img: Image) -> Image:
    # cv2形式に変換（これをやらないとface_recognitionでエラーが起きる）
    cv_img = pil2cv(img)

    # 顔のモザイク処理
    output_image = img.copy()
    face_location_list = face_recognition.face_locations(cv_img, 0, "cnn")

    for top, right, bottom, left in face_location_list:
        print(f"Found face at: {top}, {right}, {bottom}, {left}")
        w, h = right - left, bottom - top
        x = left
        y = top
        face_img = img.crop((left, top, right, bottom))
        # 定数でモザイク化すると、元の写真が高画質すぎるとモザイクが効かないかもしれないので、縮小するサイズを決める。
        # 塗りつぶしだと、写真への印象が悪くなるので、モザイク処理にする。
        face_size = max(face_img.size)
        factor = face_size // 3
        # 顔部分を縮小
        small_face_img = face_img.resize(
            (w // factor, h // factor),
            Image.LANCZOS,
        )
        mosaiced_face_img = small_face_img.resize(
            (w, h), Image.LANCZOS
        )  # 顔を元のサイズに拡大することでモザイク化
        output_image.paste(mosaiced_face_img, (x, y))  # 顔を元の位置に貼り付け

    return output_image


process_images("original_images", "images")
