function musicVisualizer(obj){
    this.source = null;
    this.count =0;
    this.analyser = musicVisualizer.ac.createAnalyser();
    this.size = obj.size;
    this.analyser.fftSize = this.size * 2;

    this.gainNode = musicVisualizer.ac.createGain();
    this.gainNode.connect(musicVisualizer.ac.destination);
    this.analyser.connect(this.gainNode);
    this.xhr = new XMLHttpRequest();
    this.visualizer = obj.visualizer;
    this.visualize();
}
musicVisualizer.ac = new (window.AudioContext||window.webkitAudioContext)();

musicVisualizer.prototype.load = function(url,fun){
    this.xhr.abort();
    this.xhr.open("GET",url);
    this.xhr.responseType = "arraybuffer"
    let self = this;
    this.xhr.onload = function(){
        fun(self.xhr.response);
    }
    this.xhr.send();
}

musicVisualizer.prototype.decode = function(arraybuffer,fun){
    musicVisualizer.ac.decodeAudioData(arraybuffer,function(buffer){
        fun(buffer)
    },function(error){
        console.log(error);
    });
}
musicVisualizer.prototype.play = function(url){
    let n = ++ this.count;
    let self = this;
    this.source && this.stop();
    this.load(url,function(arraybuffer){
        if(n!==self.count) return;
        self.decode(arraybuffer,function(buffer){
            if(n!==self.count) return;
            let bs = musicVisualizer.ac.createBufferSource();
            bs.connect(self.analyser)
            bs.buffer = buffer;
            bs.start();
            self.source = bs
        })
    })
}
musicVisualizer.prototype.stop = function(){
    this.source[this.source.stop ? "stop": "noteOff"](0);
}
musicVisualizer.prototype.changeVolume = function(percent){
    this.gainNode.gain.value = percent * percent;
}
musicVisualizer.prototype.visualize=function(){
    let arr = new Uint8Array(this.analyser.frequencyBinCount);
    
    
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    let self = this;
    function audioDataGetHelper(){
        self.analyser.getByteFrequencyData(arr);
        //console.log(arr);
        
        // draw(arr);
        self.visualizer(arr);
        requestAnimationFrame(audioDataGetHelper);
    }
    requestAnimationFrame(audioDataGetHelper);
    // console.log(arr);
}