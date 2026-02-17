import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import cluster        from "cluster";
if (!cluster.isPrimary) {console.tmpLog = console.log;console.log = function(){};process.removeAllListeners('warning');}
console.log('Importing modules...');
import {performance}  from "perf_hooks";
import https          from "https";
import http           from "http";
import url            from "url";
import path           from "path";
import fs             from "fs";
import {publicIpv4}   from "public-ip";
import util           from "util";
import jwt            from "jsonwebtoken";
import crypto         from "crypto";
import zlib           from "zlib";
import {IncomingForm} from "formidable";
import request        from "request";
import {lookpath}     from "lookpath";
import child_process  from "child_process";
import process        from "process";
import QRCode         from "qrcode";
import * as OTPAuth   from "otpauth";
import deasync        from "deasync";
import base32         from "hi-base32";
import os             from "os";
import checkDiskSpace from "check-disk-space";
let    peerjs       = false;
let    websocket    = false;
try {
    peerjs = require("peer");
} catch (e) {
    console.log("* To create a PeerServer, install the peer module (npm i peer)", e);
}
try {
    websocket = require("ws");
} catch (e) {
    console.log("* To create a WebSocket Server, install the ws module (npm i ws)", e);
}
console.log('Creating environment variables...');
const __filename    = path.normalize(url.fileURLToPath(import.meta.url)),
      __dirname     = path.dirname(__filename),
      numCPUs       = os.cpus().length;
      cluster.schedulingPolicy = cluster.SCHED_RR;
var args = {};
process.argv.forEach(function (val, index, array) {
    args[index] = val;
    if (val == "-h") {
        console.log ('N.JS WEB SERVER - HELP\nUsage: node . [arguments]\nValid arguments:\n-s = Silent mode (do not log accesses)\n-l = Live Reload (automatically refresh clients on updates)\n-nil = Non Intrusive Live Reload (prompts user to refresh on updates)\n-t = Performance Timing (Time all the heavier actions made by the server)\n-nlb = No Load Balancing (disable multi-threading)\n-p = Proxy (changes the port to allow reverse proxying)');
        args = false;
    }
    if (val == "-s") {
        console.log ('Silent mode requested!');
        args.silent = true;
    }
    if (val == "-l") {
        console.log ('Live reload requested!');
        args.livereload = true;
    }
    if (val == "-nil") {
        console.log ('Non Intrusive Live reload requested!');
        args.nilivereload = true;
        args.livereload = true;
    }
    if (val == "-t") {
        console.log ('Performance timing requested!');
        args.perftimer = true;
    }
    if (val == "-nlb") {
        console.log ('Load balancing disabled!');
        args.noLoadBalancing = true;
    }
    if (val == "-p") {
        console.log ('Proxy mode requested! Port will be overrided with "22324" (http), "22325" (https).');
        args.proxymode = true;
        //* This is a sample proxy config for nginx, redirecting the NodeJS output to a NGinx served webpage.

        // server {
        //     listen 80;
        //     server_name your.server.domain;
        //     location / {
        //         proxy_set_header X-Real-IP $remote_addr;
        //         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        //         Host $http_host;
        //         proxy_set_header X-NginX-Proxy true;
        //         proxy_pass http://127.0.0.1:22324;
        //         proxy_redirect off;
        //     }
        // }
    }
});
if (!args) process.exit();
async function loadSettings() {
    var server = {
        ip: await publicIpv4(),
        port: (!!args.proxymode) ? {http: 22324, https: 22325} : {http: 80, https: 443},
        certs: {key: (fs.existsSync('./certs/key.pem') ? fs.readFileSync('./certs/key.pem') : false), cert: (fs.existsSync('./certs/cert.pem') ? fs.readFileSync('./certs/cert.pem') : false)},
        filetypes: {
            "default": "application/octet-stream",
            "html": "text/html",
            "htm": "text/html",
            "php": "text/html",
            "njs": "text/html",
            "js": "text/javascript",
            "json": "application/json",
            "css": "text/css",
            "txt": "text/plain",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "ico": "image/vnd.microsoft.icon"
        },
        protected: ["private/"],
        protectedOverrideIPs: ["::1"],
        root: "/HTML",
        tries: ["$FN", "$FN.njsc", "$FN.html", "$FN.php", "$FN.njs", "/$FN", "/$FN.njsc", "/$FN.html", "/$FN.php", "/$FN.njs", "/$FN/index.njsc", "/$FN/index.html", "/$FN/index.php", "/$FN/index.njs", "/index.njsc", "/index.html", "/index.php", "/index.njs"],
        rules: fs.existsSync('./private/server/rules.json') ? JSON.parse(fs.readFileSync('./private/server/rules.json')) : {},
        systemRoot: ((process.platform == "win32") ? process.cwd().split(path.sep)[0] : "/"),
        uploads: {
            path: false,
            destination: "uploads/",
            handler: false,
            filter: false,
            postScript: false,
            maxSize: 1024 * 1024 * 1024,
            ids: false
        },
        autoindex: {enable: false},
        headers: {},
        maxHeaderSize: 536870912,
        errors: {},
        proxy_pass: false,
        availableFunctions: {
            php: (await lookpath('php') != undefined),
            loadBalancing: !args.noLoadBalancing
        }
    };
    if (fs.existsSync('server.cfg')) server = {...server, ...(JSON.parse(fs.readFileSync('server.cfg')))};
    if (!!server.rules.hosts && !!server.rules.hosts.default) server = {...server, ...server.rules.hosts.default};
    const originalServer = server;
    server.tries.push(server.root + "$FN", server.root + "/$FN");

    var publicServer = {
        ip: server.ip,
        port: server.port,
        root: server.root,
        rules: server.rules,
        systemRoot: ((process.platform == "win32") ? process.cwd().split(path.sep)[0] : "/"),
        uploads: server.uploads
    };
    return {server, originalServer, publicServer};
}
var tmps = await loadSettings();
global.server = tmps.server;
const originalServer = tmps.originalServer;
global.publicServer = tmps.publicServer;
tmps = undefined;
if (!!server.availableFunctions.php && !!cluster.isPrimary) console.log('PHP is installed and PATH is configured! Support for PHP was enabled.');

