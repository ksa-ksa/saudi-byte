'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp'),{minify}=require('terser');
const crops=[
  {
    "name": "crop-01",
    "source": "home-desktop.png.png",
    "sx": 502.4390243902439,
    "sy": 1325.7142857142858,
    "px": 49.84848484848485,
    "py": 0.34965034965034963
  },
  {
    "name": "crop-02",
    "source": "home-desktop.png.png",
    "sx": 132.79613215149072,
    "sy": 175.42533081285444,
    "px": 0,
    "py": 21.05263157894737
  },
  {
    "name": "crop-03",
    "source": "home-desktop.png.png",
    "sx": 998.7878787878788,
    "sy": 631.2925170068028,
    "px": 57.855697909642615,
    "py": 80.02560819462228
  },
  {
    "name": "crop-04",
    "source": "home-desktop.png.png",
    "sx": 1307.936507936508,
    "sy": 754.4715447154472,
    "px": 29.7634691195795,
    "py": 78.88198757763975
  },
  {
    "name": "crop-05",
    "source": "home-desktop.png.png",
    "sx": 1136.551724137931,
    "sy": 606.5359477124183,
    "px": 2.6613439787092483,
    "py": 80.12903225806451
  },
  {
    "name": "crop-06",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 11.912943871706759
  },
  {
    "name": "crop-07",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 19.564719358533793
  },
  {
    "name": "crop-08",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 27.216494845360824
  },
  {
    "name": "crop-09",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 34.868270332187855
  },
  {
    "name": "crop-10",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 42.52004581901489
  },
  {
    "name": "crop-11",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 50.171821305841924
  },
  {
    "name": "crop-12",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 57.82359679266895
  },
  {
    "name": "crop-13",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 65.47537227949599
  },
  {
    "name": "crop-14",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 73.12714776632302
  },
  {
    "name": "crop-15",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 80.77892325315005
  },
  {
    "name": "crop-16",
    "source": "home-desktop.png.png",
    "sx": 2388.4057971014495,
    "sy": 1687.2727272727273,
    "px": 97.72007599746675,
    "py": 88.43069873997709
  },
  {
    "name": "crop-17",
    "source": "home-mobile.png.png",
    "sx": 107.48129675810473,
    "sy": 386.0169491525424,
    "px": 50,
    "py": 16.444444444444443
  },
  {
    "name": "crop-18",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2846.875,
    "px": 12.4031007751938,
    "py": 44.141069397042095
  },
  {
    "name": "crop-19",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2679.4117647058824,
    "px": 37.46770025839793,
    "py": 44.013683010262255
  },
  {
    "name": "crop-20",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2530.5555555555557,
    "px": 63.049095607235145,
    "py": 44.114285714285714
  },
  {
    "name": "crop-21",
    "source": "home-mobile.png.png",
    "sx": 957.7777777777778,
    "sy": 2530.5555555555557,
    "px": 88.08290155440415,
    "py": 44
  },
  {
    "name": "crop-22",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2602.8571428571427,
    "px": 12.4031007751938,
    "py": 54.45205479452055
  },
  {
    "name": "crop-23",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2530.5555555555557,
    "px": 37.72609819121447,
    "py": 54.4
  },
  {
    "name": "crop-24",
    "source": "home-mobile.png.png",
    "sx": 936.9565217391304,
    "sy": 2462.162162162162,
    "px": 63.116883116883116,
    "py": 54.34782608695652
  },
  {
    "name": "crop-25",
    "source": "home-mobile.png.png",
    "sx": 979.5454545454545,
    "sy": 2462.162162162162,
    "px": 88.11369509043928,
    "py": 54.34782608695652
  },
  {
    "name": "crop-26",
    "source": "home-mobile.png.png",
    "sx": 463.44086021505376,
    "sy": 1423.4375,
    "px": 6.804733727810651,
    "py": 70.83825265643448
  },
  {
    "name": "crop-27",
    "source": "home-mobile.png.png",
    "sx": 468.4782608695652,
    "sy": 1423.4375,
    "px": 35.693215339233035,
    "py": 70.83825265643448
  },
  {
    "name": "crop-28",
    "source": "home-mobile.png.png",
    "sx": 468.4782608695652,
    "sy": 1423.4375,
    "px": 64.30678466076697,
    "py": 70.83825265643448
  },
  {
    "name": "crop-29",
    "source": "home-mobile.png.png",
    "sx": 468.4782608695652,
    "sy": 1423.4375,
    "px": 92.92035398230088,
    "py": 70.83825265643448
  },
  {
    "name": "crop-30",
    "source": "home-desktop.png.png",
    "sx": 505.52147239263803,
    "sy": 1521.311475409836,
    "px": 49.92435703479576,
    "py": 0.5767012687427913
  },
  {
    "name": "crop-31",
    "source": "home-desktop.png.png",
    "sx": 1136.551724137931,
    "sy": 677.3722627737226,
    "px": 57.884231536926144,
    "py": 79.64601769911505
  },
  {
    "name": "crop-32",
    "source": "home-desktop.png.png",
    "sx": 1511.926605504587,
    "sy": 867.2897196261681,
    "px": 30.01949317738791,
    "py": 77.58830694275274
  },
  {
    "name": "crop-33",
    "source": "home-desktop.png.png",
    "sx": 1287.5,
    "sy": 622.8187919463087,
    "px": 3.1578947368421053,
    "py": 80.61617458279846
  },
  {
    "name": "crop-34",
    "source": "home-desktop.png.png",
    "sx": 132.79613215149072,
    "sy": 175.42533081285444,
    "px": 0,
    "py": 21.052631578947366
  },
  {
    "name": "crop-35",
    "source": "home-desktop.png.png",
    "sx": 232.11267605633802,
    "sy": 175.42533081285444,
    "px": 0,
    "py": 21.052631578947366
  },
  {
    "name": "crop-36",
    "source": "home-mobile.png.png",
    "sx": 1215.1898734177216,
    "sy": 2785.714285714286,
    "px": 13.166855845629966,
    "py": 46.609042553191486
  },
  {
    "name": "crop-37",
    "source": "home-mobile.png.png",
    "sx": 1215.1898734177216,
    "sy": 2689.655172413793,
    "px": 38.47900113507378,
    "py": 46.53794940079894
  },
  {
    "name": "crop-38",
    "source": "home-mobile.png.png",
    "sx": 1215.1898734177216,
    "sy": 2400,
    "px": 62.99659477866061,
    "py": 46.48829431438127
  },
  {
    "name": "crop-39",
    "source": "home-mobile.png.png",
    "sx": 1371.4285714285713,
    "sy": 2516.1290322580644,
    "px": 87.41573033707866,
    "py": 46.52870493991989
  },
  {
    "name": "crop-40",
    "source": "home-mobile.png.png",
    "sx": 1315.0684931506848,
    "sy": 2363.6363636363635,
    "px": 13.303269447576099,
    "py": 56.89424364123159
  },
  {
    "name": "crop-41",
    "source": "home-mobile.png.png",
    "sx": 1280,
    "sy": 2363.6363636363635,
    "px": 38.079096045197744,
    "py": 56.760374832663985
  },
  {
    "name": "crop-42",
    "source": "home-mobile.png.png",
    "sx": 1280,
    "sy": 2363.6363636363635,
    "px": 62.82485875706215,
    "py": 56.89424364123159
  },
  {
    "name": "crop-43",
    "source": "home-mobile.png.png",
    "sx": 1500,
    "sy": 2400,
    "px": 87.05357142857143,
    "py": 56.85618729096989
  },
  {
    "name": "crop-44",
    "source": "home-mobile.png.png",
    "sx": 480,
    "sy": 1529.4117647058824,
    "px": 7.105263157894736,
    "py": 74.2798353909465
  },
  {
    "name": "crop-45",
    "source": "home-mobile.png.png",
    "sx": 477.6119402985074,
    "sy": 1529.4117647058824,
    "px": 35.83662714097497,
    "py": 74.2798353909465
  },
  {
    "name": "crop-46",
    "source": "home-mobile.png.png",
    "sx": 482.4120603015075,
    "sy": 1529.4117647058824,
    "px": 64.38896189224704,
    "py": 74.2798353909465
  },
  {
    "name": "crop-47",
    "source": "home-mobile.png.png",
    "sx": 480,
    "sy": 1529.4117647058824,
    "px": 92.89473684210526,
    "py": 74.2798353909465
  }
];
const root=path.resolve(__dirname,'..'),out=path.join(root,'public'),dir=path.join(out,'assets','sb-opt-v1');
async function main(){
 await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
 for(const name of ['index.html','ai-assistant.html','SAUDI-BYTE-PC-Care-Beta-Setup.exe','manifest.webmanifest','offline.html','robots.txt','sitemap.xml','sw.js','assets'])await fs.cp(path.join(root,name),path.join(out,name),{recursive:true});
 await fs.mkdir(dir,{recursive:true});
 let total=0;const dims={};
 for(const crop of crops){const input=path.join(root,'assets',crop.source);const meta=dims[input]??=await sharp(input).metadata();const width=Math.min(meta.width,Math.max(1,Math.round(meta.width*100/crop.sx))),height=Math.min(meta.height,Math.max(1,Math.round(meta.height*100/crop.sy)));const left=Math.max(0,Math.min(meta.width-width,Math.round((meta.width-width)*crop.px/100))),top=Math.max(0,Math.min(meta.height-height,Math.round((meta.height-height)*crop.py/100)));const result=await sharp(input).extract({left,top,width,height}).webp({quality:86,effort:5}).toFile(path.join(dir,crop.name+'.webp'));total+=result.size;console.log(crop.name,width+'x'+height,result.size+' bytes');}
 const css=await Promise.all(['sb-companion.css','sb-anime-watch.css','sb-cinematic-home.css'].map(name=>fs.readFile(path.join(root,'assets',name),'utf8')));await fs.writeFile(path.join(dir,'ui.css'),css.join('\n'));
 for(const [src,dest] of [['requirements941-app.js','main.js'],['sb-anime-watch.js','anime.js']]){const input=await fs.readFile(path.join(root,'assets',src),'utf8');const result=await minify(input,{compress:false,mangle:false,format:{comments:false}});if(!result.code)throw Error('Empty '+dest);await fs.writeFile(path.join(dir,dest),result.code);console.log(dest,Buffer.byteLength(input),'->',Buffer.byteLength(result.code));}
 console.log('SB optimized crops',crops.length,'total bytes',total);
}
main().catch(e=>{console.error(e);process.exitCode=1});
