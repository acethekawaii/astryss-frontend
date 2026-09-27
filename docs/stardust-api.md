# Stardust API

## Origins

CORS and the live WebSocket accept these origins:

- `http://localhost:3000`
- `https://astryss.acethekawaii.com`

The session token is the `Authorization` bearer for HTTP and the socket's first text frame. It is not a cookie.

## Session

`POST /api/v2/stardust/session`

Body is ignored. Response:

```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "token": "1.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyy"
  }
}
```

## Board

`GET /api/v2/stardust/board`

Headers:

- `Content-Type: application/octet-stream`
- `Cache-Control: no-store`

Body is a `STBD` snapshot. Layout:

| Offset | Size | Field |
| --- | --- | --- |
| 0 | 4 | magic `STBD` |
| 4 | 1 | version `1` |
| 5 | 2 | width u16be |
| 7 | 2 | height u16be |
| 9 | 4 | seq u32be |
| 13 | 1 | palette length |
| 14 | `paletteLength * 3` | RGB triples |
| header end | `width * height` | color indexes |

Header length is `14 + paletteLength * 3`.

Example: width 192, height 108, palette length 16, header length 62, body length `62 + 20736`.

Clients should read the size from the header rather than hard-code it. Changing the size in `stardust.config.ts` starts a fresh board; earlier boards keep their own Redis keys and placement log.

## Pixels

`POST /api/v2/stardust/pixels`

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Body:

```json
{ "x": 12, "y": 34, "color": 5 }
```

`color` is the palette index.

Success `201`:

```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "x": 12,
    "y": 34,
    "color": 5,
    "nextAllowedAt": "2026-09-27T05:00:30.000Z"
  }
}
```

Cooldown `429`:

```json
{
  "statusCode": 429,
  "error": "HttpException",
  "timestamp": "2026-09-27T05:00:00.000Z",
  "path": "/api/v2/stardust/pixels",
  "message": {
    "remainingMs": 29541,
    "nextAllowedAt": "2026-09-27T05:00:29.541Z"
  }
}
```

Other statuses: `400` bad cell or color, `401` missing or bad token, `503` board not ready or board write failed after the log append.

## Live WebSocket

URL: `ws://<host>/api/v2/stardust/live` (or `wss` behind TLS).

First client message:

```json
{ "token": "1.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyy" }
```

Later client messages are ignored. Missing or foreign `Origin`, a bad token, or no token within 5 seconds closes with code `1008`.

Server frames are binary `STPX` only. Layout:

| Offset | Size | Field |
| --- | --- | --- |
| 0 | 4 | magic `STPX` |
| 4 | 1 | version `1` |
| 5 | 2 | count u16be |
| 7 | `count * 9` | records |

Each record is 9 bytes: seq u32be, x u16be, y u16be, color u8.

## Palette

| Index | Hex |
| --- | --- |
| 0 | `#FFFFFF` |
| 1 | `#E4E4E4` |
| 2 | `#888888` |
| 3 | `#222222` |
| 4 | `#FFA7D1` |
| 5 | `#E50000` |
| 6 | `#E59500` |
| 7 | `#A06A42` |
| 8 | `#E5D900` |
| 9 | `#94E044` |
| 10 | `#02BE01` |
| 11 | `#00D3DD` |
| 12 | `#0083C7` |
| 13 | `#0000EA` |
| 14 | `#CF6EE4` |
| 15 | `#820080` |
