/**
 * Created by bear on 3/16/15.
 */

//-------------------------------------------------------
// Global variables

var x_extent=[-1.0,1.0];
var y_extent=[-1.0,1.0];
var myGrid;
var color_func = rainbow_colormap;
var g_scalar_func = gaussian;
var g_res = $("#image_res").val();
var g_data;
g_data = new Array(g_res);
for(var i = 0; i < g_res; ++i) {
    g_data[i] = new Array(g_res);
}

function init() {
    var canvas = $("#main canvas");
    var dy = canvas.height()/g_res;
    dy = Math.ceil(dy);
    var height = dy*g_res;
    var width = dy*g_res;
    var dx = dy;
    var pt = new Array(2);
    var scalar_func = g_scalar_func;
    for(var y = 0; y < g_res; ++y) {
        for(var x = 0; x <g_res; ++x) {
            pt[0] = x*dx;
            pt[1] = y*dy;
            g_data[y][x] = scalar_func(pixel2pt(width-dx,height-dy,x_extent,y_extent,x*dx,y*dy));
        }
    }
}

/* document ready */
$(function () {
    $("#main canvas").css("width", $("#main canvas").height()+"px");
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    // Draw the grid if necessary
    init();
    render();
});

$("#main button").click(function() {
    render();
});

$("#rainbow").click(function() {
    color_func = rainbow_colormap;
    render();
});

$("#greyscale").click(function() {
    color_func = greyscale_map;
    render();
});

$("#equal_size").on("click", function () {
    if(this.checked) {
        $("#main canvas").css("width", $("#main canvas").height()+"px");
    } else {
        $("#main canvas").css("width", "100%");
    }
});

$("#gaussian").on("click", function() {
    g_scalar_func = gaussian;
    init();
    render();
});

$("#sine").on("click", function() {
    g_scalar_func = sine;
    init();
    render();
});

function render(){
    if($("#image_res").val() != g_res) {
        g_res = $("#image_res").val();
    }
    myGrid = new UGrid2D([x_extent[0],y_extent[0]],  [x_extent[1],y_extent[1]], parseFloat(g_res));
    var canvas = $("#main canvas");
    dy = canvas.height()/g_res;
    dy = Math.ceil(dy);
    var dx = dy;
    if (! canvas) {
        console.log(' Failed to retrieve the < canvas > element');
        return false;
    }
    else {
        console.log(' Got < canvas > element ');
    }

// Get the rendering context for 2DCG <- (2)
    var ctx = canvas[0].getContext('2d');
    ctx.canvas.height = dy*g_res;
    ctx.canvas.width = dy*g_res;
    $("#main canvas").css("height", dy*g_res+"px");
    $("#main canvas").css("width", dy*g_res+"px");
// Draw the scalar data using an image rpresentation
    var imgData=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);

    // Choose the scalar function
    var scalar_func = g_scalar_func;

//Determine the data range...useful for the color mapping
    var mn = scalar_func(pixel2pt(ctx.canvas.width,ctx.canvas.height,x_extent,y_extent,0,0));
    var mx = mn;
    for (var y=0;y<g_res;y++)
        for (var x=0;x<g_res;x++)
        {
            var fval = scalar_func(pixel2pt(ctx.canvas.width-dx,ctx.canvas.height-dy,x_extent,y_extent,x*dx,y*dy));
            if (fval < mn)
                mn=fval;
            if (fval>mx)
                mx=fval;
        }

//Color the domain according to the scalar value
    for (var y=0;y<g_res;y++)
        for (var x=0;x<g_res;x++)
        {
            var fval = scalar_func(pixel2pt(ctx.canvas.width-dx,ctx.canvas.height-dy,x_extent,y_extent,x*dx,y*dy));
            console.log("y ", y, "x ", x, "f", fval);
            var color = color_func(fval,mn,mx);
            for(var iy = 0; iy < dy; ++iy) {
                for(var ix = 0; ix < dx; ++ix) {
                    i = ((y*dy+iy)*(g_res*dx) + x*dx+ix)*4;

                    imgData.data[i]=color[0];
                    imgData.data[i+1]= color[1];
                    imgData.data[i+2]= color[2];
                    imgData.data[i+3]= color[3];
                }
            }

        }

    ctx.putImageData(imgData,0,0);
    var val = $("#contour").val();
    if(val) {
        var vals = val.split(" ");
        for(var i = 0; i < vals.length; ++i) {
            contour(ctx, parseFloat(vals[i]));
        }
    }
    $("#info").text(" Width: "+ctx.canvas.width+" Height: "+ctx.canvas.height+" Res: "+g_res+" d: "+dx);
}

function contour(ctx, val) {
    var code;
    var nx = g_res;
    var ny = g_res;
    var dx = ctx.canvas.width/nx;
    var dy = ctx.canvas.height/ny;
    for (var y=0;y<ny-1;y++)
        for (var x=0;x<nx-1;x++) {
            code = lookup_table(x, y, val);
            draw_contour(ctx, x*dx, y*dy, dx, dy, code);
        }
}

