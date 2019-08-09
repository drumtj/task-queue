export default class TaskQueue {
	list = [];
	processCallback = null;
	processCompleteCallback = null;
	completeCallback = null;
	completeValues = [];
	iterator = null;
	isDone = false;
	constructor(dataArray?:any[], pcb?:(value:any)=>any, pccb?:(value:any)=>any, ccb?:(value:any)=>any){
		['list', 'processCallback', 'processCompleteCallback', 'completeCallback', 'iterator', 'completeValues', 'isDone'].forEach(name=>{
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

	destroy(){
		this.list = [];
		this.isDone = false;
		this.processCallback = null;
		this.processCompleteCallback = null;
		this.completeCallback = null
		this.completeValues = [];
		this.iterator = null;
	}

	reset(){
		this.destroy();
		this.iterator = this.getIterator();
	}

	* getIterator(){
		// console.error("getIterator");
    while(1){
			if(!(typeof this.processCallback === "function" && this.list.length)) break;
    	yield this.exeProcessCallback();
  	}
  }

	process(sequencable?){
    let r;
    if(!this.isDone && this.list.length){
      r = this.iterator.next();
			this.isDone = r.done;
    }

    if(this.isDone || r === undefined){
      if(this.list.length == 0 && this.completeCallback){
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
				if(sequencable){
        	this.process(sequencable);
				}else if(this.list.length == 0){
					//for end
					this.process();
				}
    	})
    }
	}

	exeProcessCallback(){
		return new Promise(resolve=>{
			let promise = this.processCallback.call(this, this.list.shift());
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

	addData(data:any){
		this.list.push(data);
		return this;
  }

	addDataFromArray(datas:any[]){
		if(Array.isArray(datas)){
			datas.forEach(v=>this.addData(v));
		}
		return this;
	}
}
