# Task Queue

[![npm version](https://img.shields.io/npm/v/@drumtj/task-queue.svg?style=flat)](https://www.npmjs.com/package/@drumtj/task-queue)
[![license](https://img.shields.io/npm/l/@drumtj/task-queue.svg)](#)

task management queue

## Features

- you can set key and value from object or array
- you can change the size of the map with the length property.
- you can clone an object with the clone() method.
- you can use map, filter, reduce like an array.

Arrays have some nice features for manipulating data such as map, forEach, filter, and reduce, but the disadvantage of using loops to check for the inclusion of elements. And objects can find elements quickly using keys, but you have to use loops to process the data, which is inconvenient for handling deep data. Mapx improves on the inconveniences of traditional Map Classes and brings the benefits of arrays and objects.

## Installing

Using npm:

```bash
$ npm install @drumtj/task-queue
```

Using cdn:

```html
<script src="https://unpkg.com/@drumtj/task-queue@1.0.0/dist/task-queue.js"></script>
```

Using amd, commonjS Module

```js
const TaskQueue = require('@drumtj/task-queue');
```

```js
import TaskQueue from '@drumtj/task-queue';
```

## Example
example : 1 queue, image list loader

make sample data
```js
var url = "https://as.ftcdn.net/r/v1/pics/2fd8819a419c4245e5429905770db4b570661f48/home/discover_collections/Images.jpg";
//sample data
var urls = new Array(5).fill(url).map(v=>v+"?r="+(Math.floor(Math.random()*10000)));
```

define callback (use promise)
```js
//process callback function
function load(url){
  console.error("load", url);
  return new Promise(resolve=>{
      let img = new Image();
      img.onload = ()=>resolve(img);
      img.src = url;
  })
}
//complete callback function
function loaded(img){
	console.error("loaded", img);
}
//complete callback function
function allLoaded(result){
	console.error("all loaded", result);
}
```

direct return case
```js
//process callback function
async function load(url){  
  console.error("load", url);
	let img = await new Promise(resolve=>{
      let img = new Image();
      img.onload = ()=>resolve(img);
      img.src = url;
  })
  return img;
}
```


use TaskQueue
```js
// new TaskQueue(urls, load).process();
// new TaskQueue(urls, load, loaded).process();
// new TaskQueue(urls, load, null, allLoaded).process();
new TaskQueue(urls, load, loaded, allLoaded).process();
```

other usecase
```js
var queue = new TaskQueue();
queue.addDataFromArray(urls);
queue.setProcessCallback(load);
queue.setProcessCompleteCallback(loaded);
queue.setCompleteCallback(allLoaded);
queue.process();
```




## License

MIT
