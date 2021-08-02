var inter={
    linear: function(v, l){
        var n = v.length,
            step = n / l,
            result = [],
            x, i, j, w1, w2,
            lim = n - 1 - 1.19e-07;

        for(var k=0; k < l; ++k){
            x = (k + 0.5)*step - 0.5;

            x = x < 0 ? 0 : x;
            x = x > lim ? lim : x;

            i = Math.floor(x);
            j = i + 1;

            w1 = j - x;
            w2 = 1 - w1;

            result.push(v[i]*w1 + v[j]*w2);
        }

        return result;
    },

    cubic: function(v,l){
        var n = v.length,
            step = n / l,
            result = [],
            x, i, j, t, y0, y1, m0, m1, a, b, c, d,
            u, extra_pt;

        extra_pt = v[0]*2 - v[1];

        // u = [extra_pt*2 - v[0], extra_pt];
        u = [v[0], v[0]];

        for(var k=0; k < n; ++k) u.push(v[k]);

        extra_pt = v[n-1]*2 - v[n-2];

        // u.push(extra_pt, extra_pt*2 - v[n-1]);
        u.push(v[n-1], v[n-1]);


        for(var k=0; k < l; ++k){
            x = (k + 0.5)*step + 1.5;

            i = Math.floor(x);
            j = i + 1;

            t = 1 - (j - x);

            y0 = u[i];
            y1 = u[j]
            m0 = (u[j] - u[i-1]) / 2;
            m1 = (u[j+1] - u[i]) / 2

            a = 2*y0 - 2*y1 + m0 + m1;
            b = -3*y0 + 3*y1 - 2*m0 - m1;
            c = m0;
            d = y0;

            result.push( a*Math.pow(t,3) + b*Math.pow(t,2) + c*t + d );
        }

        return result;
        
    },

    bilinear: function(m, nh, nw){
        var h = m.length,
            result = [],
            rows = [],
            col, new_col;

        result = this.zeros2d(nh, nw);

        for(var k=0; k < h; ++k){
            rows.push( this.linear( m[k], nw ) );
        }

        for(var k=0; k < nw; ++k){
            col = [];

            for(var j=0; j < h; ++j) col.push(rows[j][k]);

            new_col = this.linear(col, nh);

            for(var j=0; j < nh; ++j){
                result[j][k] = new_col[j];
            }
        }

        return result;
    },

    bicubic: function(m, nh, nw){
        var h = m.length,
            result = [],
            rows = [],
            col, new_col;

        result = this.zeros2d(nh, nw);

        for(var k=0; k < h; ++k){
            rows.push( this.cubic( m[k], nw ) );
        }

        for(var k=0; k < nw; ++k){
            col = [];

            for(var j=0; j < h; ++j) col.push(rows[j][k]);

            new_col = this.cubic(col, nh);

            for(var j=0; j < nh; ++j){
                result[j][k] = new_col[j];
            }
        }

        return result;
    },

    zeros2d: function(h,w){
        var result = [];

        for(var k=0; k < h; ++k){
            result.push([]);
            row = result[k];

            for(var j=0; j < w; ++j){
                row.push(0);
            }
        }

        return result;
    }
}

var open = document.getElementById('open');

open.addEventListener('change', function(){
    var file = this.files[0],
        reader = new FileReader();

    reader.readAsDataURL(file);

    reader.addEventListener('load', function(){
        var img = new Image();

        img.addEventListener('load', function(){
            var matrix = reshape_gray(this),
                w = matrix[0].length, h=matrix.length,
                canvas_input = document.createElement('canvas'),
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d'),
                ctx_input = canvas_input.getContext('2d'),
                nw, nh, result, start, end;

            nw = parseInt(w*parseFloat(factor.value)); nh =parseInt(h*parseFloat(factor.value));

            canvas_input.width = w;
            canvas_input.height = h;

            canvas.width = nw;
            canvas.height = nh;

            start = Date.now();

            if(type.value == 'linear') result = inter.bilinear(matrix, nh, nw);
            else if(type.value == 'cubic') result = inter.bicubic(matrix, nh, nw);

            // result = inter.bicubic(matrix, nh, nw);

            ctx.putImageData(toImageData(result), 0, 0);

            ctx_input.drawImage(this, 0, 0);

            end = Date.now();

            console.log(end - start, 'ms');


            canvas_input.style.position = 'absolute';
            canvas_input.style.top = 0+'';
            canvas_input.style.left = 0+'';

            if(h < input.clientHeight){
                canvas_input.style.top = (input.clientHeight/2 - h/2) + 'px';
            }
            if(w < input.clientWidth){
                canvas_input.style.left = (input.clientWidth/2 - w/2) + 'px';
            }

            input.appendChild(canvas_input);
            //=================================================================

            canvas.style.position = 'absolute';
            canvas.style.top = 0+'';
            canvas.style.left = 0+'';

            if(nh < output.clientHeight){
                canvas.style.top = (output.clientHeight/2 - nh/2) + 'px';
            }
            if(nw < output.clientWidth){
                canvas.style.left = (output.clientWidth/2 - nw/2) + 'px';
            }

            if(output.lastChild) output.removeChild(output.lastChild);

            output.appendChild(canvas);
        });
        
        img.src = this.result;
    });
});

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

var m = [
    [3, 5],
    [2, 9]
];

var v = [3,5,2,9];

// console.log(inter.linear(v, 10));

// console.log(inter.cubic(v, 10));

// console.log(inter.bilinear(m, 5, 5));

// console.log(inter.bicubic(m, 5, 5));


var input = document.getElementById('input'),
    output = document.getElementById('output'),
    type = document.getElementById('type'),
    factor = document.getElementById('factor');

type.addEventListener('change', function(){

});

factor.addEventListener('change', function(){
    if(this.value == ''){
        document.getElementById('open-btn').style.pointerEvents = 'none'
    }
    else{
        document.getElementById('open-btn').style.pointerEvents = 'auto';
    }
});

if(factor.value == ''){
    document.getElementById('open-btn').style.pointerEvents = 'none'
}
else{
    document.getElementById('open-btn').style.pointerEvents = 'auto';
}