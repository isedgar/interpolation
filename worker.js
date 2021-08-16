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
            x, i, j, t, y0, y1, m0, m1, a, b, c, d, u;


        u = [v[0], v[0]];

        for(var k=0; k < n; ++k) u.push(v[k]);

        u.push(v[n-1], v[n-1]);


        for(var k=0; k < l; ++k){
            x = (k + 0.5)*step + 1.5;

            i = Math.floor(x);
            j = i + 1;

            t = 1 - (j - x);

            y0 = u[i];
            y1 = u[j];
            m0 = (u[j] - u[i-1]) / 2;
            m1 = (u[j+1] - u[i]) / 2;

            a = 2*y0 - 2*y1 + m0 + m1;
            b = -3*y0 + 3*y1 - 2*m0 - m1;
            c = m0;
            d = y0;

            result.push( a*Math.pow(t,3) + b*Math.pow(t,2) + c*t + d );
        }

        return result;
        
    },

    lanczos: function(v, l, a){
        a = a == undefined ? 4 : a; // determines the size of the kernel: a * 2

        var n = v.length,
            step = n / l,
            result = [],
            j, x, xf, y; // xf: x_floor

        for(var dx = 0; dx < l; ++dx){
            x = (dx + 0.5)*step - 0.5;
            xf = Math.floor(x);

            y = 0;

            for(var i = xf-a+1; i < xf+a+1; ++i){
                j = i;

                if(i < 0) j = 0;
                else if(i > n-1) j = n-1;

                y += v[j] * this.lanczos_kernel(x - i, a);
            }

            result.push(y);
        }

        return result;
    },

    lanczos_kernel: function(x, a){
        if(x == 0) return 1;
        else if(x >= -a && x < a){
            return (a*Math.sin(Math.PI*x)*Math.sin(Math.PI*x/a)) / (Math.pow(Math.PI,2)*Math.pow(x,2));
        }
        else return 0;
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

    bilanczos: function(m, nh, nw, a){
        a = a == undefined ? 4 : a; // determines the size of the kernel: a * 2

        var h = m.length,
            result = [],
            rows = [],
            col, new_col;

        result = this.zeros2d(nh, nw);

        for(var k=0; k < h; ++k){
            rows.push( this.lanczos( m[k], nw, a ) );
        }

        for(var k=0; k < nw; ++k){
            col = [];

            for(var j=0; j < h; ++j) col.push(rows[j][k]);

            new_col = this.lanczos(col, nh, a);

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
    },

    matrix: null
}

self.addEventListener('message', function(e){
    var data = e.data, result, start_time, end_time;

    start_time = Date.now();
        
    if(data.type == 'linear') result = inter.bilinear(data.matrix, data.size.h, data.size.w);
    else if(data.type == 'cubic') result = inter.bicubic(data.matrix, data.size.h, data.size.w);
    else if(data.type == 'lanczos') result = inter.bilanczos(data.matrix, data.size.h, data.size.w);

    end_time = Date.now();

    self.postMessage({matrix: result, time: end_time - start_time});
});