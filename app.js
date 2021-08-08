var open = document.getElementById('open'),
    subwrapper = document.getElementById('subwrapper'),
    input = document.getElementById('input'),
    output = document.getElementById('output'),
    input_size = document.getElementById('input_size'),
    output_size = document.getElementById('output_size'),
    type = document.getElementById('type'),
    factor = document.getElementById('factor'),
    loader = document.getElementById('loader');

var sw = window.innerWidth,
    sh = window.innerHeight,
    input_top = 0, input_left,
    output_top = 0, output_left;

subwrapper.style.height = (sh - 50) + 'px';

if(sh > sw){
    subwrapper.style.flexDirection = 'column';

    input.style.width = '100%';
    output.style.width = '100%';

    input.style.height = '50%';
    output.style.height = '50%';
}

var M = null;


open.addEventListener('change', function(){
    var file = this.files[0],
        reader = new FileReader();

    reader.readAsDataURL(file);

    reader.addEventListener('load', function(){
        var img = new Image();

        img.addEventListener('load', function(){
            M = reshape_gray(this);

            var canvas_input = document.createElement('canvas'),
                ctx_input = canvas_input.getContext('2d'),
                w = M[0].length,
                h = M.length;

            canvas_input.width = w;
            canvas_input.height = h;

            canvas_input.style.position = 'absolute';
            canvas_input.style.top = 0+'';
            canvas_input.style.left = 0+'';

            if(h < input.clientHeight){
                canvas_input.style.top = (input.clientHeight/2 - h/2) + 'px';
            }
            if(w < input.clientWidth){
                canvas_input.style.left = (input.clientWidth/2 - w/2) + 'px';
            }

            if(h < input.clientHeight && w < input.clientWidth){
                input.style.cursor = 'default';
            }
            else input.style.cursor = 'grab';

            if(input.lastChild) input.removeChild(input.lastChild);
            //=======================================================================
            //=======================================================================

            ctx_input.drawImage(this, 0, 0);

            input.appendChild(canvas_input);

            input_size.left = input.getBoundingClientRect().x + 'px';
            input_size.top = input.getBoundingClientRect().y + 'px';
            input_size.style.opacity = 1;
            input_size.innerHTML = w + ' x ' + h + ' px';

            update_result();
        });
        
        img.src = this.result;
    });
});

function update_result(){
    var matrix = M;

    
    if(matrix){
    //=======================================================

    loader.style.opacity = 1;

    var w = matrix[0].length, h = matrix.length;

    nw = parseInt(Math.round(w*parseFloat(factor.value)));
    nh = parseInt(Math.round(h*parseFloat(factor.value)));

    var worker = new Worker('worker.js');

    worker.postMessage({type: type.value, size: {w: nw, h: nh}, matrix: matrix});

    worker.addEventListener('message', function(e){
        loader.style.opacity = 0;

        var result = e.data.matrix,
            time = e.data.time;

        console.log(time, 'ms');

        var canvas_output = document.createElement('canvas'),
            ctx_output = canvas_output.getContext('2d'),
            nh, nw;

        nh = result.length;
        nw = result[0].length
    
        canvas_output.width = nw;
        canvas_output.height = nh;
    
        canvas_output.style.position = 'absolute';
        canvas_output.style.top = 0+'';
        canvas_output.style.left = 0+'';
    
        if(nh < output.clientHeight){
            canvas_output.style.top = (output.clientHeight/2 - nh/2) + 'px';
        }
        if(nw < output.clientWidth){
            canvas_output.style.left = (output.clientWidth/2 - nw/2) + 'px';
        }
    
        if(nh < output.clientHeight && nw < output.clientWidth){
            output.style.cursor = 'default';
        }
        else output.style.cursor = 'grab';
    
        if(output.lastChild) output.removeChild(output.lastChild);
    
        ctx_output.putImageData(toImageData(result), 0, 0);
    
        output.appendChild(canvas_output);

        output_size.left = output.getBoundingClientRect().x + 'px';
        output_size.top = output.getBoundingClientRect().y + 'px';
        output_size.style.opacity = 1;
        output_size.innerHTML = nw + ' x ' + nh + ' px';
    });
        


    //=======================================================
    }
}

function reshape_gray(img){
    var w = img.naturalWidth,
        h = img.naturalHeight,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        data;

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, 0, 0);

    data = ctx.getImageData(0, 0, w, h).data;
    //============================================

    var matrix=[], rgb, idx, row;

    for(var i=0; i < h; ++i){
        matrix.push([]);

        row = matrix[i];

        for(var j=0; j < w; ++j){
            rgb=[];

            idx=w * 4 * i + 4 * j;

            for(var k=idx; k < idx + 3; ++k){
                rgb.push(data[k]);
            }

            row.push(0.299 * rgb[0] + 0.587*rgb[1] + 0.114*rgb[2]);
        }
    }

    return matrix;
}

