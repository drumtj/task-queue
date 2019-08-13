# Task Queue

[![npm version](https://img.shields.io/npm/v/@drumtj/task-queue.svg?style=flat)](https://www.npmjs.com/package/@drumtj/task-queue)
[![license](https://img.shields.io/npm/l/@drumtj/task-queue.svg)](#)

task management queue

## Features



## Installing

Using npm:

```bash
$ npm install @drumtj/task-queue
```

Using cdn:

```html
<script src="https://unpkg.com/@drumtj/task-queue@1.0.14/dist/task-queue.js"></script>
```

Using amd, commonjS Module

```js
const TaskQueue = require('@drumtj/task-queue');
```

```js
import TaskQueue from '@drumtj/task-queue';
```

## How To
ex) image list loader

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
//process complete callback function
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
new TaskQueue(urls, load, loaded, allLoaded).process(-1); //call for sequencable
```

other usecase
```js
let queue = new TaskQueue();
queue.addDataFromArray(urls);
queue.setProcessCallback(load);
queue.setProcessCompleteCallback(loaded);
queue.setCompleteCallback(allLoaded);
//call for one step
queue.process();
//call for two step
queue.process(2);
//call for sequential step
queue.process(-1);
```

data management
```js
let priority = true;//optional; -> when is true data is inserted at the beginning of the internal queue
let key = queue.addData("data", priority);
let keys = queue.addDataFromArray(["data1", "data2"], priority);
queue.setData("key1", "data1", priority);
let data = queue.getData("key1");
let has = queue.hasData("key1");
queue.deleteData("key1");
```


## Examples
- [performance test when doing add many rendering object](https://codepen.io/taejin-kim/pen/VoBWZv)

## License

MIT
