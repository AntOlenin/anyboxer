# anyboxer
server-side routeboxer


Installation
------------
```sh
npm install anyboxer --save
```

Usage
-----

```js
var anyBoxer = require('anyboxer');
var boxer = new anyBoxer;

var options = {
    data: {
        lineString: lineString // [[lat, lon], [lat, lon], [lat, lon]]
    },
    fat: 30,
    split: true
};
var boxes = boxer.getBoxes(options);
```

License
-------
MIT

    
