# server
Backend of OnThinIce

## GET /api/tiles
Gets a summary object for all of the tiles. This object looks like:

```json
[
    { 
        "tileId":"1",
        "height":"500",
        "temperature":"0"
    }
]
```

## GET /api/tiles/{id}
Gets all the information about a single tile, including events/history etc.

```json
{
    "tileId":"1",
    "height":"500",
    "temperature":"0"
}
```

## POST /api/expeditions
Creates a new expedition request. 

```json
{
    "tileId":"1",
    "height":"500",
    "temperature":"0"
}
```




/api/