function reshape_rgb(img){
    var w = img.naturalWidth,
        h = img.naturalHeight,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        data;

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, 0, 0);

    data = ctx.getImageData(0, 0, w, h).data;
    //============================================

    var R=[], G=[], B=[], idx, row_R, row_G, row_B;

    for(var i=0; i < h; ++i){
        R.push([]); G.push([]); B.push([]);

        row_R = R[i]; row_G = G[i]; row_B = B[i];

        for(var j=0; j < w; ++j){
            rgb=[];

            idx=w * 4 * i + 4 * j;
            
            R.push(data[idx]); G.push(data[idx+1]); B.push(data[idx+2]);
        }
    }

    return [R,G,B];
}

function toImageData(m){
    var w=m[0].length, h=m.length, row,
        imgdata=document.createElement('canvas').getContext('2d').createImageData(w, h);

    if(typeof m[0][0] == 'number'){
        for(var y=0; y < h; ++y){
            row=m[y];

            for(var x=0; x < w; ++x){
                for(var k=w * 4 * y + 4 * x; k < w * 4 * y + 4 * x + 3; ++k){
                    imgdata.data[k] = row[x];
                }

                imgdata.data[w * 4 * y + 4 * x + 3]=255;
            }
        }
    }

    else{
        var col;

        for(var y=0; y < h; ++y){
            row=m[y];

            for(var x=0; x < w; ++x){  
                col=row[x];

                for(var k=w * 4 * y + 4 * x, c=0; k < w * 4 * y + 4 * x + 3; ++k, ++c){
                    imgdata.data[k] = col[c];
                }

                imgdata.data[w * 4 * y + 4 * x + 3]=255;
            }
        }
    }

    return imgdata;
}

var default_factor = 3;

type.addEventListener('change', function(){
    update_result();
});

factor.addEventListener('change', function(){
    if(this.value == ''){
        this.value = default_factor;
    }
    else{
        default_factor = this.value;

        update_result();
    }
});

if(factor.value == ''){
    document.getElementById('open-btn').style.pointerEvents = 'none'
}
else{
    document.getElementById('open-btn').style.pointerEvents = 'auto';
}

['resize','fullscreenchange'].forEach(e=>{
//============================================

window.addEventListener(e, function(){
    sw = window.innerWidth,
    sh = window.innerHeight;

    subwrapper.style.height = (sh - 50) + 'px';

    if(sh > sw){
        subwrapper.style.flexDirection = 'column';

        input.style.width = '100%';
        output.style.width = '100%';
    
        input.style.height = '50%';
        output.style.height = '50%';
    }

    else {
        subwrapper.style.flexDirection = 'row';

        input.style.width = '50%';
        output.style.width = '50%';
    
        input.style.height = '100%';
        output.style.height = '100%';
    }

    var canvas_input = input.getElementsByTagName('canvas')[0],
        canvas_output = output.getElementsByTagName('canvas')[0];

    if(canvas_input){
        canvas_input.style.top = 0;
        canvas_input.style.left = 0;

        if(canvas_input.height < input.clientHeight){
            canvas_input.style.top = (input.clientHeight/2 - canvas_input.height/2) + 'px';
        }
        if(canvas_input.width < input.clientWidth){
            canvas_input.style.left = (input.clientWidth/2 - canvas_input.width/2) + 'px';
        }

        if(canvas_input.height < input.clientHeight && canvas_input.width < input.clientWidth){
            input.style.cursor = 'default';
        }
        else input.style.cursor = 'grab';

        input_size.left = input.getBoundingClientRect().x + 'px';
        input_size.top = input.getBoundingClientRect().y + 'px';
        input_size.style.opacity = 1;
        input_size.innerHTML = canvas_input.width + ' x ' + canvas_input.height + ' px';
    }

    if(canvas_output){
        canvas_output.style.top = 0;
        canvas_output.style.left = 0;

        if(canvas_output.height < output.clientHeight){
            canvas_output.style.top = (output.clientHeight/2 - canvas_output.height/2) + 'px';
        }
        if(canvas_output.width < output.clientWidth){
            canvas_output.style.left = (output.clientWidth/2 - canvas_output.width/2) + 'px';
        }

        if(canvas_output.height < output.clientHeight && canvas_output.width < output.clientWidth){
            output.style.cursor = 'default';
        }
        else output.style.cursor = 'grab';

        output_size.left = output.getBoundingClientRect().x + 'px';
        output_size.top = output.getBoundingClientRect().y + 'px';
        output_size.style.opacity = 1;
        output_size.innerHTML = canvas_output.width + ' x ' + canvas_output.height + ' px';
    }
});

//============================================
});