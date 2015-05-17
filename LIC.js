/**
 * Created by bear on 3/16/15.
 */

var g_x_extent=[-1.0,1.0];
var g_y_extent=[-1.0,1.0];
var g_scalar_func;
var g_color_func;
var g_width = 600;
var g_height = 600;
var g_data_noise = new Array(g_height);


for(var g_i = 0; g_i < g_height; ++g_i) {
    g_data_noise[g_i] = new Array(g_width);
}

$(function() {
    /*$("#main canvas").css("width", $("#main canvas").height()+"px");
    $("#main canvas").css("width", "600px");
    $("#main canvas").css("height", "600px");*/
    g_color_func = greyscale_map;
    init();
    apply(10);
    render();
});

$("#main button").on("click", function() {
    var L = $("#image_res").val();
    apply(L);
    render();
});

function init() {
    for (var y=0; y<g_height; y++)
        for (var x=0; x<g_width; x++) {
            g_data_noise[y][x] = 2*Math.random()-1;
        }
}

function apply(L) {
    var temp = new Array(g_height);
    for(var i = 0; i < g_height; ++i) {
        temp[i] = new Array(g_width);
    }
    for (var y=0; y<g_height; y++) {
        for (var x = 0; x < g_width; x++) {
            temp[y][x] = g_data_noise[y][x];
        }
    }
    for (var y=0; y< g_height; y++) {
        for (var x=0; x < g_width; x++) {
            temp[y][x] = Tp(pixel2pt(g_width - 1, g_height - 1, g_x_extent, g_y_extent, x, y), L);
            //g_data_noise[y][x] = 0;
        }
    }
    g_data_noise = temp;
}

function render() {
    //console.log(" "+g_data_noise[149][199]+" "+g_data_noise[150][199]+" "+g_data_noise[299][199]);
    var $canvas = $("#main canvas");
    var canvas = document.getElementById('can');
    var ctx = canvas.getContext('2d');
    ctx.canvas.height = g_height;
    ctx.canvas.width  = g_width;
    var imgData = ctx.getImageData(0, 0, g_width, g_height);

    var mn = g_data_noise[0][0];
    var mx = mn;
    var fval, i;
    for (var y=0; y<g_height; y++)
        for (var x=0; x<g_width; x++) {
            fval = g_data_noise[y][x];
            if (fval < mn)
                mn=fval;
            if (fval>mx)
                mx=fval;
        }

//Color the domain according to the scalar value
    for (y=0; y<g_height; y++)
        for (x=0; x<g_width; x++) {
            fval = g_data_noise[y][x];
            var color = g_color_func(fval,mn,mx);
            i = (y*g_width + x)*4;
            imgData.data[i]=color[0];
            imgData.data[i+1]= color[1];
            imgData.data[i+2]= color[2];
            imgData.data[i+3]= color[3];
        } // end for

    ctx.putImageData(imgData,0,0);
}

function pixel2pt(width, height, x_extent, y_extent, p_x, p_y){
    var pt = [.0, .0];
    xlen=x_extent[1]-x_extent[0];
    ylen=y_extent[1]-y_extent[0];
    pt[0]=(p_x/g_width)*xlen + x_extent[0];
    pt[1]=(p_y/g_height)*ylen + y_extent[0];
    if(pt[0] < -1) pt[0] = -1;
    if(pt[0] > 1) pt[0] = 1;
    if(pt[1] < -1) pt[1] = -1;
    if(pt[1] >= 1) pt[1] = 1;
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
    if(pt[0] < 0) pt[0] = 0;
    if(pt[0] >= g_width) pt[0] = g_width-1;
    if(pt[1] < 0) pt[1] = 0;
    if(pt[1] >= g_width) pt[1] = g_width-1;
    return pt;
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

function euler_integration(pt,l,steps,get_vector)
{
    var ln=[[pt[0],pt[1]]];
    for(i=0;i<steps;i++)
    {
        v = get_vector(ln[i]);
        var t = l/Math.sqrt(v[0]*v[0]+v[1]*v[1]);
        ln.push([ln[i][0]+t*v[0],ln[i][1]+t*v[1]]);
        //console.log(pt[0]+" "+pt[1]+" "+ln[i+1][0]+" "+ln[i+1][1]);
    }
    ln.push(pt);
    for(i=steps+1;i<=2*steps;i++)
    {
        v = get_vector(ln[i]);
        var t = l/Math.sqrt(v[0]*v[0]+v[1]*v[1]);
        ln.push([ln[i][0]-t*v[0],ln[i][1]-t*v[1]]);
        //console.log(pt[0]+" "+pt[1]+" "+ln[i+1][0]+" "+ln[i+1][1]);
    }
    return ln;
}

function weightk(s) {
    return Math.exp(-s*s);
}

function Tp(pt, L) {
    var ds = .01;
    var sum1 = .0, sum2 = .0;
    var v = gaussian_gradient(pt);
    if(v[0] == 0 && v[1] == 0) return 0;
    var ln = euler_integration(pt, ds, L, gaussian_gradient);
    //console.log("---");
    for(var i = 0; i <= L; i++) {
        var pix = pt2pixel(g_width-1, g_height-1, g_x_extent, g_y_extent, ln[i][0], ln[i][1]);
        //console.log("pix "+pix[1]+" "+pix[0]+" "+g_data_noise[pix[1]][pix[0]]+" "+sum1);
        if(pix[1]<0 || pix[1]>=600 || pix[0]<0 || pix[1]>=600 || isNaN(pix[0]) || isNaN(pix[1])) {
        } else {
            sum1 += g_data_noise[pix[1]][pix[0]]*weightk(ds*i)*ds;
            sum2 += weightk(ds*i)*ds;
        }
    }
    //console.log("===");
    for(i = 1; i <= L; i++) {
        pix = pt2pixel(g_width-1, g_height-1, g_x_extent, g_y_extent, ln[L+1+i][0], ln[L+1+i][1]);
        if(pix[1]<0 || pix[1]>=600 || pix[0]<0 || pix[1]>=600) {

        } else {
            //console.log("pix "+pix[1]+" "+pix[0]+" "+g_data_noise[pix[1]][pix[0]]);
            sum1 += g_data_noise[pix[1]][pix[0]]*weightk(ds*i)*ds;
            sum2 += weightk(ds*i)*ds;
        }
        //console.log("pix "+pix[1]+" "+pix[0]+"i "+i+"k "+weightk(ds*i)+"sum1"+sum1+"sum2 "+sum2);
    }
    //console.log(sum1);
    return sum1/sum2;
}

// Gaussian ------------------------------------------------
function gaussian(pt) {
    return Math.exp(-(pt[0]*pt[0]+pt[1]*pt[1]));
}

function gaussian_gradient(pt){
    var dx = -2*pt[0]*gaussian(pt);
    var dy = -2*pt[1]*gaussian(pt);
    return [dx,dy];
}