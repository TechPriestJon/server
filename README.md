# server
Backend of OnThinIce

## API

### GET /api/tiles
Gets a summary object for all of the tiles.

```json
[
    { 
        "tileId":"1",
        "height":"500",
        "temperature":"0"
    }
]
```

### GET /api/tiles/{id}
Gets all the information about a single tile, including events/history etc.

```json
{
    "tileId":"1",
    "height":"500",
    "temperature":"0"
}
```

### POST /api/expeditions
Creates a new expedition request. 

```json
{
    "title":"Tom's Polar Quest"
}
```

```json
{
    "success":"true",
    "guid":"45745c60-7b1a-11e8-9c9c-2d42b21b1a3e"
}
```
