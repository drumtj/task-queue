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
	processParam;

	get length(){
		return this.priorityList.length + this.list.length;
	}

	constructor(dataArray?:any[], pcb?:(value:any)=>any, pccb?:(value:any)=>any, ccb?:(value:any)=>any){
		['list', 'priorityList', 'processCallback', 'processCompleteCallback', 'completeCallback', 'iterator', 'completeValues', 'isDone', 'processParam'].forEach(name=>{
			Object.defineProperty(this, name, {
				writable: true,
	      enumerable: false,
	      configurable: false
			})
		})
		this.pushFromArray(dataArray);
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
    	yield this.exeProcessCallback(this.processParam);
			this.processParam = null;
  	}
  }

	fastSequentialProcess(param?){
		// const fn = async (u) => {
    const startTime = Date.now();
		if(typeof this.processCallback !== "function"){
			throw new Error("processCallback is not function");
		}

		while (Date.now() - startTime <= 10 && this.length) {
			this.processCallback.call(this, this.shift(), param);
		}

    if (this.length) {
      setTimeout(this.fastSequentialProcess, 5, param);
    }
	}

	//모든 list의 데이터를 연속적으로 처리하되 cpu block을 최소화함.
	//minSequenceUnit는 최소 몇개의 데이터는 강제로 한 loop에서 실행되도록 할지 여부
	sequentialProcess(minSequenceUnit=0, param?){
		// const fn = async (u) => {
		let u = minSequenceUnit;
		let limitMs = 10;
    const startTime = Date.now();
		if(typeof this.processCallback !== "function"){
			throw new Error("processCallback is not function");
		}

		if(typeof this.completeCallback === "function"){
			while ((u-- >= 0 || Date.now() - startTime <= limitMs)  && this.length) {
				let v = this.processCallback.call(this, this.shift(), param);
				if(typeof this.processCompleteCallback === "function"){
          this.processCompleteCallback.call(this, v);
        }
				this.completeValues.push( v );
      }
		}else{
			while ((u-- >= 0 || Date.now() - startTime <= limitMs) && this.length) {
				if(typeof this.processCompleteCallback === "function"){
          this.processCompleteCallback.call(this, this.processCallback.call(this, this.shift(), param));
        }else{
					this.processCallback.call(this, this.shift(), param);
				}
      }
		}

    if (this.length) {
      setTimeout(this.sequentialProcess.bind(this), 5, minSequenceUnit, param);
    }else if(typeof this.completeCallback === "function"){
    	this.completeCallback.call(this, this.completeValues.slice());
      this.completeValues = [];
		}
	}

	process(sequenceUnit=0, param?){
    let r;
		this.processParam = param;
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
						setTimeout(this.process.bind(this), 0, sequenceUnit-1, param);
	        	// this.process(sequenceUnit-1);
					}else if(sequenceUnit == -1){
						//infinity
						setTimeout(this.process.bind(this), 0, -1, param);
						// this.process(-1);
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

	exeProcessCallback(param){
		return new Promise(resolve=>{
			let promise = this.processCallback.call(this, this.shift(), param);
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

	push(data:any, priority?:boolean){
		if(priority){
			return this.priorityList.push(data);
		}
		return this.list.push(data);
  }

	addData(data:any, priority?:boolean){
		console.warn("deprecated. use push()");
		return this.push.apply(this, arguments);
  }

	pushFromArray(datas:any[], priority?:boolean){
		if(Array.isArray(datas)){
			if(priority){
				return datas.map(v=>this.priorityList.push(v));
			}
			return datas.map(v=>this.list.push(v));
		}
		return [];
	}

	addDataFromArray(datas:any[], priority?:boolean){
		console.warn("deprecated. use pushFromArray()");
		return this.pushFromArray.apply(this, arguments);
	}

	set(key, data, priority?:boolean){
		if(priority){
			this.priorityList.set(key, data);
		}else{
			this.list.set(key, data);
		}
	}

	setData(key, data, priority?:boolean){
		console.warn("deprecated. use set()");
		return this.set.apply(this, arguments);
	}

	has(key){
		return this.priorityList.has(key) || this.list.has(key);
	}

	hasData(key){
		console.warn("deprecated. use has()");
		return this.has.apply(this, arguments);
	}

	get(key){
		if(this.priorityList.has(key)){
			return this.priorityList.get(key);
		}
		return this.list.get(key);
	}

	getData(key){
		console.warn("deprecated. use get()");
		return this.get.apply(this, arguments);
	}

	delete(key){
		if(this.priorityList.has(key)){
			this.priorityList.delete(key);
		}else{
			this.list.delete(key);
		}
	}

	deleteData(key){
		console.warn("deprecated. use delete()");
		return this.delete.apply(this, arguments);
	}
}
