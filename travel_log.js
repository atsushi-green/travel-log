
document.getElementById('allcheck').addEventListener('click', checkall);
document.getElementById('alluncheck').addEventListener('click', uncheckall);

document.getElementById('restaurants').addEventListener('change', filterMarkers);
document.getElementById('tourist-attractions').addEventListener('change', filterMarkers);

const INITIAL_ZOOM_LEVEL = 5;
var map = L.map('map').setView([35.02352791752294, 135.7633984809353], INITIAL_ZOOM_LEVEL);  //デフォルト13
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
var prevZoomLevel = INITIAL_ZOOM_LEVEL
var bounds = map.getBounds();
var southWest = bounds.getSouthWest();
var CURRENT_LATITUDE = southWest.lat;
var CURRENT_LONGITUDE = southWest.lng;
var numShownImages = 0;
map.on('moveend', function () {
    var bounds = map.getBounds();
    var southWest = bounds.getSouthWest();
    CURRENT_LATITUDE = southWest.lat;
    CURRENT_LONGITUDE = southWest.lng;
});
class Position {
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
}
var MAP_MAKERS = {};  //Image name -> 地図上マーカーのマッピング
var explainInfo = {};  // Image name -> Explain info（画像の説明文やタグなど）のマッピング
var IMAGE_POSITIONS = {};  // Image name -> 画像の緯度経度のマッピング
var REPRESENTATIVE_IMAGE_NAMES = [];  // 代表画像の名前
var REPRESENTATIVE_IMAGE_INDICES = [];  // 代表画像の名前
var REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
    13: [],
};  // Zoom Levelごとの代表画像の名前

async function loadJson() {
    try {
        const response = await fetch('docs/explain.json');
        explainInfo = await response.json();
        updateMarkers();
    } catch (error) {
        console.error('Failed to load JSON:', error);
    }
}

const NUM_GRID = 5;  // 画面を5x5のグリッドに分割
area_set_by_zoom = {
    0: new Set(),
    1: new Set(),
    2: new Set(),
    3: new Set(),
    4: new Set(),
    5: new Set(),
    6: new Set(),
    7: new Set(),
    8: new Set(),
    9: new Set(),
    10: new Set(),
    11: new Set(),
    12: new Set(),
    13: new Set(),

};

function updateMarkers() {
    const imageElements = document.images;
    var prefecture_set = new Set();

    for (let i = 0; i < imageElements.length; i++) {
        const imageElement = imageElements[i];
        let info = explainInfo[imageElement.id];
        if (imageElement.complete) {
            addImageMarker(imageElement, imageElement.id, info);
        } else {
            imageElement.onload = function () {
                addImageMarker(imageElement, imageElement.id, info);
            }
        }
    }
    filterMarkers();
}


function addImageMarker(imageElement, imageName, explainInfo) {
    EXIF.getData(imageElement, function () {
        var lat = EXIF.getTag(this, "GPSLatitude");
        var lon = EXIF.getTag(this, "GPSLongitude");

        if (lat && lon) {
            var latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
            var lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";
            lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "N" ? 1 : -1);
            lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === "E" ? 1 : -1);

            var imageIcon = L.icon({
                iconUrl: 'images/' + imageName + '.jpg',
                iconSize: [50, 50],
                iconAnchor: [25, 25]
            });
            var marker = L.marker([lat, lon], { icon: imageIcon }).addTo(map);
            numShownImages++;
            marker.getElement().style.border = '2px solid white';
            MAP_MAKERS[imageName] = marker;
            if (explainInfo) {
                display_str = make_title_display_str(explainInfo);
                marker.bindPopup(display_str);
            }
            IMAGE_POSITIONS[imageElement.id] = new Position(lat, lon);
            // 非同期処理であるから、ここでズームレベルに応じた処理を行う必要がある。
            // TODO: 処理の見通しが悪いので、あとでリファクタリングする
            // ---------------------
            // console.log(imageElement.id)
            // TODO: imageElementという画像を、以下のzoomLevelのどれか一つだけに入れる
            var thisImageEmbedded = false;
            for (let zoomLevel = 0; zoomLevel <= 12; zoomLevel++) {
                // 画面の幅
                let width = 360 / (2 ** zoomLevel);
                // ざっくり、画面の幅が5等分になるくらいのグリッドにする
                let grid_width = width / NUM_GRID

                // 地球を縦横それぞれ360/grid_width等分している
                let num_grid_ = Math.ceil(360 / grid_width);
                let lat_idx = Math.floor(lat / grid_width);
                let lon_idx = Math.floor(lon / grid_width);

                let = area_index = lat_idx * num_grid_ + lon_idx;
                // 今のズームレベルでの区画で初めてなら入れる。
                // ただし、&& 条件として、この画像が入れられたら次のZoom Levelでは入れないようにする
                if (!area_set_by_zoom[zoomLevel].has(area_index)) {
                    area_set_by_zoom[zoomLevel].add(area_index);
                    if (!thisImageEmbedded) {
                        REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL[zoomLevel].push(imageElement.id);
                        thisImageEmbedded = true;

                        if (zoomLevel > INITIAL_ZOOM_LEVEL) {
                            marker.removeFrom(map);
                            numShownImages--;
                        }
                    }


                }

            }
            // for文が終わっても、thisImageEmbeddedがfalseなら、最後のズームレベルに入れる
            if (!thisImageEmbedded) {
                REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL[13].push(imageElement.id);
                marker.removeFrom(map);//もちろん表示させない
                thisImageEmbedded = true;
            }
            // ---------------------


        }
    });
    console.log(REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL)
}