console.log('Defining functions...');
fs.dirSize = async (dirPath)=>{
    let size = 0;
    const files = await fs.readdir(dirPath);
  
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dirPath, files[i]);
        const stats = await fs.stat(filePath);
  
        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            size += await fs.dirSize(filePath);
        }
    }
    return size;
}
fs.dirSizeSync = (dirPath)=>{
    let size = 0;
    const files = fs.readdirSync(dirPath);
  
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dirPath, files[i]);
        const stats = fs.statSync(filePath);
  
        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            size += fs.dirSizeSync(filePath);
        }
    }
    return size;
};
fs.cleardirSync = (dirPath)=>{
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(function(file, index) {
            var curPath = dirPath + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) {
                fs.cleardirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}
fs.cleardir = fs.cleardirSync;
function getFiles(dir, removeOriginalDir, files = [], originalDir) {
    var originalDir = originalDir ?? dir;
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, removeOriginalDir, files, originalDir);
        } else {
            files.push(removeOriginalDir ? name.replace(originalDir, '') : name);
        }
    }
    return files;
}
function getFilesInfo(dir, removeOriginalDir, files = [], originalDir) {
    var originalDir = originalDir ?? dir;
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        var stat = fs.statSync(name);
        var giveStat = {
            type: stat.isDirectory() ? "dir" : "file",
            name: name.split('/')[name.split('/').length - 1],
            location: name.slice(0, name.lastIndexOf('/') + 1).replace('//', '/'),
            path: name.replace('//', '/'),
            size: stat.size,
            formattedSize: formatBytes(stat.size),
            created: stat.birthtimeMs,
            modified: stat.mtimeMs
        }
        if (giveStat.type == "dir") {
            if (fs.readdirSync(name).length === 0) {
                giveStat.location = removeOriginalDir ? giveStat.location.replace(originalDir, '') : giveStat.location;
                giveStat.path = removeOriginalDir ? giveStat.path.replace(originalDir, '') : giveStat.path;
                files.push(giveStat);
            } else getFilesInfo(name, removeOriginalDir, files, originalDir);
        }
        if (giveStat.type == "file") {
            giveStat.location = removeOriginalDir ? giveStat.location.replace(originalDir, '') : giveStat.location;
            giveStat.path = removeOriginalDir ? giveStat.path.replace(originalDir, '') : giveStat.path;
            files.push(giveStat);
        }
    }
    return files.sort((a, b)=>{
        if (a.location.split('/').length > b.location.split('/').length) return 1;
        if (a.location.split('/').length < b.location.split('/').length) return -1;
        if (a.location.length > b.location.length) return 1;
        if (a.location.length < b.location.length) return -1;
        return 0;
    });
}
function filterFileList(list, method = 1) {
    var structure = {
        dirs: {},
        files: {}
    }
    var filtered = JSON.parse(JSON.stringify(structure));

    if (method === 2) for (var e of list) {
        if (e.type === "dir") {
            var str = "";
            for (var fd of e.path.split('/')) {
                str += fd + "/";
                str = str.replaceAll('//', '/');
                filtered.dirs[str] ??= structure;
            }
        } else {
            if (e.location === "") {filtered.files[e.name] = e;continue}
            var str = "";
            for (var fd of e.location.split('/')) {
                str += fd + "/";
                str = str.replaceAll('//', '/');
                filtered.dirs[str] ??= structure;
            }
            filtered.dirs[e.location].files[e.name] = e;
        }
    }
    if (method === 1) for (var e of list) {
        if (e.type === "dir") {
            var newDir = structure;
            var command = `(out, start)=>{\nstart ??= {dirs: {}, files: {}};\n$INSERTLOC;\nout(start);\n}`;
            var oldConsecutiveFolders = "start";
            for (var fd of e.path.split('/')) {
                fd = fd.replaceAll('"', '\\"');
                command = command.replace('$INSERTLOC', oldConsecutiveFolders + `.dirs["${fd}"] ??= {dirs: {}, files: {}};\n$INSERTLOC`);
                oldConsecutiveFolders+=`.dirs["${fd}"]`;
            }
            command = command.replaceAll('$INSERTLOC', '');
            console.log(command);
            eval(command)((e)=>{filtered = e}, filtered);
        } else {
            if (e.location === "") {filtered.files[e.name] = e;continue}
            var newDir = structure;
            var command = `(out, start)=>{\nstart ??= {dirs: {}, files: {}};\n$INSERTLOC;\nout(start);\n}`;
            var oldConsecutiveFolders = "start";
            for (var fd of e.location.slice(0, e.location.length - 1).split('/')) {
                fd = fd.replaceAll('"', '\\"');
                command = command.replace('$INSERTLOC', oldConsecutiveFolders + `.dirs["${fd}"] ??= {dirs: {}, files: {}};\n$INSERTLOC`);
                oldConsecutiveFolders+=`.dirs["${fd}"]`;
            }
            command = command.replace('$INSERTLOC', oldConsecutiveFolders+`.files["${e.name.replaceAll('"', '\\"')}"] = ${JSON.stringify(e)}`);
            console.log(command);
            eval(command)((e)=>{filtered = e}, filtered);
        }
    }
    console.log(filtered);
    return filtered;
}
function isURL(s, protocols) {
    try {
        const parsed = new url.URL(s);
        return protocols
            ? parsed.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(parsed.protocol)
                : false
            : true;
    } catch (err) {
        return false;
    }
}
function matchesRule(str, rule) {
    //ciao.hey matches rule *hey, *.hey etc; ciao.hey.hello respects *hey*, *.hey.* etc.
    if (typeof str != "string" || typeof rule != "string") return false;
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
function mergeString(s1, s2) {
    let result = "";
    for (let i = 0; i < s1.length || i < s2.length; i++) {
        if (i < s1.length) result += s1.charAt(i);
        if (i < s2.length) result += s2.charAt(i);
    }
    return result;
}
function log(file, content) {
    if (!fs.existsSync('server.log')) fs.writeFileSync('server.log', '', 'utf8');
    fs.appendFileSync('server.log', new Date()+' | '+file+' | '+content+'\n', 'utf8');
    if (fs.existsSync(file)) return fs.appendFileSync(file, content+"\n", 'utf8');
    return fs.writeFileSync(file, content+"\n", 'utf8');
}
function getAllBetween(str, ch1, ch2) {
    var result = [];
    if (!ch1) return [str];
    if (!ch2) return [str.slice(str.indexOf(ch1) + ch1.length)];
    while (str.indexOf(ch1) != -1) {
        var ch1i = str.indexOf(ch1);
        var ch2i = str.indexOf(ch2);
        if (ch1 === ch2) ch2i = str.replace(ch1, '').indexOf(ch2);
        if (ch2i === -1) {
            var tmp = str.slice(ch1i + ch1.length);
            result.push(tmp);
            str = str.replace(ch1+tmp, '');
            break;
        }
        var tmp = str.slice(ch1i + ch1.length, ch2i);
        if (ch2.length === 1) var tmp = str.slice(ch1i + ch1.length, ch2i + 1);
        result.push(tmp);
        str = str.replace(ch1+tmp+ch2, '');
    }
    return result;
}
function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
function timeFromNow(str, date = new Date()) {
    str = str.split(" ");
    for (var elem of str) {
        if (elem.slice(-1) === "y") {date.setYear(date.getUTCFullYear() + Number(elem.slice(0, elem.length - 1)))}
        if (elem.slice(-1) === "M") {date.setMonth(date.getMonth() + Number(elem.slice(0, elem.length - 1)))}
        if (elem.slice(-1) === "w") {date.setDate(date.getDate() + (Number(elem.slice(0, elem.length - 1)) * 7))}
        if (elem.slice(-1) === "d") {date.setDate(date.getDate() + Number(elem.slice(0, elem.length - 1)))}
        if (elem.slice(-1) === "h") {date.setHours(date.getHours() + Number(elem.slice(0, elem.length - 1)))}
        if (elem.slice(-1) === "m") {date.setMinutes(date.getMinutes() + Number(elem.slice(0, elem.length - 1)))}
        if (elem.slice(-1) === "s") {date.setSeconds(date.getSeconds() + Number(elem.slice(0, elem.length - 1)))}
        
    }
    return date;
}
function devTypeSync(nav = navigator) {
    var device = "Unknown";
    var type1 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent) ? 'Mobile' : 'PC';
    device = type1;
    if (nav.userAgent.indexOf('Nintendo') != -1 || nav.userAgent.indexOf('Xbox') != -1) device = "Console";
    if (nav.userAgent.indexOf('VR') != -1) device = "VR";
    if (nav.userAgent.indexOf('PlayStation') != -1) device = "PlayStation";
    if (nav.userAgent.indexOf('Nintendo Switch') != -1) device = "Nintendo Switch";
    if (nav.userAgent.indexOf('Xbox One') != -1) device = "Xbox One";
    if (nav.userAgent.indexOf('Xbox Series X') != -1) device = "Xbox Series X";
    if (nav.userAgent.indexOf('Xbox Series S') != -1) device = "Xbox Series S";
    if (type1 === "PC" && device == type1)  {
        try {
            nav.getBattery().then(function(battery) {
                if (battery.charging && battery.chargingTime === 0) {
                    device = "Desktop";
                } else {
                    device = "Laptop";
                }
            });
        }catch(e){}
    }
    if (type1 === "Mobile") {
        if(/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(nav.userAgent.toLowerCase())) device = "Tablet";
        if (nav.userAgent.indexOf('TV') != -1) device = "TV";
        if (nav.userAgent.indexOf('Watch') != -1 || nav.userAgent.indexOf('Wear') != -1) device = "Watch";
    }
    return device;
}
async function devType(nav = navigator) {
    var device = "Unknown";
    var type1 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent) ? 'Mobile' : 'PC';
    device = type1;
    if (nav.userAgent.indexOf('Nintendo') != -1 || nav.userAgent.indexOf('Xbox') != -1) device = "Console";
    if (nav.userAgent.indexOf('VR') != -1) device = "VR";
    if (nav.userAgent.indexOf('PlayStation') != -1) device = "PlayStation";
    if (nav.userAgent.indexOf('Nintendo Switch') != -1) device = "Nintendo Switch";
    if (nav.userAgent.indexOf('Xbox One') != -1) device = "Xbox One";
    if (nav.userAgent.indexOf('Xbox Series X') != -1) device = "Xbox Series X";
    if (nav.userAgent.indexOf('Xbox Series S') != -1) device = "Xbox Series S";
    if (type1 === "PC" && device == type1)  {
        try {
            var battery = await nav.getBattery();
            if (battery.charging && battery.chargingTime === 0) {
                device = "Desktop";
            } else {
                device = "Laptop";
            }
        }catch(e){}
    }
    if (type1 === "Mobile") {
        if(/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(nav.userAgent.toLowerCase())) device = "Tablet";
        if (nav.userAgent.indexOf('TV') != -1) device = "TV";
        if (nav.userAgent.indexOf('Watch') != -1 || nav.userAgent.indexOf('Wear') != -1) device = "Watch";
    }
    return device;
}
function devTypeSlow(nav = navigator) {
    var device = "Unknown";
    var type1 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent) ? 'Mobile' : 'PC';
    device = type1;
    if (nav.userAgent.indexOf('Nintendo') != -1 || nav.userAgent.indexOf('Xbox') != -1) device = "Console";
    if (nav.userAgent.indexOf('VR') != -1) device = "VR";
    if (nav.userAgent.indexOf('PlayStation') != -1) device = "PlayStation";
    if (nav.userAgent.indexOf('Nintendo Switch') != -1) device = "Nintendo Switch";
    if (nav.userAgent.indexOf('Xbox One') != -1) device = "Xbox One";
    if (nav.userAgent.indexOf('Xbox Series X') != -1) device = "Xbox Series X";
    if (nav.userAgent.indexOf('Xbox Series S') != -1) device = "Xbox Series S";
    if (type1 === "PC" && device == type1)  {
        try {
            var battery = false;
            nav.getBattery().then((b)=>{battery = b});
            Math.random() * Math.random();
            device = (battery.charging && battery.chargingTime === 0 && battery.level === 1) ? "Desktop" : "Laptop";
        }catch(e){}
    }
    if (type1 === "Mobile") {
        if(/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(nav.userAgent.toLowerCase())) device = "Tablet";
        if (nav.userAgent.indexOf('TV') != -1) device = "TV";
        if (nav.userAgent.indexOf('Watch') != -1 || nav.userAgent.indexOf('Wear') != -1) device = "Watch";
    }
    return device;
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
function recursiveExists(string, createIfMissing) {
    string = (string.indexOf('./') == 0) ? string.replace('./', '/') : string;
    string = (string.indexOf('/') == 0) ? string.replace('/', '') : string;
    var dirs = (string.match(/\//g) || []).length;
    var tmpstring = "";
    var exists = true;
    for (let i = 0;i < dirs;i++) {
        var dir = string.replace(tmpstring, "").slice(0, string.replace(tmpstring, "").indexOf('/') + 1);
        var toCheckPath = tmpstring+dir;
        if (!fs.existsSync('./'+toCheckPath)) {
            if (!!createIfMissing) fs.mkdirSync('./'+toCheckPath);
            if (!createIfMissing) {
                exists = false;
                break;
            }
        }
        tmpstring += dir;
    }
    return exists;
}
function runPHP(path, params) {
    if (!path || path.toString().length < 1) {
        console.error('Error in Running PHP! No file was defined!');
        return "";
    }
    path = path.toString();
    if (!server.availableFunctions.php || path.slice(path.lastIndexOf('.') + 1, path.length).toLowerCase() != "php") return fs.readFileSync(path, 'utf8');
    var output = child_process.execSync("php " + path + " " + params).toString();
    return output;
}
function execNodeCode(input, reqPath, ...arg) {
    var nodeScriptFile = (!!reqPath && reqPath.slice(reqPath.lastIndexOf('.') + 1) === "njs");
    if (input.indexOf('<?nodejs') == -1 && !nodeScriptFile) return input;
    var occ = nodeScriptFile ? [input] : getAllBetween(input, '<?nodejs', '?>');
    var results = {};
    for (var i = 0;i < occ.length;i++) {
        var oc = occ[i];
        results[i] ??= [];
        var handleError = true;
        try {
            eval(`((echo, loadFile, handleException, loadModule, safeData, ...otherargs) => { ${oc} })`)((...args) => {results[i].push(util.format(...args))}, (file, encoding = 'utf8')=>{return execNodeCode(fs.readFileSync(file, encoding), file, ...arg);}, (state)=>{handleError = state}, loadModule, safeData, ...arg);
        } catch (e) {
            if (!!handleError) console.error('Error in Node Code, on file "'+reqPath+'":', e);
            if (!handleError) throw new Error(e);
        }
    }
    for (var i = 0;i < occ.length;i++) {
        var r = (!!results[i] ? results[i].join('') : "");
        var o = occ[i];
        if (!results[i]) {continue;}
        if (nodeScriptFile) {
            input = r;
        } else if (input.indexOf('?>') != -1) {
            input = input.replace('<?nodejs'+o+'?>', r);
        } else {
            input = input.replace('<?nodejs'+o, r);
        }
    }
    return input;
}
function loadModule(path, insert, insertObj, ...args) {
    var file = !!server.availableFunctions.php ? runPHP(path) : fs.readFileSync(path, 'utf8');
    if (!insert || insert.length < 1) insert = [""];
    if (!Array.isArray(insert)) insert = [insert];
    var count = 0;
    while (file.indexOf('<$moduleInsert>') != -1) {
        file = file.replace('<$moduleInsert>', insert[count] ?? "");
        ++count;
    }
    count = 0;
    if (insertObj && file.indexOf('<$moduleInsert ') != -1) {
        var insertPositions = getAllBetween(file, "<$moduleInsert ", " end$>");
        for (var pos of insertPositions) {
            file = file.replace("<$moduleInsert "+pos+" end$>", insertObj[pos] ?? "");
        }
    }
    return execNodeCode(file, path, ...args);
}
function getQR(text, type = "base64") {
    var resp = false;
    if (type === "text") {
        QRCode.toString(text, function (err, url) {
            resp = url;
        })
    } else {
        QRCode.toDataURL(text, function (err, url) {
            resp = url;
        })
    }
    while(!resp) {deasync.sleep(100);}
    return resp;
}
var crypt = {
    genKey: crypto.randomBytes,
    encrypt: function(text, key, iv) {
        if (!key || key.length < 1) throw new Error("Provide a key!");
        iv ??= crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return {encrypted: encrypted, iv: iv};
    },
    decrypt: function(text, key, iv) {
        if (!key || key.length < 1) throw new Error("Provide a key!");
        if (!iv || iv.length < 1) throw new Error("Provide an IV!");
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        try {
            let decrypted = decipher.update(text, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
        } catch(e) {
            if (e.toString().indexOf("The argument 'encoding' is invalid for data of length") != -1 || e.toString().indexOf('wrong final block length') != -1) return text;
            throw new Error(e);
        }
        return decrypted;
    }
}
var compress = {
    compress: function(text) {
        var deflated = zlib.deflateSync(text);
        return deflated.toString('base64');
    },
    decompress: function(text) {
        try {
            var bfr = Buffer.from(text, 'base64');
            return zlib.inflateSync(bfr).toString();
        } catch(e) {return text;}
    }
}
var safeData = {
    encode: function(text, key, iv, encrypt) {
        try {
            var encrypted = encrypt ? crypt.encrypt(text, key, iv).encrypted : text;
            return compress.compress(encrypted);
        } catch(e) {
            if (e.toString().indexOf('node:internal') != -1) return text;
            throw new Error(e.toString());
        }
    },
    decode: function(text, key, iv) {
        try {
            var inflated = compress.decompress(text);
            return crypt.decrypt(inflated, key, iv);
        } catch(e) {
            if (e.toString().indexOf('node:internal') != -1) return text;
            if (e.toString().indexOf('Error: error:1C80006B:Provider routines::wrong final block length') === 0) {
                try {
                    return compress.decompress(text);
                } catch(e) {
                    if (e.toString().indexOf('node:internal') != -1) return text;
                    throw new Error(e.toString());
                }
            } 
            if (e.toString().indexOf('node:internal') != -1) return text;
            throw new Error(e.toString());
        }
    }
}
var baseOTP = {
    create: function(secret = base32.encode(crypto.randomBytes(15)).replace(/=/g, "").substring(0, 24), appName = "App", author = "User", time = 30, digits = 6) {
        return {TOTP: new OTPAuth.TOTP({
            issuer: author,
            label: appName,
            algorithm: "SHA1",
            digits: digits,
            period: time,
            secret: secret
        }), secret: secret};
    },
    token: (TOTP)=>{return TOTP.generate()},
    verify: (TOTP, token, window = 1)=>{return (TOTP.validate({token: token, window: window}) != null)},
    URL: (TOTP)=>{return TOTP.toString()},
    parse: (URL)=>{return {TOTP: OTPAuth.URI.parse(URL), secret: OTPAuth.URI.parse(URL).secret}},
    QR: (TOTP, type)=>{return getQR(TOTP.toString(), type)}
};
var bparser = {
    returnPropertyEntry: function(arr) {
        if (!Array.isArray(arr)) {return false};
        let propertyName = '';
        let propertyVal = undefined;
        arr.forEach(function(val, index) {
            if (val.includes("name=")) {
                propertyName = arr[index].split("name=")[1];
                propertyVal = arr[index + 1]
            }
        })
        return [propertyName, propertyVal];
    },
    returnFileEntry: function(arr) {
        if (!Array.isArray(arr)) {return false};
        let fileName = '';
        let file = undefined;
        arr.forEach(function(val, index) {
            if (val.includes("filename=")) {
                fileName = arr[index].split("filename=")[1];
            }
            if (val.toLowerCase().includes("content-type")) {
                file = arr[index + 1];
            }
        })
        return [fileName, file];
    },
    isFile: function(part) {
        if (!Array.isArray(part)) {return false};
        let filenameFound = false;
        let contentTypeFound = false;
        part.forEach(function(val, index) {
            if (val.includes("filename=")) {
                filenameFound = true;
            }
            if (val.toLowerCase().includes("content-type")) {
                contentTypeFound = true;
            }
        });
        part.forEach(function(val, index) {
            if (!val.length) {
                part.splice(index, 1)
            }
        });
        if (filenameFound && contentTypeFound) {
            return part;
        } else {
            return false;
        }
    },
    isProperty: function(part) {
        if (!Array.isArray(part)) {return false};
        let propertyNameFound = false;
        let filenameFound = false;
        part.forEach(function(val, index) {
            if (val.includes("name=")) {
                propertyNameFound = true;
            }
        });
        part.forEach(function(val,index) {
            if (val.includes("filename=")) {
                filenameFound = true;
            }
        });
        part.forEach(function(val,index) {
            if (!val.length) {
                part.splice(index, 1)
            }
        });
        if(propertyNameFound && !filenameFound) {
            return part;
        } else {
            return false;
        }
    }
}
console.log('Preparing HTTP Host...');
var app = (req, res)=>{
    // todo: OPTIMIZE THIS TO HEAVILY INCREASE PERFORMANCE!
    if (!!args.perftimer) {
        console.log("\x1b[33m Started measuring response time! ----------------------------- \x1b[0m");
        console.group();
        var reqHandleStartTime = performance.now();
        var reqHandleSections = {};
    }
    var server = global.server;
    if (!!server.rules.hosts && !!server.rules.hosts.default) server = {...server, ...server.rules.hosts.default};
    if (!!server.rules.hosts) {
        //if (server.rules.hosts[req.headers.host]) {server = {...server, ...server.rules.hosts[req.headers.host]};}
        //else {
            for (var host in server.rules.hosts) {
                if (matchesRule(req.headers.host, host)) {
                    server = {...server, ...server.rules.hosts[host]};
                }
            }
        //}
    }
    server.tries.push(server.root + "$FN", server.root + "/$FN");
    if (!!args.perftimer) reqHandleSections["get host rules"] = performance.now() - reqHandleStartTime;
    if (!!server.headers && typeof server.headers === "object") for (var header in server.headers) {if (header.toLowerCase() === "expires") {server.headers[header] = timeFromNow(server.headers[header])};res.setHeader(header, server.headers[header])}
    var tmpReqPath = (server.root + ((req.url == "/") ? "/index.html" : req.url)).replaceAll("//", '/');
    if (tmpReqPath === server.root + server.uploads.path) {
        //Execute Server Operations
        var langtmp = (req.headers['accept-language'] ?? "en-us").split(',')[0].split('-');
        langtmp[0] ??= "en";
        langtmp[1] ??= "US";
        var client = {
            ip: req.socket.remoteAddress,
            useragent: req.headers['user-agent'] ?? false,
            auth: !!req.headers.authorization ? {
                usr: Buffer.from(req.headers.authorization.split(/\s+/).pop(), 'base64').toString().split(/:/)[0],
                pwd: Buffer.from(req.headers.authorization.split(/\s+/).pop(), 'base64').toString().split(/:/)[1]
            } : false,
            language: langtmp[1].toUpperCase()+'-'+langtmp[0]
        }
        client.devtype = !!client.useragent ? devTypeSync({userAgent: client.useragent}) : "Unknown";
        if (!!args.perftimer) reqHandleSections["define client"] = performance.now() - reqHandleStartTime;
        if (!args.silent) console.log(`New Access`, Date(), {...client, path: (server.root + tmpReqPath), handler: process.pid});

        //Get uploaded file
        var form = new IncomingForm();
        form.maxFileSize = server.uploads.maxSize ?? 1024 * 1024 * 1024; //1 GB
        form.parse(req, function (err, fields, files) {
            var reqUrlData = {
                protocol: req.protocol,
                headers: req.headers,
                path: (server.root + ((req.url == "/") ? "/index.html" : req.url)).replaceAll("//", '/'),
                port: (req.protocol == "http:") ? server.port.http : ((req.protocol == "https:") ? server.port.https : undefined),
                auth: client.auth,
                host: req.headers.host.split(':')[0],
                basehost: req.headers.host.split(':')[0].split('.').length > 1 ? req.headers.host.split(':')[0].split('.')[req.headers.host.split(':')[0].split('.').length - 2] +'.'+ req.headers.host.split(':')[0].split('.')[req.headers.host.split(':')[0].split('.').length - 1] : undefined,
                query: url.parse(req.url, true).query,
                body: ((f)=>{var ret = {};for (var fn in fields) {ret[fn] = fields[fn][0]};return ret;})(fields),
                client: client
            };

            if (!Array.isArray(files.file)) {
                res.end('ERROR: The input upload must have the "name" property equal to "file".');
            } else {
                res.writeHead(200, {'Content-type': server.filetypes['html']});
                var count = 1;
                for (var file of files.file) {
                    if (!!server.uploads.handler) {
                        var fcontent = !!server.availableFunctions.php ? runPHP('.'+server.uploads.handler) : fs.readFileSync('.'+server.uploads.handler, 'utf8');
                        fcontent = execNodeCode(fcontent, server.uploads.handler, reqUrlData, publicServer, file);
                        if (!!args.perftimer) reqHandleSections["run upload handler scripts"] = performance.now() - reqHandleStartTime;
                        res.write(fcontent);
                        count++;
                        continue;
                    }
                    if (!!server.uploads.filter) {
                        var fcontent = !!server.availableFunctions.php ? runPHP('.'+server.uploads.filter) : fs.readFileSync('.'+server.uploads.filter, 'utf8');
                        fcontent = execNodeCode(fcontent, server.uploads.filter, reqUrlData, publicServer, file);
                        if (!!args.perftimer) reqHandleSections["run upload filter scripts"] = performance.now() - reqHandleStartTime;
                        res.write(fcontent);
                        if (fcontent.indexOf('ERROR:') === 0) {
                            fs.unlinkSync(file.filepath);
                            count++;
                            continue;
                        }
                    }
                    var fileIdentifier = server.uploads.ids ? makeid(20) : "";
                    fs.renameSync(file.filepath, "./"+server.uploads.destination+fileIdentifier+file.originalFilename);
                    if (!!server.uploads.postScript && server.uploads.postScript.length > 0 && fs.existsSync('.'+server.uploads.postScript)) {
                        var fcontent = !!server.availableFunctions.php ? runPHP('.'+server.uploads.postScript) : fs.readFileSync('.'+server.uploads.postScript, 'utf8');
                        fcontent = execNodeCode(fcontent, server.uploads.postScript, reqUrlData, publicServer, "./"+server.uploads.destination+fileIdentifier+file.originalFilename, fileIdentifier);
                        if (!!args.perftimer) reqHandleSections["run page scripts"] = performance.now() - reqHandleStartTime;
                        res.write(fcontent);
                    } else if (fields.redirect) {
                        res.write("<script>location.href = '"+fields.redirect[0]+"'</script>");
                    } else {
                        res.write('OK' + (server.uploads.ids ? ": "+fileIdentifier+file.originalFilename : ""));
                    }
                    count++;
                }
                res.end();
            }
        });
        if (!!args.perftimer) reqHandleSections["upload file"] = performance.now() - reqHandleStartTime;
        return;
    }
    req.bodytxt = [];
    req.body = {};
    req.ctype = req.headers["content-type"] ?? "";
    req.boundary = (req.ctype.split("; ")[1] != undefined) ? "--" + req.ctype.split("; ")[1].replace("boundary=","") : "";
    req.on('data',(data)=>{req.bodytxt.push(data)}).on('end',()=>{
        var langtmp = (req.headers['accept-language'] ?? "en-us").split(',')[0].split('-');
        langtmp[0] ??= "en";
        langtmp[1] ??= "US";
        if (req.bodytxt && req.bodytxt.length > 0) {
            req.bodytxt = Buffer.concat(req.bodytxt).toString();
            if (req.ctype.toLowerCase().indexOf('multipart/form-data') != 0) {
                for (var pair of new URLSearchParams(req.bodytxt).entries()) {
                    try {
                        req.body = JSON.parse(req.bodytxt);
                        break;
                    } catch(e) {}
                    req.body[pair[0]] = pair[1];
                }
            } else {
                req.bodyparts = req.bodytxt.split(req.boundary);
                req.bodyparts.forEach(function(val, index) {
                    val = val.replace("Content-Disposition: form-data; ","").split(/[\r\n]+/);
                    if (bparser.isFile(val)) {
                        var result = bparser.returnFileEntry(val);
                        req.body[result[0].slice(1, -1)] = result[1];
                    }
                    if (bparser.isProperty(val)) {
                        var result = bparser.returnPropertyEntry(val);
                        req.body[result[0].slice(1, -1)] = result[1];
                    }
                });
            }
            if (!!args.perftimer) reqHandleSections["parse body"] = performance.now() - reqHandleStartTime;
        }
        req.acceptsLanguages = langtmp[1].toUpperCase()+'-'+langtmp[0];
        var client = {
            ip: req.socket.remoteAddress,
            useragent: req.headers['user-agent'] ?? false,
            auth: !!req.headers.authorization ? {
                usr: Buffer.from(req.headers.authorization.split(/\s+/).pop(), 'base64').toString().split(/:/)[0],
                pwd: Buffer.from(req.headers.authorization.split(/\s+/).pop(), 'base64').toString().split(/:/)[1]
            } : false,
            language: req.acceptsLanguages
        }
        client.devtype = !!client.useragent ? devTypeSync({userAgent: client.useragent}) : "Unknown";
        if (!!args.perftimer) reqHandleSections["define client"] = performance.now() - reqHandleStartTime;
        req.urldata = {
            protocol: req.protocol,
            headers: req.headers,
            path: (server.root + ((req.url == "/") ? "/index.html" : req.url)).replaceAll("//", '/'),
            port: (req.protocol == "http:") ? server.port.http : ((req.protocol == "https:") ? server.port.https : undefined),
            auth: client.auth,
            host: req.headers.host.split(':')[0],
            basehost: req.headers.host.split(':')[0].split('.').length > 1 ? req.headers.host.split(':')[0].split('.')[req.headers.host.split(':')[0].split('.').length - 2] +'.'+ req.headers.host.split(':')[0].split('.')[req.headers.host.split(':')[0].split('.').length - 1] : undefined,
            query: url.parse(req.url, true).query,
            body: req.body,
            client: client
        }
        if (req.urldata.path.indexOf('?') != -1) req.urldata.path = req.urldata.path.slice(0, req.urldata.path.indexOf('?'));

        if (!!server.rules.redirects) {
            for (var redirect of server.rules.redirects) {
                redirect.expires ??= {};
                //redirect.expires.used ??= 0;
                if (typeof redirect.expires.date === "number" && new Date().getTime() - redirect.expires.date >= 0) continue;
                //if (typeof redirect.expires.uses === "number" && redirect.expires.uses <= redirect.expires.used) continue;
                if (req.urldata.path === server.root + redirect.from || matchesRule(req.urldata.path.replace(server.root, ''), redirect.from)) {
                    req.urldata.originalPath = req.urldata.path;
                    req.urldata.path = redirect.to;
                    req.urldata.allowrestricted = true;
                    req.urldata.followsRule = true;
                    req.urldata.attachment = !!redirect.attachment;
                    //++redirect.expires.used;
                } else if (redirect.replace && req.urldata.path.indexOf(server.root + redirect.from) === 0) {
                    req.urldata.originalPath = req.urldata.path;
                    req.urldata.path = req.urldata.path.replace(server.root + redirect.from, redirect.to);
                    req.urldata.allowrestricted = true;
                    req.urldata.followsRule = true;
                    req.urldata.attachment = !!redirect.attachment;
                    //++redirect.expires.used;
                } else if (server.protectedOverrideIPs.includes(req.urldata.client.ip) || matchesRule(req.urldata.client.ip, server.protectedOverrideIPs)) {
                    req.urldata.allowrestricted = true;
                    req.urldata.followsRule = true;
                }
            }
        }
        if (!!args.perftimer) reqHandleSections["apply redirects"] = performance.now() - reqHandleStartTime;

        for (var tentatives of server.tries) {
            var tentative = tentatives.replaceAll('$FN', req.urldata.path);
            if (fs.existsSync('.'+tentative)) {
                req.urldata.path = tentative;
                break;
            }
        }
        if (!!args.perftimer) reqHandleSections["find file"] = performance.now() - reqHandleStartTime;

        if (fs.existsSync('.'+req.urldata.path) && fs.lstatSync('.'+req.urldata.path).isDirectory()) req.urldata.path += (req.urldata.path.slice(-1) != "/") ? "/index.html" : "index.html";
        function qe(err) {
            res.statusCode = Number(err.slice(0, 3));
            res.statusMessage = err.slice(4);
            res.end();
        }
        if (((req.urldata.path != server.root + "/LiveReload-CheckStatus-208340S908CXZ0CNDUSJCIN938WNSJKFEECNSDXC9" && !!args.livereload) || !args.livereload) && !args.silent) console.log(`New Access`, Date(), {...client, path: req.urldata.path, handler: process.pid});
        //res.writeHead(200, {'Content-type':'application/json'});
        //res.end({response_status: 200, text: "The server is up and running!"});
        
        //Serve a file
        if (!!server.proxy_pass) {
            var newPURL = new URL(server.proxy_pass);
            var reqURL  = !!server.proxy_pass_allow_path ? req.url : "";
            var options = {
                hostname: newPURL.hostname,
                port: req.protocol === "http:" ? 80 : 443,
                path: (newPURL.pathname + '/' + reqURL).replaceAll('//', '/').replaceAll('//', '/'),
                method: server.proxy_pass_method ?? "GET",
                headers: {
                    ...req.headers,
                    ...(server.proxy_pass_headers ?? {}),
                    host: newPURL.hostname
                },
                body: (server.proxy_pass_method && server.proxy_pass_method.toUpperCase()) == "POST" ? req.body : undefined
            };

            request({
                url: req.protocol + '//' + options.hostname + options.path,
                headers: options.headers,
                method: options.method,
                body: options.body
            }).on('error', function(e) {
                res.end(e);
            }).pipe(res);
        } else if (fs.existsSync('.'+req.urldata.path)) {
            var isProtected = false;
            for (var protectedfolder of server.protected) {
                if (!!req.urldata.allowrestricted) break;
                if (req.urldata.path.slice(1).indexOf(protectedfolder) == 0) isProtected = true;
            }
            if (!!args.perftimer) reqHandleSections["check protected folders"] = performance.now() - reqHandleStartTime;
            if (!isProtected) {
                var ftype = ('.'+req.urldata.path).slice(('.'+req.urldata.path).lastIndexOf('.') + 1, ('.'+req.urldata.path).length);
                var ctype = server.filetypes[ftype] ?? server.filetypes.default;
                var fcontent = !!server.availableFunctions.php ? runPHP('.'+req.urldata.path) : fs.readFileSync('.'+req.urldata.path, 'utf8');
                fcontent = ftype === "njsc" ? execNodeCode(fcontent, req.urldata.path, req.urldata, publicServer, res) : execNodeCode(fcontent, req.urldata.path, req.urldata, publicServer);
                if (!!args.perftimer) reqHandleSections["run page scripts"] = performance.now() - reqHandleStartTime;
                if (ftype != "njsc") {
                    const headers = {'Content-type':ctype};
                    var fn = req.urldata.path.slice(req.urldata.path.lastIndexOf('/') + 1, req.urldata.path.lastIndexOf('.'));
                    var urlext = ('.'+req.urldata.originalPath).slice(('.'+req.urldata.originalPath).lastIndexOf('.') + 1, ('.'+req.urldata.originalPath).length);
                    if ((ctype === server.filetypes.default && matchesRule(fn, "*.attachment")) || matchesRule(fn, "*.attachment") || req.urldata.attachment) headers['Content-Disposition'] = `attachment; filename="${fn.slice(0, (fn.lastIndexOf('.attachment') != -1 ? fn.lastIndexOf('.attachment') : fn.length))}.${urlext.indexOf(server.root) === 0 ? ftype : urlext}"`;
                    res.writeHead(200, headers);
                    if ((ftype === "html" || (ftype === "php" && !!server.availableFunctions.php) || ftype === "njs") && !headers['Content-Disposition']) {
                        if (!!args.livereload && !req.urldata.followsRule && ftype != "njs") {
                            var deflivereload = (!!args.nilivereload) ? "var reloads = "+reloads+";setInterval(()=>{fetch('/LiveReload-CheckStatus-208340S908CXZ0CNDUSJCIN938WNSJKFEECNSDXC9').then(r=>r.text()).then(r=>{if (isNaN(Number(r))) {return;} if (Number(r) > reloads || (reloads > 0 && Number(r) == 0)) {console.log('Live Reload - Change detected!', `New ${r}, Old ${reloads}`);if (window.confirm('Live Reload\\nThe original page was updated, want to refresh now?')) {location.reload();} else {reloads = Number(r)}}})}, 500)" : "var reloads = "+reloads+";setInterval(()=>{fetch('/LiveReload-CheckStatus-208340S908CXZ0CNDUSJCIN938WNSJKFEECNSDXC9').then(r=>r.text()).then(r=>{if (isNaN(Number(r))) {return;}if (Number(r) > reloads || (reloads > 0 && Number(r) == 0)) {console.log('Live Reload - Change detected!', `New ${r}, Old ${reloads}`);location.reload();}})}, 500)";
                            var livereloadcontent = (fs.existsSync('./livereload.js')) ? fs.readFileSync('./livereload.js') : deflivereload;
                            res.end(fcontent +`<script>\n${livereloadcontent}\n</script>`);
                        } else {
                            res.end(fcontent);
                        }
                    } else {
                        if (!!headers['Content-Disposition']) {res.end(fcontent)}
                        else {res.end(fs.readFileSync('.'+req.urldata.path))}
                    }
                } else {
                    //Live support not enabled for this file type!
                    res.end(fcontent);
                }
            } else {
                if (!!args.livereload && req.urldata.path === server.root + "/LiveReload-CheckStatus-208340S908CXZ0CNDUSJCIN938WNSJKFEECNSDXC9") {
                    res.writeHead(200, {'Content-type': server.filetypes['html']})
                    res.end(reloads+"");
                } else {
                    res.writeHead(403, {'Content-type':'text/html'});
                    var error403 = (!!server.errors && server.errors['403'] && server.errors['403'].length > 0 && typeof server.errors['403'] === "string") ? (fs.existsSync(server.root + server.errors['403']) ? fs.readFileSync(server.root + server.errors['403']) : server.errors['403']) : "<h1 style='align-text: center;'>403: Access Denied</h1><p style='align-text:center'>You don't have the required permissions to access the page.</p>";
                    res.end(error403);
                }
            }
        } else {
            if (!!args.livereload && req.urldata.path === server.root + "/LiveReload-CheckStatus-208340S908CXZ0CNDUSJCIN938WNSJKFEECNSDXC9") {
                res.writeHead(200, {'Content-type': server.filetypes['html']})
                res.end(reloads+"");
            } else {
                var isProtected = false;
                for (var protectedfolder of server.protected) {
                    if (req.urldata.path.slice(1).indexOf(protectedfolder) == 0) isProtected = true;
                }
                if (!!server.autoindex && !!server.autoindex.enable && fs.existsSync('.'+req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1)) && !isProtected) {
                    server.autoindex.format ??= "html";
                    var atype = server.autoindex.format.toLowerCase() == "json" ? "json" : "html";
                    var filenames = fs.readdirSync('.'+req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1));
                    var files = [];
                    if (atype === "json") {
                        for (var filename of filenames) {
                            var filestat = fs.statSync('.'+req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1)+filename);
                            var rawDate = new Date(filestat.mtime).toString().split(" ");
                            files.push({name: filename, type: (filestat.isFile() ? "file" : "directory"), mtime: `${rawDate[0]}, ${rawDate[2]} ${rawDate[1]} ${rawDate[3]} ${rawDate[4]} ${rawDate[5]}`, size: filestat.size})
                        }
                        if (!!args.perftimer) reqHandleSections["JSON autoindex"] = performance.now() - reqHandleStartTime;
                        res.writeHead(404, {'Content-type': server.filetypes["json"]});
                        res.end(JSON.stringify(files, null, 4));
                    } else {
                        for (var filename of filenames) {
                            var filestat = fs.statSync('.'+req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1)+filename);
                            var rawDate = new Date(filestat.mtime).toString().split(" ");
                            files.push({name: filename, type: (filestat.isFile() ? "file" : "directory"), mtime: `${rawDate[2]}-${rawDate[1]}-${rawDate[3]} ${rawDate[4].split(":")[0]}:${rawDate[4].split(":")[1]}`, size: filestat.size})
                        }
                        res.writeHead(404, {'Content-type': 'text/html'});
                        var autoindexResponse = `<html><head><title>Index of ${req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1).replace(server.root, '')}</title></head><h1>Index of ${req.urldata.path.slice(0, req.urldata.path.lastIndexOf('/') + 1).replace(server.root, '')}</h1><hr><pre><a href="../">../</a>`;
                        for (var f of files) {
                            var fileName = f.name;
                            var fileMtime = f.mtime;
                            var fileSize = f.size;
                            var str = `${fileName} ${fileMtime} ${fileSize}`;
                            var len = str.length; // Must be 51,88
                            var spaces1 = "";
                            if ((fileName + " ").length != 52) spaces1 = (" ".repeat(52 - fileName.length));
                            autoindexResponse += `\n<a href="${f.name}">${fileName}</a>${spaces1} ${fileMtime}  ${fileSize} `;
                        }
                        if (!!args.perftimer) reqHandleSections["autoindex"] = performance.now() - reqHandleStartTime;
                        autoindexResponse += `</pre><hr></body></html>`;
                        res.end(autoindexResponse);
                    }
                } else {
                    res.writeHead(404, {'Content-type':'text/html'});
                    var error404 = (!!server.errors && server.errors['404'] && server.errors['404'].length > 0 && typeof server.errors['404'] === "string") ? (fs.existsSync(server.root + server.errors['404']) ? fs.readFileSync(server.root + server.errors['404']) : server.errors['404']) : "<h1 style='align-text: center;'>404: Page not found!</h1><p style='align-text:center'>Try checking the URL.</p>";
                    res.end(error404);
                }
            }
        }

        if (!!args.perftimer) {
            var consoleOutput = "\x1b[34m ENDED SCRIPTS EXECUTION -------------------------------------- \x1b[0m\n";
            var longest = {name: false, value: 0};
            for (var i = 0;i < Object.keys(reqHandleSections).length;i++) {
                var prev = (i === 0) ? 0 : reqHandleSections[Object.keys(reqHandleSections)[i - 1]];
                var sect = reqHandleSections[Object.keys(reqHandleSections)[i]];
                var name = Object.keys(reqHandleSections)[i];
                var time = sect - prev;
                if (time > longest.value) longest = {name: name, value: time};
                consoleOutput += `--"${name}" took ${time}ms (finished at ${sect}ms)!\n`;
            }
            console.groupEnd();
            if (!!longest.name) consoleOutput += `\x1b[96m "${longest.name}" took the longest (${longest.value}ms) \x1b[0m\n`;
            console.log(consoleOutput+`\x1b[33m Responded in ${performance.now() - reqHandleStartTime}ms! ---------------------------- \x1b[0m`);
        }
    });
};
var apphttp = (req, res)=>{req.protocol = "http:";app(req, res)}
var apphttps = (req, res)=>{req.protocol = "https:";app(req, res)}

