import Mapx from "@drumtj/mapx";

export default class TaskQueue {
	list = new Mapx();
	priorityList = new Mapx();
	processCallback = null;
	processCompleteCallback = null;
	completeCallback = null;
	completeValues = [];
	iterator = null;
	isDone = false;

	get length(){
		return this.priorityList.length + this.list.length;
	}

	constructor(dataArray?:any[], pcb?:(value:any)=>any, pccb?:(value:any)=>any, ccb?:(value:any)=>any){
		['list', 'priorityList', 'processCallback', 'processCompleteCallback', 'completeCallback', 'iterator', 'completeValues', 'isDone'].forEach(name=>{
			Object.defineProperty(this, name, {
				writable: true,
	      enumerable: false,
	      configurable: false
			})
		})
		this.addDataFromArray(dataArray);
		this.setProcessCallback(pcb);
		this.setProcessCompleteCallback(pccb);
		this.setCompleteCallback(ccb);
		this.iterator = this.getIterator();
  }

	shift(){
		if(this.priorityList.length){
			return this.priorityList.shift();
		}
		return this.list.shift();
	}

	destroy(){
		this.list = null;
		this.priorityList = null;
		this.isDone = false;
		this.processCallback = null;
		this.processCompleteCallback = null;
		this.completeCallback = null
		this.completeValues = [];
		this.iterator = null;
	}

	reset(){
		this.destroy();
		this.list = new Mapx();
		this.priorityList = new Mapx();
		this.iterator = this.getIterator();
	}

	* getIterator(){
		// console.error("getIterator");
    while(1){
			if(!(typeof this.processCallback === "function" && this.length)) break;
    	yield this.exeProcessCallback();
  	}
  }

	process(sequenceUnit=0){
    let r;
    if(!this.isDone && this.length){
      r = this.iterator.next();
			this.isDone = r.done;
    }

    if(this.isDone || r === undefined){
      if(this.length == 0 && this.completeCallback){
      	this.completeCallback(this.completeValues.slice());
        this.completeValues = [];
      }
      this.iterator = this.getIterator();
			this.isDone = false;
    }else if(r){
			r.value.then((processCompleteValue)=>{
        if(this.completeCallback){
          this.completeValues.push(processCompleteValue);
        }
				if(typeof sequenceUnit === "number"){
					if(sequenceUnit-1 > 0){
						//not infinity
	        	this.process(sequenceUnit-1);
					}else if(sequenceUnit == -1){
						//infinity
						this.process(-1);
					}else if(this.length == 0){
						//for end
						this.process();
					}
				}else{
					if(this.length == 0){
						//for end
						this.process();
					}
				}
    	})
    }
	}

	exeProcessCallback(){
		return new Promise(resolve=>{
			let promise = this.processCallback.call(this, this.shift());
			if(promise instanceof Promise){
				promise.then(r=>{
          if(this.processCompleteCallback){
            this.processCompleteCallback.call(this, r);
          }
          resolve(r);
        })
      }else{
				if(this.processCompleteCallback){
          this.processCompleteCallback.call(this, promise);
        }
				resolve(promise);
      }
    })
  }

	setProcessCallback(cb){
		if(typeof cb === "function"){
			this.processCallback = cb;
		}else if(cb !== undefined){
			console.warn("[setProcessCallback] param must be function type");
			this.processCallback = null;
		}
	}

	setProcessCompleteCallback(cb){
		if(typeof cb === "function"){
			this.processCompleteCallback = cb;
		}else if(cb !== undefined){
			console.warn("[setProcessCompleteCallback] param must be function type");
			this.processCompleteCallback = null;
		}
	}

	setCompleteCallback(cb){
		if(typeof cb === "function"){
			this.completeCallback = cb;
		}else if(cb !== undefined){
			console.warn("[setCompleteCallback] param must be function type");
			this.completeCallback = null;
		}
	}

	addData(data:any, priority?:boolean){
		if(priority){
			return this.priorityList.push(data);
		}
		return this.list.push(data);
  }

	addDataFromArray(datas:any[], priority?:boolean){
		if(Array.isArray(datas)){
			if(priority){
				return datas.map(v=>this.priorityList.push(v));
			}
			return datas.map(v=>this.list.push(v));
		}
		return [];
	}

	setData(key, data, priority?:boolean){
		if(priority){
			this.priorityList.set(key, data);
		}else{
			this.list.set(key, data);
		}
	}

	hasData(key){
		return this.priorityList.has(key) || this.list.has(key);
	}

	getData(key){
		if(this.priorityList.has(key)){
			return this.priorityList.get(key);
		}
		return this.list.get(key);
	}

	deleteData(key){
		if(this.priorityList.has(key)){
			this.priorityList.delete(key);
		}else{
			this.list.delete(key);
		}
	}
}