function checkall() {
    document.getElementById('restaurants').checked = true;
    document.getElementById('tourist-attractions').checked = true;
    filterMarkers()
}


function uncheckall() {
    document.getElementById('restaurants').checked = false;
    document.getElementById('tourist-attractions').checked = false;
    filterMarkers()
}


function filterMarkers() {
    const showRestaurants = document.getElementById('restaurants').checked;
    const showAttractions = document.getElementById('tourist-attractions').checked;

    for (let imageName in MAP_MAKERS) {
        const marker = MAP_MAKERS[imageName];
        const info = explainInfo[imageName];

        if ((showRestaurants && info.tags.includes("飲食店")) || (showAttractions && info.tags.includes("観光地"))) {
            marker.addTo(map);

        } else {
            marker.removeFrom(map);
        }
    }
}


function make_title_display_str(explainInfo) {
    var title = '<h2>' + explainInfo.title + '</h2>';
    var description = explainInfo.description ? '<p>' + explainInfo.description + '</p>' : '';
    var url = explainInfo.url ? '<a href="' + explainInfo.url + '" target="_blank">詳細を見る</a>' : '';
    var image = '<br><a href="images/' + explainInfo.image_name + '" data-lightbox="image-' + explainInfo.image_name + '">画像を拡大</a>';
    return title + description + url + image;
}


// 以下のコードはZoom Levelに応じてアイコンのサイズを変更するコード。
// 実装してみたが、思ったように綺麗に動作しなかったのでコメントアウトしている。
map.on('zoomend', function () {
    var zoomLevel = map.getZoom();
    console.log('Zoom Level:', zoomLevel);
    console.log('Prev Zoom Level:', prevZoomLevel);

    var imageElements = document.images;
    var smallerZoomLevel = zoomLevel < prevZoomLevel ? zoomLevel : prevZoomLevel;
    var largerZoomLevel = zoomLevel < prevZoomLevel ? prevZoomLevel : zoomLevel;
    var increase = prevZoomLevel < zoomLevel ? true : false;  // Zoom Levelが増えたなら、表示する写真を増やす
    if (increase) {
        for (var level = smallerZoomLevel + 1; level <= largerZoomLevel; level++) {
            let imageNames = REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL[level];
            for (var i = 0; i < imageNames.length; i++) {
                let imageName = imageNames[i];
                const marker = MAP_MAKERS[imageName];
                marker.addTo(map);
                numShownImages++;
            }
        }
    } else {
        for (var level = smallerZoomLevel + 1; level <= largerZoomLevel; level++) {
            let imageNames = REPRESENTATIVE_IMAGE_NAMES_BY_LEVEL[level];
            for (var i = 0; i < imageNames.length; i++) {
                let imageName = imageNames[i];
                const marker = MAP_MAKERS[imageName];
                marker.removeFrom(map);
                numShownImages--;
            }
        }

    }
    prevZoomLevel = zoomLevel;
    return

});
loadJson();