if (!!args.livereload) {
    console.log('Preparing live reload...');
    var reloads = 0;
    try {
        fs.watch("."+server.root+"/", {recursive: true}, (et, fn)=>{
            console.log("Live Reload - Change detected!", `${et} on ${fn}!`);
            reloads++;
        });  
    } catch(e) {
        try {
            fs.watch("."+server.root+"/", {recursive: false}, (et, fn)=>{
                console.log("Live Reload - Change detected!", `${et} on ${fn}!`);
                reloads++;
            });
            console.error("Live Reload error, running non recursive version!", e);
        } catch(er) {
            console.error("Live Reload unavailable!", er);
        }
    }
}

if (fs.existsSync('./server.cfg')) fs.watch('./server.cfg', async (et, fn)=>{
    if (!!cluster.isPrimary) console.log("Reloaded server config!");
    var tmps = await loadSettings();
    global.server = tmps.server;
    global.publicServer = tmps.publicServer;
    tmps = undefined;
});

if (fs.existsSync('./private/server/rules.json')) fs.watch('./private/server/rules.json', async (et, fn)=>{
    if (!!cluster.isPrimary) console.log("Reloaded server config!");
    var tmps = await loadSettings();
    global.server = tmps.server;
    global.publicServer = tmps.publicServer;
    tmps = undefined;
});

