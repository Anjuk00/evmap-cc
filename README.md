# EVmap Mongolia

Улаанбаатарын цахилгаан автомашины цэнэглэх цэгүүдийг нэг газрын зурагт харуулах EVmap.cc веб апп.

## Гол боломжууд

- станцын байршил, порт, чадал, үнэ, зогсоолын мэдээлэл;
- хэрэглэгчийн байршлаас станц хүртэлх шулуун зай;
- ChargeX Open API-аас портын төлөв шинэчлэх;
- улс, үйлдвэрлэгч, загвараар машин сонгож тохирох портыг санал болгох;
- desktop болон mobile-д зориулсан responsive интерфэйс.

## ChargeX төлөвийн дүрэм

`/connectors/busy` endpoint нь эхлээгүй захиалга болон дууссан бичлэг агуулж болдог. Иймээс порт зөвхөн дараах бүх нөхцөлийг хангахад `Цэнэглэж байна` гэж харагдана:

- `started_at` хүчинтэй;
- `total_minutes > 0`;
- `remaining_minutes > 0`;
- `0 <= elapsed_minutes < total_minutes`.

Порт `Faulted`, `Offline`, `Unavailable` төлөвтэй бол busy бичлэг байсан ч ажиллагаагүй төлөвийг хадгална.

## Машины нийцлийн өгөгдөл

Нийцлийг зөвхөн портын нэрээр бус `connector + AC/DC` хослолоор шалгана. Зах зээл, он, хувилбараас порт өөрчлөгдөх боломжтой тул:

- `verified` — үйлдвэрлэгчийн албан эх сурвалжаар баталгаажсан;
- `estimated` — тухайн зах зээлийн нийтлэг хувилбар, хэрэглэгч бодит оролтоо давхар шалгана.

Одоогийн баталгаажсан эх сурвалжууд:

- [BYD Song Plus DM-i Caribbean 2024](https://www.byd.com/content/dam/byd-site/caribbean/product-detail/song-plus-dm-i-rhd/flyer/song-plus-dm-i-rhd-flyer-20240401.pdf)
- [BYD Song Plus DM-i Latin America 2023](https://www.byd.com/material/byd-site/america-public/flyer/songplus-dm-i-flyer-es-20230307.pdf)
- [Nissan charging guide](https://www.nissanusa.com/experience-nissan/news-and-events/how-to-charge-electric-car.html/1000.html)

## Ажиллуулах

Node.js `>=22.13.0` шаардлагатай.

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Нууцлал

Энэ хувилбар хэрэглэгчээс бүртгэл шаардахгүй. Google Analytics нь зөвхөн веб хандалтын ерөнхий статистик цуглуулна.
