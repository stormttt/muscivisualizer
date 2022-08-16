// function $(s){
//     return document.querySelectorAll(s);
// }
// var list = $("#list li")
const list = document.querySelectorAll('.music');
const volume = document.getElementById('volume');
const box = document.getElementById('box');
const canvas = document.createElement("canvas");
const types = document.querySelectorAll('.type');
const time = document.getElementById('currentTime')
let ctx = canvas.getContext("2d")
box.appendChild(canvas);
let height,width;
let Dots = [];
let size = 128;
let line;
//定义一个随机返回m，n之间整数的一个函数
function randomReturn(m,n){
    return Math.round(Math.random()*(n-m)+m);
}
function getDots(){
    Dots=[];
    for (let i = 0; i < size; i++) {
        let x = randomReturn(0,width);
        let y = randomReturn(0,height)
        let color = `rgba(${randomReturn(0,255)},${randomReturn(0,255)},${randomReturn(0,255)},0.1)`
        Dots.push({
            x:x,
            y:y,
            //圆心移动增量
            dx:randomReturn(1,4),
            color:color,
            // 柱状图优化中的小帽子数量
            cap:0
        });
    }
}

// 改变图形 dot 或者 column
draw.type = "column"
for(let i = 0;i<types.length;i++){
    types[i].onclick = function(){
        for(let j=0;j<types.length;j++){
            types[j].classList.remove('selected');
        }
        types[i].classList.add('selected');
        draw.type = this.getAttribute("data-type")
    }
}

// 窗口变化及图像设置
function resize(){
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;
    // console.log(canvas.height);
    
    getDots()
}
resize();
window.onresize = resize;
// console.log(volume);
// 获取mp3文件列表 并选择
// console.log(list);
list.forEach(music=>{
    // console.log(music);
    music.addEventListener('click',()=>{
        clearSelection();
        // music.className = 'selected';
        music.classList.add('selected');
        // console.log(music.title)
        load("/media/"+music.title)
    })
})
function clearSelection(){
    list.forEach(music=>music.classList.remove('selected'))
}
//变量判断是否有歌曲在播放
let sourceForJudge = null;
let count = 0;
// 设置连接，传入音频信息播放等,播放歌曲
let xhr = new XMLHttpRequest();
let ac = new (window.AudioContext||window.webkitAudioContext)();
//设置当前播放时间

//声音大小
let gainNode = ac.createGain();
//音频分析
let analyser = ac.createAnalyser();

analyser.fftSize = size*2;
analyser.connect(gainNode);

gainNode.connect(ac.destination);
//绘制图形的函数
function draw(arr){
    //清除之前的，让图形更顺滑
    ctx.clearRect(0,0,width,height)
    let w = width/size;
    // 小帽高度
    // let capHeight = (w*0.6) >10?10:(w*0.6)
    let cw = w*0.6
    let capHeight = cw>10?10:cw;
    
    ctx.fillStyle= line;
    // //设置当前播放时间
    // time.innerText=`${Math.floor(Math.round(ac.currentTime)/60)}:${Math.round(ac.currentTime)}`;
    for(let i =0;i<size;i++){
        let o = Dots[i];
        if(draw.type ==='column'){
            line = ctx.createLinearGradient(0,0,0,height);
            line.addColorStop(0,"red");
            line.addColorStop(0.5,"yellow");
            line.addColorStop(1,"green");
            ctx.fillStyle= line;
            let h = arr[i]/256 * height;
            ctx.fillRect(w*i,height-h,cw,h); 
            ctx.fillRect(w*i,height-o.cap-capHeight,cw,capHeight); 
            o.cap--;
            if(o.cap<0){
                o.cap = 0;
            }
            if(h>0&&o.cap<h+40){
                o.cap = h+40 > height-capHeight?height-capHeight:h+40;
            }
        }
        else if(draw.type ==='dot'){
            ctx.beginPath();
            
            // console.log(o);
            //设置圆最小半径并且让其根据窗口宽度和高度变化
            let r = 10+ arr[i] /256 *(height>width?width/8:height/8);
            ctx.arc(o.x,o.y,r,0,Math.PI*2,true);
            let g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);
            g.addColorStop(0,"#fff");
            g.addColorStop(1,o.color);
            ctx.fillStyle=g;
            ctx.fill();
            o.x+=o.dx;
            o.x = o.x> width?0:o.x;
            // ctx.strokeStyle = '#fff';
            // ctx.stroke();
        }
        
    }
}
function load(url){
    let n = ++count;
    if(sourceForJudge){
        sourceForJudge.stop();
    }
    xhr.abort();
    xhr.open("GET",url);
    xhr.responseType = "arraybuffer";
    xhr.onload = function(){
        if(n!==count) return;
        // console.log(xhr.response)
        ac.decodeAudioData(xhr.response,function(buffer){
            if(n!==count) return;
            let bufferSource = ac.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(analyser);
            // bufferSource.connect(gainNode);
            // bufferSource.connect(ac.destination);
            sourceForJudge = bufferSource;
            bufferSource[bufferSource.start?"start":"noteOn"](0);
            // console.log(ac.state);
            
        },function(error){
            console.log(error);
        })
    }
    xhr.send()
}
//分析数据
//实时拿到当前音频分析数据存在unit8 typed array里面
function audioDataGet(){
    let arr = new Uint8Array(analyser.frequencyBinCount);
    
    
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

    function audioDataGetHelper(){
        analyser.getByteFrequencyData(arr);
        //console.log(arr);
        
        draw(arr);
        requestAnimationFrame(audioDataGetHelper);
    }
    requestAnimationFrame(audioDataGetHelper);
    // console.log(arr);
}
// 不能放在load里面运行
audioDataGet();
//改变音量
function changeVolume(percent){
    gainNode.gain.value = percent*percent;
}
volume.onchange =function(){
    changeVolume(this.value/100)
  };
// volume.addEventListener('change',()=>{
//     changeVolume(volume.value/100)
//     console.log(volume.value);
// })