function lookup_table(x, y, val) {
    var code = 0;
    if(g_data[y][x] > val) {
        code |= 8;
    }
    if(g_data[y][x+1] > val) {
        code |= 4;
    }
    if(g_data[y+1][x+1] > val) {
        code |= 2;
    }
    if(g_data[y+1][x] > val) {
        code |= 1;
    }
    if(code == 5 && g_data[y][x]+g_data[y][x+1]+g_data[y+1][x+1]+g_data[y+1][x]<4*val) {
        code = 10;
    }
    if(code == 10 && g_data[y][x]+g_data[y][x+1]+g_data[y+1][x+1]+g_data[y+1][x]<4*val) {
        code = 5;
    }
    console.log("y", y, "x ", x, "val ", val, "code ", code);
    console.log(g_data[y][x]+" "+g_data[y][x+1]+" "+g_data[y+1][x+1]+" "+g_data[y+1][x]);
    return code;
}

function draw_contour(ctx, x, y, dx, dy, code) {
    var px, py, px1, py1;
    x += .5*dx;
    y += .5*dy;
    switch(code) {
        case 0:
        case 15:
            return;
        case 1:
        case 14:
            px = x; py = y+.5*dy; px1 = x+.5*dx; py1 = y+dy;
            break;
        case 2:
        case 13:
            px = x+.5*dx; py = y+dy; px1 = x+dx; py1 = y+.5*dy;
            break;
        case 3:
        case 12:
            px = x; py = y+.5*dy; px1 = x+dx; py1 = y+.5*dx;
            break;
        case 4:
        case 11:
            px = x+.5*dx; py = y; px1 = x+dx; py1 = y+.5*dy;
            break;
        case 5:
        case 10:
            break;
        case 6:
        case 9:
            px = x+.5*dx; py = y; px1 = x+.5*dx; py1 = y+dy;
            break;
        case 7:
        case 8:
            px = x; py = y+.5*dy; px1 = x+.5*dx; py1 = y;
            break;

    }
    ctx.beginPath();
    ctx.beginPath();
    if(code == 5) {
        ctx.moveTo(x, y +.5*dy);
        ctx.lineTo(x +.5*dx, y);
        ctx.moveTo(x +.5*dx, y+dy);
        ctx.lineTo(x+dx, y +.5*dy);
    } else if (code == 10) {
        ctx.moveTo(x, y +.5*dy);
        ctx.lineTo(x +.5*dx, y+dy);
        ctx.moveTo(x +.5*dx, y);
        ctx.lineTo(x+dx, y +.5*dy);
    } else {
        ctx.moveTo(px, py);
        ctx.lineTo(px1, py1);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}

//--------------------------------------------------------
// Map a point in pixel coordinates to the 2D function domain
function pixel2pt(width,height,x_extent,y_extent, p_x,p_y){
    var pt = [.0, .0];
    xlen=x_extent[1]-x_extent[0];
    ylen=y_extent[1]-y_extent[0];
    pt[0]=(p_x/width)*xlen + x_extent[0];
    pt[1]=(p_y/height)*ylen + y_extent[0];
    return pt;
}

//--------------------------------------------------------
// Map a point in domain coordinates to pixel coordinates
function pt2pixel(width,height,x_extent,y_extent, p_x,p_y){
    var pt = [0,0];

    var xlen = (p_x-x_extent[0])/(x_extent[1]-x_extent[0]);
    var ylen = (p_y-y_extent[0])/(y_extent[1]-y_extent[0]);

    pt[0]=Math.round(xlen*width);
    pt[1]=Math.round(ylen*height);
    return pt;
}

//--------------------------------------------------------
//A simple Gaussian function
function gaussian(pt){
    return Math.exp(-(pt[0]*pt[0]+pt[1]*pt[1]));
}

function sine(pt) {
    return Math.sin(pt[0]*pt[1]);
}

//--------------------------------------------------------
//The infamous rainbow color map, normalized to the data range
function rainbow_colormap(fval,fmin,fmax){
    var dx=0.8;
    var fval_nrm = (fval-fmin)/(fmax-fmin);
    var g = (6.0-2.0*dx)*fval_nrm +dx;
    var R = Math.max(0.0,(3.0-Math.abs(g-4.0)-Math.abs(g-5.0))/2.0 )*255;
    var G = Math.max(0.0,(4.0-Math.abs(g-2.0)-Math.abs(g-4.0))/2.0 )*255;
    var B = Math.max(0.0,(3.0-Math.abs(g-1.0)-Math.abs(g-2.0))/2.0 )*255;
    color = [Math.round(R),Math.round(G),Math.round(B),255];
    return color;
}

//--------------------------------------------------------
//

function greyscale_map(fval,fmin,fmax){
    var c=255*((fval-fmin)/(fmax-fmin));
    var color = [Math.round(c),Math.round(c),Math.round(c),255];
    return color;
}

//--------------------------------------------------------
// A Simple 2D Grid Class
var UGrid2D = function(min_corner,max_corner,resolution){
    this.min_corner=min_corner;
    this.max_corner=max_corner;
    this.resolution=resolution;
    console.log('UGrid2D instance created');
}

//End UGrid2D--------------------------------------------