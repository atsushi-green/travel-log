
document.getElementById('allcheck').addEventListener('click', checkall);
document.getElementById('alluncheck').addEventListener('click', uncheckall);

document.getElementById('restaurants').addEventListener('change', filterMarkers);
document.getElementById('tourist-attractions').addEventListener('change', filterMarkers);


var map = L.map('map').setView([35.02352791752294, 135.7633984809353], 5);  //デフォルト13
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var MAP_MAKERS = {};  //Image name -> 地図上マーカーのマッピング
var explainInfo = {};  // Image name -> Explain info（画像の説明文やタグなど）のマッピング


async function loadJson() {
    try {
        const response = await fetch('docs/explain.json');
        explainInfo = await response.json();
        updateMarkers();
    } catch (error) {
        console.error('Failed to load JSON:', error);
    }
}


function updateMarkers() {
    const imageElements = document.images;
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
            marker.getElement().style.border = '2px solid white';
            MAP_MAKERS[imageName] = marker;
            if (explainInfo) {
                display_str = make_title_display_str(explainInfo);
                marker.bindPopup(display_str);
            }
        }
    });
}


function removeMarkers(imageName) {
    MAP_MAKERS[imageName].remove();
}


function checkall() {
    const showRestaurants = document.getElementById('restaurants').checked;
    const showAttractions = document.getElementById('tourist-attractions').checked;
    document.getElementById('restaurants').checked = true;
    document.getElementById('tourist-attractions').checked = true;
    filterMarkers()
}


function uncheckall() {
    const showRestaurants = document.getElementById('restaurants').checked;
    const showAttractions = document.getElementById('tourist-attractions').checked;
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
            marker.remove();
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
// map.on('zoomend', function () {
//     var zoomLevel = map.getZoom();
//     console.log('Zoom Level:', zoomLevel);
//     var imageElements = document.images;
//     for (var i = 0; i < imageElements.length; i++) {
//         var imageElement = imageElements[i];
//         var marker = MAP_MAKERS[imageElement.id];
//         if (marker) {
//             var iconSize = [50, 50]; // Default icon size
//             if (zoomLevel > 10) {
//                 iconSize = [100, 100]; // Increase icon size for higher zoom levels
//             } else if (zoomLevel < 5) {
//                 iconSize = [25, 25]; // Decrease icon size for lower zoom levels
//             }
//             marker.setIcon(L.icon({
//                 iconUrl: 'images/' + imageElement.id + '.jpg',
//                 iconSize: iconSize,
//                 iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
//             }));
//         }
//     }
// });
loadJson();