console.log('Starting servers...');
if (!originalServer.availableFunctions.loadBalancing || !cluster.isPrimary) {
    http.createServer({maxHeaderSize: server.maxHeaderSize}, apphttp).listen(server.port.http, undefined, ()=>{if (cluster.isPrimary) console.log('HTTP Server Running on Port `'+server.port.http+'`!', server.ip, 'localhost')});
    if (!!server.certs.key && !!server.certs.cert) {
        https.createServer({...server.certs, maxHeaderSize: server.maxHeaderSize}, apphttps).listen(server.port.https, undefined, ()=>{console.log('HTTPS Support Enabled on Port `'+server.port.https+'`!')});
    } else {console.log('HTTPS Support NOT Enabled: Insert both `key.pem` and `cert.pem` files inside of `./certs/` folder!')}
    if (!!originalServer.rules.additionalServers) for (var secondaryServer of originalServer.rules.additionalServers) {
        secondaryServer.enable ??= true;
        secondaryServer.certs ??= {key: false, cert: false};
        secondaryServer.port ??= 8080;
        secondaryServer.type ??= "HTTP";
        secondaryServer.type = secondaryServer.type.toUpperCase();
        if (!secondaryServer.enable) continue;
        if (secondaryServer.type === "PEER") {
            if (!peerjs) {
                console.warn("PeerServer not created! Missing `peer` package!");
                continue;
            }
            var serverOpts = {
                port: secondaryServer.port,
                path: (secondaryServer.path ?? "/pjs"),
                key: secondaryServer.key ?? false,
                allow_discovery: secondaryServer.discovery ?? true,
                generateClientId: uuidv4
            };
            if (!!secondaryServer.certs.key) serverOpts.sslkey = secondaryServer.certs.key;
            if (!!secondaryServer.certs.cert) serverOpts.sslcert = secondaryServer.certs.cert;
            peerjs.PeerServer(serverOpts);
            console.log('Additional PeerServer Running on Port `'+secondaryServer.port+'`!', originalServer.ip, 'localhost');
        } else if (secondaryServer.type === "WEBSOCKET") {
            if (!websocket) {
                console.warn("WS Server not created! Missing `ws` package!");
                continue;
            }
            var WSServer = new websocket.Server({ port: secondaryServer.port});
            var clients = new Map();
            WSServer.on('connection', (ws) => {
                const ID = uuidv4();
                const IP = ws._socket.remoteAddress;
                let metadata = { ID, IP };
                if (secondaryServer.handler && fs.existsSync(secondaryServer.handler)) metadata = execNodeCode(fs.readFileSync(secondaryServer.handler, 'utf8'), secondaryServer.handler, WSServer, ws);
                clients.set(ws, metadata);
                ws.on('message', (msg)=>{
                    const message = JSON.parse(msg);
                    const metadata = clients.get(ws);
                    message.sender = metadata.ID;
                    message.addr = metadata.IP;
                    if (secondaryServer.handler && fs.existsSync(secondaryServer.handler)) message = execNodeCode(fs.readFileSync(secondaryServer.handler, 'utf8'), secondaryServer.handler, WSServer, ws, metadata, msg);
                    const outbound = JSON.stringify(message);
                    [...clients.keys()].forEach((client) => {
                        if (secondaryServer.handler && fs.existsSync(secondaryServer.handler)) {
                            outbound = execNodeCode(fs.readFileSync(secondaryServer.handler, 'utf8'), secondaryServer.handler, WSServer, ws, metadata, outbound, client.send);
                        } else {
                            client.send(outbound);
                        }
                    });
                });
                ws.on("close", () => {
                    clients.delete(ws);
                });
            });
            console.log('Additional WS Server Running on Port `'+secondaryServer.port+'`!', originalServer.ip, 'localhost');
        } else if (!!secondaryServer.certs.key && !!secondaryServer.certs.cert) {
            https.createServer({...server.certs, maxHeaderSize: server.maxHeaderSize}, apphttps).listen(secondaryServer.port, undefined, ()=>{console.log('Additional HTTPS Server Running on Port `'+secondaryServer.port+'`!', originalServer.ip, 'localhost')});
        } else {
            http.createServer({maxHeaderSize: server.maxHeaderSize}, apphttp).listen(secondaryServer.port, undefined, ()=>{if (cluster.isPrimary) console.log('Additional HTTP Server Running on Port `'+secondaryServer.port+'`!', originalServer.ip, 'localhost')});
        }
    }
    console.log = console.tmpLog;
} else if (cluster.isPrimary) {
    // Fork workers
    for (let i = 0;i < numCPUs;i++) {
        cluster.fork();
    }
  
    cluster.on('exit', (worker, code, signal) => {
        console.error(`A worker just died!`);
        cluster.fork();
    });
    
    console.log(`Load balancer ready!`);
}