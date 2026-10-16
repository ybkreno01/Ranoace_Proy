export const SEGURA_CLUSTER_HTML = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>
<title>Constructor de Clúster Segura</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
:root{
  color-scheme:light;
  --page:#FFFFFF; --tint:#F5F8F7; --code:#F3F7F6;
  --ink:#0B1A17; --muted:#5C6E6A; --faint:#8B9C98;
  --line:#E2EAE8; --line2:#CBD9D5;
  --accent:#006B69; --deep:#003A32; --soft:#E7F4F1;
  --ok:#0F6B47; --ok-bg:#EEF8F2; --ok-line:#BFE2CE;
  --warn:#8A5300; --warn-bg:#FDF6E9; --warn-line:#EBD6A9;
  --crit:#A3231C; --crit-bg:#FDF0EE; --crit-line:#F1C7C2;
  --gui:#1D4ED8; --gui-bg:#F1F5FF; --gui-line:#C9D8FA;
}
*{box-sizing:border-box}
body{
  margin:0;background:var(--page);color:var(--ink);
  font-family:'Archivo',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3{margin:0;font-weight:700;letter-spacing:-.015em;text-wrap:balance}
p{margin:0}
button{font:inherit;color:inherit}
.mono,.inline,code{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,monospace}
.inline,code{font-size:.88em;background:var(--tint);border:1px solid var(--line);border-radius:4px;padding:1px 5px}
.wrap{max-width:1360px;margin:0 auto;padding:0 22px 90px}

/* header */
header.top{border-bottom:1px solid var(--line);background:var(--page);position:relative;z-index:5}
.top-in{max-width:1360px;margin:0 auto;padding:18px 22px;display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.brand{display:flex;gap:12px;align-items:center;flex:1 1 320px}
.mark{width:36px;height:36px;border-radius:9px;background:var(--deep);display:grid;place-items:center;flex:none}
.mark svg{width:19px;height:19px}
h1{font-size:19px;line-height:1.2}
.sub{font-size:12.5px;color:var(--muted);margin-top:1px}
.top-note{
  flex:1 1 420px;font-size:12.5px;line-height:1.5;background:var(--warn-bg);
  border:1px solid var(--warn-line);border-left:3px solid var(--warn);border-radius:0 8px 8px 0;padding:9px 13px;
}
.top-note b{color:var(--warn)}

/* layout */
.grid{display:grid;grid-template-columns:330px minmax(0,1fr);gap:26px;align-items:start;padding-top:24px}
@media (max-width:980px){.grid{grid-template-columns:1fr}}

/* sidebar */
.panel{background:var(--page);border:1px solid var(--line);border-radius:12px}
aside .panel{position:sticky;top:14px;max-height:calc(100vh - 28px);overflow-y:auto}
@media (max-width:980px){aside .panel{position:static;max-height:none}}
.sec-t{
  font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:var(--faint);padding:15px 16px 8px;border-top:1px solid var(--line);
}
.sec-t:first-child{border-top:0}
.pad{padding:0 16px 16px}
label{display:block;font-size:11.5px;font-weight:600;color:var(--muted);margin-bottom:4px}
input,select{
  width:100%;padding:8px 10px;border:1px solid var(--line2);border-radius:7px;background:var(--page);color:var(--ink);
  font:500 13.5px/1.3 'JetBrains Mono',monospace;
}
select{font-family:'Archivo',sans-serif}
input:focus-visible,select:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.row{display:grid;gap:10px}.row.two{grid-template-columns:1fr 1fr}.row+.row{margin-top:10px}
.tg{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px dashed var(--line);cursor:pointer}
.tg input{width:16px;height:16px;margin:2px 0 0;accent-color:var(--accent);flex:none}
.tg b{display:block;font-size:13px}
.tg em{font-style:normal;font-size:11.5px;color:var(--muted);line-height:1.4;display:block}
.ncard{border:1px solid var(--line);border-radius:9px;padding:10px;background:var(--tint)}
.ncard+.ncard{margin-top:8px}
.nh{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
.nh b{font-size:12px}
.pill{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2.5px 7px;border-radius:99px}
.pill.pri{background:var(--deep);color:#9AF1DC}
.pill.sec{background:var(--page);color:var(--muted);border:1px solid var(--line2)}
.pill.arb{background:var(--warn-bg);color:var(--warn);border:1px solid var(--warn-line)}
.verdict{border-radius:10px;padding:11px 13px;font-size:12.6px;line-height:1.5}
.verdict b{display:block;font-size:13.4px;margin-bottom:3px}
.v-crit{background:var(--crit-bg);border:1px solid var(--crit-line)}.v-crit b{color:var(--crit)}
.v-ok{background:var(--ok-bg);border:1px solid var(--ok-line)}.v-ok b{color:var(--ok)}
.v-warn{background:var(--warn-bg);border:1px solid var(--warn-line)}.v-warn b{color:var(--warn)}

/* phases */
.phase{border:1px solid var(--line);border-radius:12px;background:var(--page);overflow:hidden}
.phase+.phase{margin-top:18px}
.ph-head{display:flex;gap:13px;align-items:flex-start;padding:15px 18px;background:var(--tint);border-bottom:1px solid var(--line)}
.ph-n{flex:none;width:27px;height:27px;border-radius:7px;background:var(--deep);color:#9AF1DC;display:grid;place-items:center;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700}
.ph-n.opt{background:var(--page);color:var(--muted);border:1px solid var(--line2)}
.ph-t h2{font-size:16.5px}
.ph-t p{font-size:12.8px;color:var(--muted);margin-top:2px}
.ph-body{padding:18px}

/* node band */
.node{border:1px solid var(--line2);border-radius:10px;overflow:hidden}
.node+.node{margin-top:16px}
.node-h{display:flex;align-items:center;gap:11px;padding:10px 14px;background:var(--soft);border-bottom:1px solid var(--line2)}
.node-h .tag{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:var(--deep);color:#9AF1DC;padding:3px 9px;border-radius:5px}
.node-h .tag.sec{background:var(--page);color:var(--accent);border:1px solid var(--accent)}
.node-h .nm{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--deep)}
.node-h .ip{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);margin-left:auto;font-variant-numeric:tabular-nums}
.node-b{padding:14px}
.allbox{border:1px dashed var(--line2);border-radius:10px;padding:14px;background:var(--tint)}
.allbox+.allbox{margin-top:14px}

/* step */
.step{display:grid;grid-template-columns:26px minmax(0,1fr);gap:11px}
.step+.step{margin-top:15px;padding-top:15px;border-top:1px solid var(--line)}
.step .num{
  width:26px;height:26px;border-radius:50%;border:1.5px solid var(--accent);color:var(--accent);
  display:grid;place-items:center;font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;
}
.step .ttl{font-size:13.6px;font-weight:600;margin-bottom:7px;padding-top:3px}
.step .desc{font-size:12.7px;color:var(--muted);margin:-4px 0 8px;line-height:1.5}

/* command */
.cmd{border:1px solid var(--line2);border-radius:8px;overflow:hidden;background:var(--code)}
.cmd+.cmd,.exp+.cmd{margin-top:8px}
.cmd-bar{display:flex;align-items:center;gap:8px;padding:5px 6px 5px 11px;border-bottom:1px solid var(--line2);background:var(--page)}
.cmd-bar .lb{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--faint);flex:1}
.cp{border:1px solid var(--line2);background:var(--page);color:var(--accent);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:6px;flex:none}
.cp:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.cp.done{background:var(--ok);color:#fff;border-color:var(--ok)}
pre{margin:0;padding:10px 13px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:12.7px;line-height:1.7;color:var(--ink)}
pre .p{color:var(--accent);user-select:none}
pre .c{color:var(--faint)}
.exp{margin-top:8px;border:1px solid var(--ok-line);border-left:3px solid var(--ok);border-radius:0 8px 8px 0;background:var(--ok-bg);padding:8px 12px}
.exp .lb{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--ok);display:block;margin-bottom:4px}
.exp pre{padding:0;background:none;font-size:12.3px;line-height:1.65;color:#123}
.exp .txt{font-size:12.6px;line-height:1.5}
.exp b{color:var(--ok)}

/* gui step */
.gui{border:1px solid var(--gui-line);border-radius:8px;background:var(--gui-bg);padding:10px 13px;margin-top:8px}
.gui .lb{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--gui);display:block;margin-bottom:5px}
.path{font-family:'JetBrains Mono',monospace;font-size:12.2px;font-weight:500;color:#12306E;line-height:1.7}
.path span{background:#fff;border:1px solid var(--gui-line);border-radius:4px;padding:1.5px 6px;white-space:nowrap;display:inline-block}
.path i{font-style:normal;color:var(--gui);padding:0 3px}
.gui .txt{font-size:12.6px;line-height:1.5;margin-top:6px;color:#1D2B4A}
.gui .txt b{color:var(--gui)}

/* callouts */
.danger{background:var(--crit-bg);border:1px solid var(--crit-line);border-left:3px solid var(--crit);border-radius:0 8px 8px 0;padding:10px 13px;font-size:12.7px;line-height:1.5;margin-bottom:14px}
.danger b{color:var(--crit)}
.tip{background:var(--tint);border:1px solid var(--line);border-radius:8px;padding:10px 13px;font-size:12.7px;line-height:1.5;margin-bottom:14px}
.note{font-size:12.9px;color:var(--muted);margin-bottom:14px;line-height:1.55}

/* table */
.tblwrap{overflow-x:auto;border:1px solid var(--line);border-radius:9px;margin-bottom:14px}
table{border-collapse:collapse;width:100%;font-size:12.7px;min-width:420px}
th{text-align:left;padding:8px 12px;background:var(--tint);color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--line)}
td{padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
td.m{font-family:'JetBrains Mono',monospace;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
td.exp2{color:var(--muted)}

/* tests */
.prog{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.bar{flex:1;height:6px;border-radius:99px;background:var(--tint);border:1px solid var(--line);overflow:hidden}
.bar i{display:block;height:100%;background:var(--accent);width:0;transition:width .3s}
.prog span{font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}
.tests{display:grid;gap:9px}
.test{display:grid;grid-template-columns:auto 44px 1fr;gap:11px;align-items:start;padding:11px 13px;border:1px solid var(--line);border-radius:9px;cursor:pointer}
.test.hit{border-color:var(--accent);background:var(--soft)}
.test input{width:16px;height:16px;margin:2px 0 0;accent-color:var(--accent)}
.test .id{font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:var(--accent);padding-top:1px}
.test .tt{font-size:13.2px;font-weight:600;display:block;margin-bottom:2px}
.test .cr{font-size:12.4px;color:var(--muted);line-height:1.45;display:block}

.foot{margin-top:24px;padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:var(--tint)}
.foot h3{font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}
.foot ul{margin:0;padding-left:17px;font-size:12.3px;color:var(--muted);line-height:1.65}
.toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,80px);background:var(--deep);color:#9AF1DC;padding:9px 18px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;box-shadow:0 10px 30px -10px rgba(0,58,50,.5);opacity:0;transition:.25s;pointer-events:none;z-index:50}
.toast.on{transform:translate(-50%,0);opacity:1}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<header class="top">
  <div class="top-in">
    <div class="brand">
      <div class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9AF1DC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 4 5.5v6c0 5 3.4 9.2 8 10.5 4.6-1.3 8-5.5 8-10.5v-6L12 2Z"></path><path d="M9 12.2 11.2 14.5 15.4 10"></path>
        </svg>
      </div>
      <div><h1>Constructor de Clúster Segura</h1>
      <div class="sub">Segura® PAM On-Premises · runbook de alta disponibilidad, nodo por nodo</div></div>
    </div>
    <div class="top-note"><b>La consola gráfica ya no arma el clúster.</b> Desde 4.2.9 se eliminó
      <span class="inline">Orbit Server Manager &gt; Replication &gt; Settings</span>. La formación es Orbit CLI;
      la consola gráfica se usa para verificar (pasos marcados <b style="color:#1D4ED8">CONSOLA GRÁFICA</b>).</div>
  </div>
</header>

<div class="wrap">
<div class="grid">
  <aside>
    <div class="panel">
      <div class="sec-t">Topología</div>
      <div class="pad">
        <div class="row two">
          <div><label for="count">Nodos Segura®</label>
            <select id="count"><option value="2">2 nodos</option><option value="3">3 nodos</option><option value="4">4 nodos</option><option value="5">5 nodos</option></select></div>
          <div><label for="prefix">Prefijo</label>
            <select id="prefix"><option value="24">/24 · 255.255.255.0</option><option value="25">/25 · 255.255.255.128</option><option value="26">/26 · 255.255.255.192</option><option value="23">/23 · 255.255.254.0</option><option value="22">/22 · 255.255.252.0</option><option value="16">/16 · 255.255.0.0</option></select></div>
        </div>
        <label class="tg"><input type="checkbox" id="arb"><span><b>Árbitro (Arbitrator)</b><em>Host Docker 2 vCPU / 2 GB / 20 GB. Da failover automático con 2 nodos.</em></span></label>
        <label class="tg"><input type="checkbox" id="lb"><span><b>Balanceador externo</b><em>F5, HAProxy, NGINX o LB de nube frente a los nodos.</em></span></label>
        <label class="tg"><input type="checkbox" id="nc"><span><b>Network Connector</b><em>Agrega el setup del conector en todos los nodos.</em></span></label>
      </div>
      <div class="sec-t">Nodos</div>
      <div class="pad"><div id="nodes"></div></div>
      <div class="sec-t">Red compartida</div>
      <div class="pad">
        <div class="row two">
          <div><label for="gw">Gateway</label><input id="gw" value="172.17.13.1"></div>
          <div><label for="iface">Interfaz</label><input id="iface" value="eth0"></div>
        </div>
        <div class="row"><div><label for="dns">DNS (separados por coma)</label><input id="dns" value="172.17.13.100,172.17.13.101"></div></div>
        <div class="row two">
          <div><label for="dom">Dominio</label><input id="dom" value="inntech.local"></div>
          <div><label for="ntp">NTP</label><input id="ntp" value="172.17.13.100"></div>
        </div>
        <div class="row"><div><label for="recip">IPs permitidas para Recovery (CIDR, sin comodines)</label><input id="recip" value="172.17.13.0/24"></div></div>
        <div class="row two">
          <div id="arbBox" hidden><label for="arbip">IP del árbitro</label><input id="arbip" value="172.17.13.210"></div>
          <div id="lbBox" hidden><label for="lbip">IP del balanceador</label><input id="lbip" value="172.17.13.200"></div>
        </div>
      </div>
      <div class="sec-t">Veredicto de la topología</div>
      <div class="pad"><div id="verdict"></div></div>
    </div>
  </aside>
  <main id="out"></main>
</div>

<div class="foot">
  <h3>Fuentes oficiales</h3>
  <ul>
    <li><i>How to manage a cluster</i> — docs.senhasegura.io/docs/orbit-cli-how-to-manage-the-cluster</li>
    <li><i>About high availability and disaster recovery</i> · <i>Firewall rules for the Segura® Platform</i> · <i>About Load Balancing</i></li>
    <li><i>Requirements for Data Replication</i> · <i>Data replication status reports</i> · <i>How to enable Recovery</i></li>
    <li><i>How to perform a Disaster Recovery test</i> · <i>Recovery Settings</i> (referencia de la pantalla Orbit)</li>
    <li><i>About the App Primary Failover</i> · <i>Segura® Arbitrator requirements</i> · <i>How to perform a SST manually</i></li>
    <li>Release notes 4.2.9 — SSGR-10279 y SSGR-10841 (retiro de la configuración de clúster en la consola gráfica)</li>
  </ul>
</div>
</div>
<div class="toast" id="toast">Copiado</div>

<script>
"use strict";
var MASKS={16:"255.255.0.0",22:"255.255.252.0",23:"255.255.254.0",24:"255.255.255.0",25:"255.255.255.128",26:"255.255.255.192"};
var LS="segura-cluster-v2";
var state={count:2,prefix:"24",arb:false,lb:false,nc:false,gw:"172.17.13.1",iface:"eth0",
  dns:"172.17.13.100,172.17.13.101",dom:"inntech.local",ntp:"172.17.13.100",
  arbip:"172.17.13.210",lbip:"172.17.13.200",recip:"172.17.13.0/24",
  nodes:[{h:"pml-lphi-pam",ip:"172.17.13.201"},{h:"pml-lphi-pam2",ip:"172.17.13.202"},
         {h:"pml-lphi-pam3",ip:"172.17.13.203"},{h:"pml-lphi-pam4",ip:"172.17.13.204"},
         {h:"pml-lphi-pam5",ip:"172.17.13.205"}],tests:{}};
try{var r=localStorage.getItem(LS);if(r){var s=JSON.parse(r);for(var k in s)if(s[k]!==undefined)state[k]=s[k];}}catch(e){}
function save(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}
var $=function(i){return document.getElementById(i);};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function act(){return state.nodes.slice(0,state.count);}
function members(){return state.count+(state.arb?1:0);}
function apfOK(){var m=members();return m>=3&&m%2===1;}
function L(s){return s.split(",").map(function(x){return x.trim();}).filter(Boolean);}

/* ---------- builders ---------- */
function cmd(label,lines){
  var plain=lines.filter(function(l){return l[0]!=="#";}).join("\\n");
  var html=lines.map(function(l){
    return l[0]==="#" ? '<span class="c">'+esc(l)+'</span>' : '<span class="p">$</span> '+esc(l);
  }).join("\\n");
  return '<div class="cmd"><div class="cmd-bar"><span class="lb">'+esc(label)+'</span>'+
    '<button class="cp" type="button" data-cmd="'+esc(plain)+'">Copiar</button></div><pre>'+html+'</pre></div>';
}
function expOut(lines){
  return '<div class="exp"><span class="lb">Salida esperada</span><pre>'+esc(lines.join("\\n"))+'</pre></div>';
}
function expTxt(html){
  return '<div class="exp"><span class="lb">Resultado esperado</span><div class="txt">'+html+'</div></div>';
}
function guiStep(path,txt){
  var crumbs=path.map(function(p){return '<span>'+esc(p)+'</span>';}).join('<i>›</i>');
  return '<div class="gui"><span class="lb">Consola gráfica</span><div class="path">'+crumbs+'</div>'+
    (txt?'<div class="txt">'+txt+'</div>':'')+'</div>';
}
function step(n,title,desc,body){
  return '<div class="step"><div class="num">'+n+'</div><div><div class="ttl">'+title+'</div>'+
    (desc?'<div class="desc">'+desc+'</div>':'')+body+'</div></div>';
}
function nodeBand(i,n,body){
  return '<div class="node"><div class="node-h">'+
    '<span class="tag'+(i===0?"":" sec")+'">Nodo '+(i+1)+'</span>'+
    '<span class="nm">'+esc(n.h)+'</span>'+
    '<span class="pill '+(i===0?"pri":"sec")+'">'+(i===0?"Primario":"Secundario")+'</span>'+
    '<span class="ip">'+esc(n.ip)+'</span></div><div class="node-b">'+body+'</div></div>';
}
function allBand(title,body){
  return '<div class="allbox"><div class="node-h" style="background:none;border:0;padding:0 0 10px">'+
    '<span class="tag sec">'+esc(title)+'</span></div>'+body+'</div>';
}
function phase(n,t,d,body,opt){
  return '<section class="phase"><div class="ph-head"><div class="ph-n'+(opt?" opt":"")+'">'+n+'</div>'+
    '<div class="ph-t"><h2>'+t+'</h2><p>'+d+'</p></div></div><div class="ph-body">'+body+'</div></section>';
}

/* ---------- runbook ---------- */
function build(){
  var N=act(),mask=MASKS[state.prefix],pri=N[0],h="",dnsL=L(state.dns),ntpL=L(state.ntp);

  /* ===== FASE 1 ===== */
  var b='<p class="note">Cada nodo se prepara por separado y termina apagado para el snapshot. El hostname y la red exigen reinicio: se aplican juntos y se reinicia una sola vez.</p>';
  N.forEach(function(n,i){
    var s="";
    s+=step(1,"Ver el estado actual antes de tocar nada","Guarda esta salida: es tu punto de retorno.",
      cmd("Nodo "+(i+1)+" · lectura",["sudo orbit hostname --show","sudo orbit network --show"])+
      expTxt('Anota la IP, la máscara y el <b>gateway</b>. Si el campo <span class="inline">Gateway =</span> aparece <b>vacío</b> aunque la tabla de ruteo sí tenga la ruta por omisión, la ruta no está declarada en Orbit y se pierde al reiniciar: el paso 2 la fija.'));
    s+=step(2,"Fijar hostname e IP","Un solo reinicio aplica ambos cambios.",
      cmd("Nodo "+(i+1)+" · identidad y red",[
        "sudo orbit hostname "+n.h,
        "sudo orbit network -i "+state.iface+" -a "+n.ip+" -m "+mask+" -g "+state.gw,
        "sudo orbit shutdown -r"])+
      expTxt('El equipo reinicia. Al volver, <span class="inline">sudo orbit network --show</span> debe mostrar <span class="inline">Address = '+esc(n.ip)+'</span> y <span class="inline">Gateway = '+esc(state.gw)+'</span> (ya no vacío).'));
    s+=step(3,"DNS y dominio","Se aplica de inmediato, sin reinicio.",
      cmd("Nodo "+(i+1)+" · DNS",[
        "sudo orbit dns -s "+dnsL.join(",")+" --domain "+state.dom,
        "sudo orbit dns --show"])+
      expOut(["? Are you sure you want to proceed? [y/N] y","Done!","No errors reported"]));
    s+=step(4,"NTP y reloj","Relojes desincronizados rompen la replicación y afectan los tokens OTP.",
      cmd("Nodo "+(i+1)+" · NTP",["sudo orbit ntp -s "+ntpL.join(","),"sudo orbit ntp --show","timedatectl"])+
      expTxt('<span class="inline">System clock synchronized: yes</span> y <span class="inline">NTP service: active</span>. La hora debe coincidir entre los '+state.count+' nodos.'));
    s+=step(5,"Salida al repositorio del fabricante","No uses <span class=\\"inline\\">ping 8.8.8.8</span>: el ICMP suele ir bloqueado y da un falso negativo. Lo que importa es el acceso a los mirrors.",
      cmd("Nodo "+(i+1)+" · alcance a mirrors",[
        "curl -sSI https://deb.senhasegura.com/ | head -1",
        "curl -sSI https://security.senhasegura.com/ | head -1"])+
      expOut(["HTTP/1.1 200 OK","HTTP/1.1 200 OK"])+
      '<div class="tip" style="margin:8px 0 0">Si responde <span class="inline">000</span> o se cuelga, abre el egress <b>443/TCP</b> hacia esos FQDN. Segura® no soporta proxy salvo el APT proxy y el proxy Fajita.</div>');
    s+=step(6,"Nivelar la versión","Todos los nodos deben quedar en la misma versión exacta.",
      cmd("Nodo "+(i+1)+" · versión",["sudo orbit version","sudo orbit upgrade --check","sudo orbit upgrade","sudo orbit shutdown -r"])+
      expTxt('<span class="inline">sudo orbit version</span> devuelve la <b>misma</b> cadena en los '+state.count+' nodos. Si <span class="inline">--check</span> no lista nada, ya está al día y puedes saltar el <span class="inline">upgrade</span>.'));
    s+=step(7,"Respaldar y apagar para el snapshot","",
      cmd("Nodo "+(i+1)+" · respaldo",["sudo orbit backup create","sudo orbit shutdown"])+
      expTxt('El backup termina sin error y la instancia se apaga limpia. <b>Ahora</b> toma el snapshot en el hipervisor, enciéndela y valida que suba antes de pasar al nodo siguiente.'));
    b+=nodeBand(i,n,s);
  });
  b+='<div class="danger" style="margin:16px 0 0"><b>Orden de los snapshots:</b> en clúster se toman en orden inverso, del último nodo hacia el primario, uno a la vez y con la instancia apagada.</div>';
  h+=phase(1,"Preparación individual de cada nodo","Identidad, red, tiempo, versión y respaldo. Todavía no existe el clúster.",b);

  /* ===== FASE 2 ===== */
  b='<p class="note">La documentación oficial verifica cuatro puertos; la tabla completa de reglas de firewall exige más. Ejecuta el chequeo corto y, si algo falla después, revisa la tabla.</p>';
  b+='<div class="danger"><b>Dos cosas que este chequeo NO significa lo que parece.</b><br>'+
    '<b>1. El ping falla siempre.</b> Segura® trae el ICMP cerrado por hardening: <span class="inline">ping</span> entre instancias devuelve 100% de pérdida aunque la red esté perfecta. Mide la latencia con el <span class="inline">curl</span> del paso 3, no con ping.<br>'+
    '<b>2. Ver <span class="inline">filtered</span> en este punto es normal.</b> Antes de formar el clúster el firewall de cada instancia no conoce a las otras. Los puertos de replicación se abren entre miembros una vez declarada y aplicada la topología. Lo que bloquea el proyecto es un <span class="inline">filtered</span> que <b>siga</b> ahí después del apply — por eso la fase 6 repite este chequeo.</div>';
  b+='<div class="tblwrap"><table><thead><tr><th>Puerto</th><th>Proto</th><th>Servicio</th><th>Exigido por<br>replicación</th><th>Chequeo<br>corto</th></tr></thead><tbody>'+
    [["22","TCP","SSH","sí",""],["80","TCP","HTTP","",""],["443","TCP","HTTPS","sí","sí"],["3306","TCP","MariaDB","sí",""],
     ["4248","TCP","Segura® Sync (réplica de archivos)","","sí"],["4444","TCP","Galera SST","sí",""],
     ["4567","TCP + UDP","Galera TRAM (replicación)","sí","sí (TCP)"],["4568","TCP","Galera IST","sí",""],
     ["9300","TCP","Elasticsearch","sí","sí"],["59022","TCP","Segura® SSH interno","sí",""]]
    .map(function(r){return '<tr><td class="m">'+r[0]+'</td><td class="m">'+r[1]+'</td><td class="exp2">'+r[2]+'</td><td class="m" style="color:var(--ok)">'+r[3]+'</td><td class="m" style="color:var(--accent)">'+r[4]+'</td></tr>';}).join("")+
    '</tbody></table></div>'+
    '<div class="tip"><b>Dos listas distintas, ambas oficiales.</b> <i>Requirements for Data Replication</i> exige TCP 22, 443, 3306, 4444, 4567, 4568, 9300 y 59022 más UDP 4567 entre todas las instancias. <i>Firewall rules</i> agrega 80 y 4248. Abre la unión de las dos: son diez puertos TCP y uno UDP.</div>';
  N.forEach(function(n,i){
    var others=N.filter(function(_,j){return j!==i;});
    if(state.arb)others=others.concat([{h:"árbitro",ip:state.arbip}]);
    var short=[],full=[],lat=[];
    others.forEach(function(o){
      short.push("nmap -p 9300,4567,4248,443 "+o.ip);
      full.push("nmap -p 22,80,443,3306,4248,4444,4567,4568,9300,59022 "+o.ip);
      full.push("sudo nmap -sU -p 4567 "+o.ip);
      lat.push('curl -k -s -o /dev/null -w "'+o.h+' DNS: %{time_namelookup}s Conexion: %{time_connect}s TLS: %{time_appconnect}s Total: %{time_total}s\\\\n" https://'+o.ip+':443');
    });
    var s=step(1,"Chequeo corto (el de la documentación)","Contra "+(others.length===1?"el otro nodo":"cada uno de los otros "+others.length)+".",
      cmd("Nodo "+(i+1)+" · alcance",short)+
      expOut(["PORT     STATE SERVICE","443/tcp  open  https","4248/tcp open  unknown","4567/tcp open  tram","9300/tcp open  vrace"])+
      '<div class="tip" style="margin:8px 0 0"><b>443 tiene que estar <span class="inline">open</span> sí o sí</b> — es el que prueba que hay ruta y que la instancia responde. Los de replicación pueden salir <span class="inline">filtered</span> a estas alturas.</div>');
    s+=step(2,"Chequeo completo de puertos de clúster","Incluye el UDP 4567 que Galera necesita para el gossip. Sirve como línea base: anota qué sale open y qué sale filtered para compararlo después del apply.",
      cmd("Nodo "+(i+1)+" · alcance completo",full)+
      expTxt('<b>Antes del clúster:</b> 443 en <span class="inline">open</span>; 22 y 59022 normalmente <span class="inline">open</span>; los de replicación (3306, 4444, 4567, 4568, 9300, 4248) pueden aparecer <span class="inline">filtered</span>. El UDP 4567 casi siempre reporta <span class="inline">open|filtered</span>: nmap no puede distinguirlos en UDP.<br><b>Después del apply (fase 6):</b> los diez TCP en <span class="inline">open</span> entre miembros.'));
    s+=step(3,"Latencia — con curl, no con ping","Segura® trae el ICMP cerrado por hardening, así que <span class=\\"inline\\">ping</span> devuelve 100% de pérdida aunque la red esté bien. Este <span class=\\"inline\\">curl</span> mide el handshake real contra el 443.",
      cmd("Nodo "+(i+1)+" · latencia por TLS",lat)+
      expOut(['pml-ejemplo DNS: 0.000021s Conexion: 0.000512s TLS: 0.021834s Total: 0.024102s'])+
      '<div class="tip" style="margin:8px 0 0"><b>Lo que hay que leer es <span class="inline">Conexión</span>:</b> es el tiempo de handshake TCP y es el equivalente al RTT que exige Galera — debe quedar <b>por debajo de 30 ms (0.030 s)</b>. <span class="inline">TLS</span> siempre será mayor porque incluye el cifrado; no lo compares contra el límite. Repite el comando 3 o 4 veces: un valor aislado no dice nada.</div>');
    s+=step(4,"Si necesitas habilitar el ping para diagnosticar","Opcional. Solo si tu procedimiento de red exige ICMP; no es requisito del clúster.",
      cmd("Nodo "+(i+1)+" · abrir ICMP hacia un host",["sudo orbit firewall icmp enable --host="+others[0].ip,"sudo orbit firewall --show"])+
      '<div class="tip" style="margin:8px 0 0"><b>Debe validarse:</b> la referencia oficial documenta el argumento <span class="inline">icmp</span> con el flag <span class="inline">--host</span>, pero otras páginas lo muestran como <span class="inline">--ip</span>. Corre <span class="inline">sudo orbit firewall --help</span> en tu versión antes de usarlo, y deshabilítalo al terminar el diagnóstico con <span class="inline">icmp disable</span>.</div>');
    b+=nodeBand(i,n,s);
  });
  h+=phase(2,"Firewall, alcance y latencia","Verificación bidireccional antes de declarar nada.",b);

  /* ===== FASE 3 ===== */
  b='<p class="note">Los mismos tres comandos en cada nodo. Si uno solo falla, se detiene el procedimiento.</p>';
  N.forEach(function(n,i){
    var s=step(1,"La instancia está sana y en modo standalone","",
      cmd("Nodo "+(i+1)+" · estado de la aplicación",["sudo orbit app status"])+
      expOut(["Application: Active","Replication: Inactive","Instance:    Primary","Node Name:   "+n.h,"Maintenance: No","Main:        Yes"])+
      '<div class="tip" style="margin:8px 0 0"><b>Antes</b> del clúster todos los nodos dicen <span class="inline">Instance: Primary</span> y <span class="inline">Main: Yes</span>: es correcto, cada uno es todavía independiente.</div>');
    s+=step(2,"Todos los servicios arriba","",
      cmd("Nodo "+(i+1)+" · servicios",["sudo orbit services list"])+
      expTxt('Cada servicio listado con <span class="inline">Active: active (running)</span>. Ninguno en <span class="inline">failed</span> ni <span class="inline">inactive (dead)</span>.'));
    s+=step(3,"Versión idéntica","",
      cmd("Nodo "+(i+1)+" · versión",["sudo orbit version"])+
      expTxt('La misma cadena de versión que los otros '+(state.count-1)+' nodo'+(state.count>2?"s":"")+'. Cualquier diferencia obliga a repetir el paso 6 de la fase 1.'));
    s+=step(4,"Confirmación en la consola gráfica","",
      guiStep(["Orbit Server Manager","Server","Services"],'Todos los servicios en verde.')+
      guiStep(["Orbit Server Manager","Application","Licenses"],'Licencia <b>activa</b> y vigente en este nodo. Cada nodo se licencia por separado.'));
    b+=nodeBand(i,n,s);
  });
  h+=phase(3,"Pre-flight en cada nodo","Standalone, sano, licenciado y en la misma versión.",b);

  /* ===== FASE 4 ===== */
  b='<div class="danger"><b>Configura todos, aplica ninguno.</b> No pases a la fase 5 hasta que <span class="inline">orbit cluster configure</span> haya terminado en los '+state.count+' nodos. Los valores deben ser idénticos, incluido el <b>orden</b> de las IPs secundarias: una diferencia puede causar caída del servicio o pérdida de datos.</div>';
  N.forEach(function(n,i){
    var wiz='<div class="tblwrap" style="margin:8px 0 0"><table><thead><tr><th>El asistente pregunta</th><th>Responde exactamente</th></tr></thead><tbody>'+
      '<tr><td class="exp2">Cluster primary IP:</td><td class="m">'+esc(pri.ip)+'</td></tr>';
    N.slice(1).forEach(function(o,j){wiz+='<tr><td class="exp2">&nbsp;&nbsp;Secondary IP #'+(j+1)+' (blank to finish):</td><td class="m">'+esc(o.ip)+'</td></tr>';});
    wiz+='<tr><td class="exp2">&nbsp;&nbsp;Secondary IP #'+state.count+' (blank to finish):</td><td class="m">(Enter en blanco)</td></tr>'+
      '<tr><td class="exp2">Arbiter IP (blank for none):</td><td class="m">'+(state.arb?esc(state.arbip):"(Enter en blanco)")+'</td></tr></tbody></table></div>';
    var s=step(1,"Lanzar el asistente","",cmd("Nodo "+(i+1)+" · declarar topología",["sudo orbit cluster configure"])+wiz);
    s+=step(2,"Revisar el resumen antes de confirmar","Este resumen es la única oportunidad de detectar un dedazo.","" +
      expOut(["Configuration summary:",
        "  mode       : cluster",
        "  role       : "+(i===0?"primary":"secondary"),
        "  file sync  : true",
        "  primary    : "+pri.ip,
        "  secondaries: "+N.slice(1).map(function(o){return o.ip;}).join(", "),
        "  arbiter    : "+(state.arb?state.arbip:"(none)")])+
      '<div class="tip" style="margin:8px 0 0">El campo <span class="inline">role</span> es el único que cambia entre nodos: <b>'+(i===0?"primary":"secondary")+'</b> en este. Todo lo demás debe ser idéntico carácter por carácter en los '+state.count+' nodos.</div>');
    b+=nodeBand(i,n,s);
  });
  h+=phase(4,"Declarar la topología en cada nodo","<span class=\\"inline\\">orbit cluster configure</span> — mismo valor, mismo orden, en todos.",b);

  /* ===== FASE 5 ===== */
  b='<div class="danger"><b>Un nodo a la vez, en este orden.</b> Ejecutar <span class="inline">orbit cluster apply</span> en paralelo, o arrancar el nodo siguiente antes de que el anterior sincronice, hace fallar la formación del clúster.</div>';
  N.forEach(function(n,i){
    var s=step(1,"Abrir una sesión screen","El proceso es largo. Si se cae la SSH sin screen, se corta a la mitad.",
      cmd("Nodo "+(i+1)+" · sesión persistente",["sudo screen -S cluster"])+
      expTxt('Entra a una terminal limpia dentro de screen. Si se corta la conexión, reconecta por SSH y recupera con <span class="inline">sudo screen -r cluster</span>.'));
    s+=step(2,"Aplicar la configuración","Puede tardar varios minutos. No lo interrumpas.",
      cmd("Nodo "+(i+1)+" · aplicar",["sudo orbit cluster apply"])+
      expOut(["Cluster apply completed on this node. Verify with 'orbit cluster status'."]));
    s+=step(3,"Confirmar la sincronización de Galera",
      (i<N.length-1?"Obligatorio antes de pasar al nodo "+(i+2)+".":"Último nodo: con esto el clúster queda formado."),
      cmd("Nodo "+(i+1)+" · sincronización",['grep "Synchronized with group, ready for connections" /var/log/mysql/mysql-error.log'])+
      expOut(["2026-09-09 12:41:07 0 [Note] WSREP: Synchronized with group, ready for connections"])+
      '<div class="'+(i<N.length-1?"danger":"tip")+'" style="margin:8px 0 0">'+
      (i<N.length-1
        ? '<b>Alto.</b> Si este grep no devuelve nada, el nodo aún no sincronizó. Espera y repite. <b>No inicies el nodo '+(i+2)+'</b> hasta verlo.'
        : 'Con este nodo sincronizado, los '+state.count+' miembros están en el clúster. Pasa a la verificación.')+'</div>');
    b+=nodeBand(i,n,s);
  });
  h+=phase(5,"Aplicar la configuración, nodo por nodo","<span class=\\"inline\\">orbit cluster apply</span> — orden estricto, empezando por el primario.",b);

  /* ===== FASE 6 ===== */
  b='<p class="note">Los mismos comandos en cada nodo. El clúster está operativo <b>solo</b> cuando todos reportan Active / Active / Cluster. El paso 5 repite el chequeo de puertos de la fase 2: es ahora, con el clúster formado, cuando deben estar abiertos.</p>';
  N.forEach(function(n,i){
    var s=step(1,"Estado del clúster","",
      cmd("Nodo "+(i+1)+" · clúster",["sudo orbit cluster status"])+
      expOut(["Cluster status",
        "  mode           : cluster",
        "  declared role  : "+(i===0?"primary":"secondary"),
        "  primary node   : "+pri.ip,
        "  this is primary: "+(i===0?"true":"false"),
        "  galera         : healthy (Synced)",
        "  nats           : managed",
        "  elasticsearch  : managed",
        "Cluster is healthy."]));
    s+=step(2,"Estado de la aplicación","",
      cmd("Nodo "+(i+1)+" · aplicación",["sudo orbit app status"])+
      expOut(["Application: Active",
        "Replication: Active",
        "Instance:    Cluster",
        "Node Name:   cluster"+(i+1)+"_<id>",
        "Primary:     cluster1_<id>",
        "Main:        "+(i===0?"Yes":"No")]));
    s+=step(3,"Elasticsearch","",
      cmd("Nodo "+(i+1)+" · elasticsearch",["sudo orbit elasticsearch status"])+
      expOut(['"status" : "green"','"number_of_nodes" : '+state.count,'"number_of_data_nodes" : '+state.count,'"unassigned_shards" : 0']));
    s+=step(4,"Galera a nivel base de datos","",
      cmd("Nodo "+(i+1)+" · wsrep",['sudo mysql -e "SHOW STATUS LIKE \\'wsrep_%\\';" | grep -E "wsrep_cluster_size|wsrep_cluster_status|wsrep_ready|wsrep_connected|wsrep_local_state_comment"'])+
      expOut(["wsrep_cluster_size          "+state.count,
        "wsrep_cluster_status        Primary",
        "wsrep_ready                 ON",
        "wsrep_connected             ON",
        "wsrep_local_state_comment   Synced"]));
    s+=step(5,"Re-chequeo de puertos — ahora sí deben estar abiertos","En la fase 2 era normal ver <span class=\\"inline\\">filtered</span>. Con el clúster ya aplicado, Segura® permite el tráfico de replicación entre miembros: este es el chequeo que cuenta.",
      cmd("Nodo "+(i+1)+" · puertos entre miembros",
        N.filter(function(_,j){return j!==i;}).map(function(o){return "nmap -p 22,80,443,3306,4248,4444,4567,4568,9300,59022 "+o.ip;}))+
      expTxt('Los <b>diez puertos TCP en <span class="inline">open</span></b> contra cada uno de los otros miembros. Un <span class="inline">filtered</span> que sobreviva al apply sí es un bloqueo real: revisa el firewall de red entre los segmentos, no la configuración de Segura®.'));
    b+=nodeBand(i,n,s);
  });
  h+=phase(6,"Verificación por CLI en cada nodo","Cinco comprobaciones por nodo, con la salida exacta que debes ver.",b);

  /* ===== FASE 7: GUI ===== */
  var url="https://"+(state.lb?state.lbip:pri.ip)+"/";
  b='<p class="note">Entra a <span class="inline">'+esc(url)+'</span> con un usuario administrador. Estas cuatro pantallas confirman lo mismo que la CLI y son la evidencia que se entrega al cliente.</p>';
  b+=allBand("Pantalla 1 · Replication status report",
    step(1,"Abrir el reporte de estado de replicación","La pantalla de configuración desapareció en 4.2.9; la de estado sigue ahí.",
      guiStep(["Orbit Server Manager","Replication","Status"],
        'Los <b>'+state.count+'</b> miembros listados, todos en <b>ON</b> y sincronizados. Ningún miembro en rojo ni en <span class="inline">Disabled</span>.'))+
    step(2,"Leer los cinco campos de Local server","",
      '<div class="tblwrap" style="margin:0"><table><thead><tr><th>Campo</th><th>Valor exigido en '+esc(pri.h)+' (nodo 1)</th></tr></thead><tbody>'+
      '<tr><td class="exp2">Replication status</td><td class="m">Enabled</td></tr>'+
      '<tr><td class="exp2">Instance type</td><td class="m">Primary</td></tr>'+
      '<tr><td class="exp2">Operating Mode</td><td class="m">Enabled</td></tr>'+
      '<tr><td class="exp2">Last sync</td><td class="m">fecha y hora de hace segundos, no de hace horas</td></tr>'+
      '<tr><td class="exp2">Authentication token</td><td class="m">presente</td></tr>'+
      '</tbody></table></div>'+
      '<div class="tip" style="margin:8px 0 0">En los secundarios el mismo reporte debe decir <b>Instance type: Secondary</b> y un <b>Last sync</b> igual de reciente. Un <span class="inline">Last sync</span> viejo con la CLI diciendo <span class="inline">Synced</span> apunta a la réplica de archivos (puerto 4248), no a Galera.</div>'));
  b+=allBand("Pantalla 2 · Elasticsearch cluster status report",
    step(3,"Abrir el reporte de Elasticsearch","",
      guiStep(["Orbit Server Manager","Replication","Elasticsearch"],
        'Es la pantalla que la documentación usa para validar el clúster antes de una prueba de DR.'))+
    step(4,"Revisar las tres tablas","",
      '<div class="tblwrap" style="margin:0"><table><thead><tr><th>Tabla</th><th>Campo</th><th>Valor exigido</th></tr></thead><tbody>'+
      '<tr><td class="exp2" rowspan="4">Data search cluster</td><td class="m">Status</td><td class="m">green</td></tr>'+
      '<tr><td class="m">Size</td><td class="m">'+state.count+'</td></tr>'+
      '<tr><td class="m">Primary</td><td class="exp2">identificador del nodo 1</td></tr>'+
      '<tr><td class="m">Timed out</td><td class="m">false</td></tr>'+
      '<tr><td class="exp2">Cluster members</td><td class="m">Address</td><td class="exp2">'+N.map(function(n){return esc(n.ip)+":9300";}).join(" · ")+'</td></tr>'+
      '<tr><td class="exp2">Indexes</td><td class="m">Health</td><td class="m">green en todos los índices</td></tr>'+
      '</tbody></table></div>'+
      '<div class="tip" style="margin:8px 0 0">Amarillo = réplicas sin asignar; rojo = datos no disponibles. Si <b>Size</b> no coincide con <b>'+state.count+'</b>, un nodo no entró al clúster aunque su propia CLI diga lo contrario.</div>'));
  b+=allBand("Pantalla 3 · Tamaño del clúster en el tablero",
    step(5,"Confirmar el conteo de miembros","",
      guiStep(["Dashboard","tarjeta Cluster size"],
        'El campo <b>Members</b> muestra <b>'+state.count+'</b> y <b>Enabled Recordings</b> refleja las grabaciones del clúster.')));
  b+=allBand("Pantalla 4 · Indicador permanente y evidencia",
    step(6,"Revisar el pie del Orbit Server Manager","",
      guiStep(["Orbit Server Manager","pie de página"],
        'El indicador <b>Replication</b> debe reflejar el estado real también en los secundarios. Si un secundario muestra <span class="inline">Replication: Disabled</span> con la CLI diciendo <span class="inline">Active</span>, es el bug SSGR-10843: se corrige actualizando a 4.2.9 o superior.'))+
    step(7,"Guardar la evidencia","",
      '<div class="tip" style="margin:0">Captura las cuatro pantallas. Junto con la salida de <span class="inline">orbit cluster status</span> de cada nodo son el acta de entrega del clúster.</div>'));
  h+=phase(7,"Verificación en la consola gráfica","Cuatro pantallas, campo por campo, con el valor exigido.",b);

  /* ===== FASE 8: Recovery e IPs permitidas ===== */
  var RIP=state.recip;
  b='<p class="note"><b>Recovery</b> es la función que hace visible el botón <b>Assume as Primary</b> y habilita el control remoto de las instancias por HTTPS. Sin las IPs permitidas capturadas, la prueba de failover de la fase 9 <b>no se puede ejecutar</b>: el botón nunca aparece.</p>';
  b+='<div class="danger"><b>Dos reglas sobre las IPs.</b> No uses comodines (<span class="inline">*</span>). Para subredes usa notación CIDR, por ejemplo <span class="inline">192.168.1.0/24</span>. Habilita únicamente las IPs que realmente van a administrar la aplicación.</div>';
  N.forEach(function(n,i){
    var st=step(1,"Abrir la pantalla de Recovery","",
      guiStep(["Products Menu","Orbit Server Manager","Settings","Recovery"],'Formulario <b>Recovery settings</b> de este nodo.'));
    st+=step(2,"Capturar las IPs que podrán ejecutar el recovery","Este campo es el que hace visible el botón <b>Assume as Primary</b>.",
      '<div class="tblwrap" style="margin:0"><table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>'+
      '<tr><td class="exp2">Allowed origin IPs to perform system recovery</td><td class="m">'+esc(RIP)+'</td></tr>'+
      '<tr><td class="exp2">Recovery screen display message</td><td class="exp2">Mensaje propio para el operador, opcional</td></tr>'+
      '</tbody></table></div>');
    st+=step(3,"Habilitar la activación remota","Permite que un balanceador o un monitor active y desactive la instancia por HTTPS.",
      '<div class="tblwrap" style="margin:0"><table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>'+
      '<tr><td class="exp2">Allow system remote activation</td><td class="m">Activado</td></tr>'+
      '<tr><td class="exp2">Allowed origin IPs to perform system remote activation</td><td class="m">'+esc(RIP)+'</td></tr>'+
      '</tbody></table></div>'+
      guiStep(["Recovery settings","Save"],'Guardar. <b>Repite esta pantalla en los '+state.count+' nodos:</b> la configuración de Recovery no se replica sola.'));
    st+=step(4,"Probar la URL de monitoreo desde una IP permitida","",
      cmd("Nodo "+(i+1)+" · monitoreo",[\'curl -sk -o /dev/null -w "%{http_code}\\\\n" https://\'+n.ip+\'/flow/orbit/mntr\'])+
      expOut([i===0?"200":"203"])+
      '<div class="tip" style="margin:8px 0 0">'+(i===0
        ? '<b>200</b> porque este nodo es el primario y está activo.'
        : '<b>203</b> es lo correcto en un secundario: activo pero no primario. Un <b>403</b> aquí significa instancia inactiva, no un problema de permisos.')+
      ' Desde una IP fuera de la lista la URL no responde con el estado.</div>');
    b+=nodeBand(i,n,st);
  });
  b+=allBand("Tabla de códigos de la URL de monitoreo",
    '<div class="tblwrap" style="margin:0 0 12px"><table><thead><tr><th>Código</th><th>Significado</th></tr></thead><tbody>'+
    '<tr><td class="m" style="color:var(--ok)">HTTP 200</td><td class="exp2">Aplicación activa y disponible.</td></tr>'+
    '<tr><td class="m" style="color:var(--ok)">HTTP 203</td><td class="exp2">Aplicación activa pero no es la primaria.</td></tr>'+
    '<tr><td class="m" style="color:var(--crit)">HTTP 403</td><td class="exp2">Aplicación inactiva y no disponible.</td></tr>'+
    '<tr><td class="m" style="color:var(--crit)">HTTP 451</td><td class="exp2">Licencia de activación vencida.</td></tr>'+
    '<tr><td class="m" style="color:var(--crit)">HTTP 503</td><td class="exp2">Aplicación no disponible.</td></tr>'+
    '</tbody></table></div>'+
    '<p class="note" style="margin:0 0 8px">Estos dos endpoints permiten que un sistema externo controle el clúster. Úsalos solo con un procedimiento escrito detrás.</p>'+
    cmd("Activar una instancia (la vuelve primaria)",["curl -sk https://"+pri.ip+"/flow/orbit/mntr/activate"])+
    expTxt('La instancia queda disponible para usuarios y <b>pasa a ser la primaria</b>; la que era primaria deja de serlo. Las demás instancias <b>no</b> se desactivan solas.')+
    cmd("Desactivar una instancia",["curl -sk https://"+(N[1]?N[1].ip:pri.ip)+"/flow/orbit/mntr/deactivate"])+
    expTxt('La instancia queda no disponible. Si era la primaria, <b>no se elige una nueva primaria automáticamente</b> y ninguna otra instancia se activa.')+
    '<div class="danger" style="margin:12px 0 0"><b>Riesgo de dejar el servicio sin ninguna instancia activa.</b> Desactivar todas a la vez interrumpe la operación y no hay elección automática que lo revierta. Lleva control de cuál instancia está activa antes de invocar <span class="inline">/deactivate</span>.</div>');
  h+=phase(8,"Recovery e IPs permitidas","Requisito previo de la prueba de failover. Se captura en la consola gráfica, nodo por nodo.",b);

  /* ===== FASE 9: prueba de failover / DR ===== */
  var A=N[0],B=N[1];
  b='<p class="note">Failover manual controlado: se apaga el primario <b>de golpe</b> y se promueve el secundario desde la consola gráfica. Es la prueba que acredita el HA ante el cliente.</p>';
  if(state.count>2)b+='<div class="tip">El procedimiento oficial está escrito para <b>dos</b> miembros. Con '+state.count+' nodos, ejecútalo entre el nodo 1 ('+esc(A.h)+') y el nodo 2 ('+esc(B.h)+'), y mantén los demás arriba para conservar el quórum.</div>';
  b+='<div class="danger"><b>El apagado del primario debe ser abrupto.</b> Si usas <span class="inline">orbit shutdown</span> u otro apagado ordenado, el clúster detecta la baja limpiamente, el nodo 2 <b>no</b> entra en split brain y la pantalla de Recovery nunca aparece. Usa <i>Power Off</i> del hipervisor, no <i>Shut Down Guest</i>.</div>';

  b+=allBand("Estado inicial exigido — verificar las etiquetas al pie de cada miembro",
    '<div class="tblwrap" style="margin:0"><table><thead><tr><th>Miembro</th><th>Application</th><th>Replication</th></tr></thead><tbody>'+
    '<tr><td class="exp2"><b>A</b> · nodo 1 · '+esc(A.h)+'</td><td class="m">Production and Enabled</td><td class="m">Primary</td></tr>'+
    '<tr><td class="exp2"><b>B</b> · nodo 2 · '+esc(B.h)+'</td><td class="m">Contingency and Disabled</td><td class="m">Non-primary</td></tr>'+
    '</tbody></table></div>'+
    '<div class="tip" style="margin:8px 0 0">Si el nodo 2 no está como <b>Contingency and Disabled</b>, ajústalo en <span class="inline">Orbit Server Manager › Settings › Application</span> antes de empezar.</div>');

  b+=allBand("Paso 1 · Snapshots en orden inverso",
    step(1,"Nodo "+state.count+" primero, nodo 1 al final","El apagado abrupto del paso 4 puede dañar la instancia: el snapshot es la red de seguridad.",
      cmd("En cada nodo, del último al primero",["sudo orbit shutdown"])+
      expTxt('Instancia apagada por completo. <b>Ahora</b> toma el snapshot en el hipervisor, vuelve a encenderla y confirma que la operación se restableció antes de pasar a la siguiente.')));

  b+=allBand("Paso 2 · Validar el clúster antes de la prueba",
    step(2,"Confirmar el tamaño en la pantalla de Elasticsearch","",
      guiStep(["Orbit Server Manager","Replication","Elasticsearch"],
        'En las tablas <b>Data search cluster</b> y <b>Cluster members</b>, el tamaño del clúster debe corresponder a <b>'+state.count+'</b>. Si no coincide, detén la prueba.')));

  b+=allBand("Paso 3 · Recovery en el miembro B (nodo 2)",
    step(3,"Capturar las IPs permitidas en "+esc(B.h),"Sin esto el botón Assume as Primary no se dibuja.",
      guiStep(["Orbit Server Manager","Settings","Recovery"],
        'Campo <b>Allowed origin IPs to perform system recovery</b> = <span class="inline">'+esc(RIP)+'</span>. Sin comodines; CIDR para subredes. Guardar.')+
      '<div class="tip" style="margin:8px 0 0">Ya lo hiciste en la fase 8. Este paso solo confirma que quedó guardado en el nodo 2, que es el que va a asumir.</div>'));

  b+=allBand("Paso 4 · Ejecutar el failover",
    step(4,"Apagar el nodo 1 de golpe","Desde el hipervisor, no desde el sistema operativo.",
      '<div class="danger" style="margin:0">VMware: <b>Power › Power Off</b>. Proxmox: <b>Stop</b>, no <b>Shutdown</b>. Hyper-V: <b>Turn Off</b>, no <b>Shut Down</b>.</div>')+
    step(5,"Observar el split brain en el nodo 2","",
      expTxt('El nodo 2 bloquea cualquier cambio en la base de datos hasta recibir instrucción manual, y su aplicación web muestra la <b>pantalla de Recovery</b>.'))+
    step(6,"Asumir como primario","",
      guiStep([esc(B.h),"pantalla de Recovery","Assume as Primary","Yes"],
        'Confirma con <b>Yes</b>. El proceso tarda varios minutos. <b>Si el botón no aparece</b>, las IPs de la fase 8 no quedaron bien: revisa el campo de Recovery en este nodo.'))+
    step(7,"Verificar que el nodo 2 ya es el primario","",
      guiStep([esc(B.h),"pie de página","etiqueta Replication"],'Debe indicar que esta instancia es ahora la <b>Primary</b>.'))+
    step(8,"Habilitar la aplicación en el nodo 2","Sin esto, los demás módulos de Segura® siguen inaccesibles.",
      guiStep(["Orbit","Settings","Application","Enable application"],
        'Pon el interruptor <b>Enable application</b> en activo y da <b>Save</b>. Si se pinta de <b>verde</b>, la aplicación quedó activada.'))+
    step(9,"Cerrar sesión y volver a entrar","",
      expTxt('Tras reiniciar la sesión, <b>todas</b> las funcionalidades de Segura® están disponibles y operando en el miembro de contingencia. Este es el punto que se documenta como prueba superada.')));

  b+=allBand("Paso 5 · Devolver el rol al nodo 1 — por consola gráfica",
    step(10,"Encender el nodo 1 y esperar la sincronización","Tarda varios minutos. El nodo 2, como primario, le sincroniza la información nueva.",
      expTxt('Cuando termina, la interfaz web principal del nodo 1 vuelve a mostrar la pantalla de <b>login</b>.'))+
    step(11,"Recuperar el rol de primario",
      "",
      guiStep([esc(A.h),"iniciar sesión","Assume as Primary"],'El nodo 1 vuelve a ser el miembro <b>Primary</b>.'))+
    step(12,"Deshabilitar la aplicación en el nodo 2","Vuelve a su rol de contingencia.",
      guiStep([esc(B.h),"Orbit Server Manager","Settings","Application","Enable application"],
        'Pon el interruptor en <b>inactivo</b> y da <b>Save</b>. Confirma que <b>ya no</b> se muestra el color verde.')));

  b+=allBand("Paso 5.1 (alternativa) · Devolver el rol por SSH",
    step(13,"Conectarse al nodo 1 por el puerto 59022","Usuario <span class=\\"inline\\">mt4adm</span>.",
      cmd("Desde tu estación",["ssh -p 59022 mt4adm@"+A.ip]))+
    step(14,"Verificar el estado actual","",
      cmd("Nodo 1 · estado",["sudo orbit application status"])+
      expOut(["Application: Active","Replication: Active","Instance:    Cluster","Primary:     "+B.h,"Main:        No"]))+
    step(15,"Restaurar el nodo 1 como primario","",
      cmd("Nodo 1 · promover",["sudo orbit application primary"])+
      expOut(["Application: Active","Replication: Active","Instance:    Cluster","Primary:     "+A.h,"Main:        Yes"])+
      (apfOK()?'<div class="danger" style="margin:8px 0 0"><b>Con App Primary Failover activo este comando no está disponible:</b> el servicio elige el primario solo. Desactívalo antes si necesitas control manual.</div>':'')));
  h+=phase(9,"Prueba de failover y Disaster Recovery","Failover manual con apagado abrupto, promoción del secundario y retorno al estado original.",b);

  /* ===== FASE + : opcionales ===== */
  var op="",k=0;
  if(state.arb){
    k++;
    var s=step(1,"Generar el manifiesto en el nodo primario","",
      cmd("Nodo 1 · "+pri.h,["sudo orbit cluster arbiter create-config",
        "scp /var/tmp/senhasegura-cluster-arbiter/manifests.tar.gz usuario@"+state.arbip+":/tmp/"])+
      expTxt('Se crea <span class="inline">/var/tmp/senhasegura-cluster-arbiter/manifests.tar.gz</span> y el scp lo copia al host Docker.'));
    s+=step(2,"Levantar el contenedor en el host Docker","Requisitos: 2 vCPU, 2 GB RAM, 20 GB disco con /var ≥ 85%, Segura® ≥ 3.26, latencia ≤ 30 ms.",
      cmd("Host Docker · "+state.arbip,["cd /tmp && tar -xzf manifests.tar.gz","docker compose up -d","docker ps"])+
      expTxt('Los contenedores de <span class="inline">garbd</span> y Elasticsearch en estado <span class="inline">Up</span>.'));
    s+=step(3,"Verificar desde el primario","",
      cmd("Nodo 1 · "+pri.h,["sudo orbit cluster arbiter status"])+
      expOut(["senhasegura cluster arbiter","Galera Cluster arbiter (garbd) status: Connected, OK"]));
    op+=allBand("Opcional "+k+" · Árbitro ("+state.arbip+")",s);
  }
  if(apfOK()){
    k++;
    var t="";
    N.forEach(function(n,i){
      t+=step(i+1,"Activar en el nodo "+(i+1)+" — "+n.h,"",
        cmd("Nodo "+(i+1)+" · App Primary Failover",["sudo systemctl enable --now app-primary-failover","systemctl status app-primary-failover"])+
        expOut(["● app-primary-failover.service","   Loaded: loaded (enabled)","   Active: active (running)"]));
    });
    t+=step(state.count+1,"Vigilar el log","Corre cada 60 segundos.",
      cmd("Cualquier nodo · log",["tail -f /var/log/senhasegura/app-primary-failover/app-primary-failover.log"])+
      '<div class="danger" style="margin:8px 0 0"><b>Con App Primary Failover activo ya no puedes elegir el primario manualmente.</b> La documentación oficial publica el mismo comando para activar y desactivar (error editorial del fabricante): para desactivar usa <span class="inline">sudo systemctl disable --now app-primary-failover</span> y confírmalo con soporte de Segura®.</div>');
    op+=allBand("Opcional "+k+" · App Primary Failover ("+members()+" miembros, impar)",t);
  }else{
    k++;
    op+=allBand("Opcional "+k+" · App Primary Failover — no aplica",
      '<div class="tip" style="margin:0">Requiere <b>≥ 3 miembros contando el árbitro</b> y número <b>impar</b>. Tu topología suma <b>'+members()+'</b> miembro'+(members()===1?"":"s")+', así que no se puede activar. Agrega un árbitro o un nodo más.</div>');
  }
  if(state.lb){
    k++;
    var t2='<div class="tblwrap"><table><thead><tr><th>Parámetro del balanceador</th><th>Valor</th></tr></thead><tbody>'+
      '<tr><td class="exp2">Pool / listener</td><td class="m">'+N.map(function(n){return esc(n.ip)+":443";}).join("<br>")+'</td></tr>'+
      '<tr><td class="exp2">Algoritmo</td><td class="exp2">Least Connections (IP Hash si exiges afinidad)</td></tr>'+
      '<tr><td class="exp2">Health check</td><td class="exp2">HTTPS GET / :443 · intervalo 5 s · 3 fallos = fuera del pool</td></tr>'+
      '<tr><td class="exp2">Persistencia de sesión</td><td class="exp2">Activada — las sesiones de proxy la requieren</td></tr>'+
      '</tbody></table></div>';
    N.forEach(function(n,i){
      t2+=step(i+1,"Declarar el balanceador en el nodo "+(i+1)+" — "+n.h,"Para que Segura® lea la IP real del cliente vía X-Forwarded-For.",
        cmd("Nodo "+(i+1)+" · forward",["sudo orbit forward --show","sudo orbit forward "+state.lbip])+
        expTxt('<span class="inline">--show</span> devuelve <span class="inline">'+esc(state.lbip)+'</span> tras aplicar.'));
    });
    op+=allBand("Opcional "+k+" · Balanceador externo ("+state.lbip+")",t2);
  }
  if(state.nc){
    k++;
    var t3="";
    N.forEach(function(n,i){
      t3+=step(i+1,"Nodo "+(i+1)+" — "+n.h,"",
        cmd("Nodo "+(i+1)+" · network connector",["sudo orbit network-connector setup"+(i===0?"":" --secondary")])+
        (i===0?expTxt('Inicializa el servidor del conector. Guarda el token: los secundarios lo necesitan.')
              :expTxt('Si responde <span class="inline">This node is a Secondary in cluster and Segura® Network Connector Server needs to be initialized in Primary node</span>, vuelve al nodo 1 y termina su setup primero.')));
    });
    op+=allBand("Opcional "+k+" · Network Connector",t3);
  }
  h+=phase("＋","Componentes opcionales de HA","Se generan según lo que marcaste en el panel.",op,true);

  /* ===== FASE 8: pruebas ===== */
  var T=[
    ["P1","Formación del clúster","<code>sudo orbit cluster status</code> en los "+state.count+" nodos → <b>Cluster is healthy.</b>",0],
    ["P2","Roles correctos","Nodo 1 ("+esc(pri.h)+") con <b>Main: Yes</b>; los demás <b>Main: No</b>; todos <b>Instance: Cluster</b>.",0],
    ["P3","Tamaño del clúster","<code>wsrep_cluster_size</code> = <b>"+state.count+"</b> en cada nodo.",0],
    ["P4","Replicación de base de datos","Crear un dispositivo en la consola del nodo 1 → aparece en la consola del nodo 2 en menos de 5 s.",0],
    ["P5","Replicación de archivos","Subir un certificado o adjunto → presente en los "+state.count+" nodos.",0],
    ["P6","Elasticsearch","<code>orbit elasticsearch status</code> → green, "+state.count+" nodos, unassigned_shards 0.",0],
    ["P7","Sesión proxy y grabación","Abrir una sesión RDP/SSH desde el portal; la grabación se reproduce desde cualquier nodo.",0],
    ["P8","Caída de un secundario","Apagar el nodo 2 ("+esc(N[1].h)+") con <code>sudo orbit shutdown</code> → el servicio sigue disponible; cluster_size baja a "+(state.count-1)+".",0],
    ["P9","Resync automático","Encender el nodo 2 → vuelve solo a <b>Synced</b>; cluster_size regresa a "+state.count+" sin intervención.",0],
    ["P10","Failover del primario — apagado abrupto","Procedimiento completo en la <b>fase 9</b>. "+((state.count===2&&!state.arb)
      ? "Power Off del nodo 1 desde el hipervisor → el nodo 2 entra en split brain y muestra la pantalla de <b>Recovery</b>; se promueve con <b>Assume as Primary</b>. Esperado en 2 nodos sin árbitro."
      : "Power Off del nodo 1 desde el hipervisor → failover automático; el servicio sigue disponible. La pantalla de Recovery es el respaldo manual."),1],
    ["P11","Habilitar la aplicación en el nodo promovido","<code>Orbit › Settings › Application › Enable application</code> en verde, guardar, cerrar sesión y volver a entrar → todos los módulos disponibles.",1],
    ["P11b","Retorno del rol al nodo 1","<code>sudo orbit application primary</code> por SSH (puerto 59022, usuario mt4adm) o <b>Assume as Primary</b> en su consola → <b>Main: Yes</b>."+(apfOK()?" <b>No disponible</b> con App Primary Failover activo.":""),0],
    ["P12","Retorno del nodo original","Encender el nodo 1 → se reincorpora, cluster_size completo, sin split-brain.",0],
    ["P13","Partición de red","Bloquear el tráfico entre nodos en el switch. "+(state.arb?"Con árbitro: el servicio queda en el nodo que ve al árbitro.":"Sin árbitro: el servicio queda en el nodo 1."),0]
  ];
  if(state.lb)T.push(["P14","Balanceador","Sacar un nodo del aire con una sesión activa → el health check lo retira del pool en menos de 15 s.",0]);
  T.push(["P15","Verificación gráfica final","Orbit Server Manager › Replication › Status: los "+state.count+" miembros en <b>ON</b> y sincronizados.",0]);
  T.push(["P19","Puertos abiertos después del apply","<code>nmap -p 22,80,443,3306,4248,4444,4567,4568,9300,59022 &lt;otro nodo&gt;</code> desde cada miembro → los diez en <b>open</b>. Antes del apply es normal verlos <b>filtered</b>.",1]);
  T.push(["P20","Latencia entre miembros","<code>curl -k -s -o /dev/null -w \\"Conexión: %{time_connect}s\\" https://&lt;otro nodo&gt;:443</code> → <b>Conexión por debajo de 0.030 s</b>. El <code>ping</code> no sirve: Segura® tiene el ICMP cerrado.",1]);
  T.push(["P17","IPs permitidas de Recovery","En los "+state.count+" nodos: <code>Orbit Server Manager › Settings › Recovery</code> con las IPs en CIDR, sin comodines. Sin esto no aparece <b>Assume as Primary</b>.",1]);
  T.push(["P18","URL de monitoreo","<code>curl -sk -o /dev/null -w \\"%{http_code}\\" https://&lt;nodo&gt;/flow/orbit/mntr</code> → <b>200</b> en el primario y <b>203</b> en los secundarios.",0]);
  T.push(["P16","Backup en clúster","<code>sudo orbit backup create</code> en el nodo 1 → sin error; visible en Orbit Server Manager › Logs › Backup.",0]);

  b='<div class="prog"><div class="bar"><i id="pbar"></i></div><span id="pnum">0 / '+T.length+'</span></div>';
  b+='<p class="note">Ventana de mantenimiento y snapshot vigente de todos los nodos. Registra fecha, ejecutor y salida obtenida por cada prueba.</p>';
  b+='<div class="tests">'+T.map(function(t){
    return '<label class="test'+(t[3]?" hit":"")+'"><input type="checkbox" data-t="'+t[0]+'"'+(state.tests[t[0]]?" checked":"")+'>'+
      '<span class="id">'+t[0]+'</span><span><span class="tt">'+t[1]+'</span><span class="cr">'+t[2]+'</span></span></label>';
  }).join("")+'</div>';
  h+=phase(10,"Matriz de pruebas de aceptación","Marca cada prueba conforme la ejecutes; el avance se guarda en este navegador.",b);

  /* ===== FASE 9 ===== */
  b='<div class="tblwrap"><table><thead><tr><th>Síntoma</th><th>Lectura correcta</th></tr></thead><tbody>'+
    '<tr><td class="exp2"><span class="inline">Auth callout violation</span> / <span class="inline">Nkey</span> en los logs de NATS</td><td class="exp2">Transitorio durante los primeros <b>1–2 min</b> tras formar el clúster. Solo es incidente si pasa de <b>5 min</b> después de terminar el apply.</td></tr>'+
    '<tr><td class="exp2"><span class="inline">WSREP: Failed to establish connection: unexpected eof (SSL routines)</span> cada 30–60 s</td><td class="exp2">Aparece en clústeres sanos. Valida con <span class="inline">SHOW STATUS LIKE \\'wsrep_%\\'</span>: si es Primary / ON / Synced, ignóralo.</td></tr>'+
    '<tr><td class="exp2"><span class="inline">Whoops! Could not replicate settings to cluster nodes</span></td><td class="exp2">Nodo inalcanzable o réplica de archivos rota. Revisa los puertos <b>4248</b> y <b>22</b> y reintenta.</td></tr>'+
    '<tr><td class="exp2">Un nodo atascado en <span class="inline">Joining</span> o <span class="inline">Donor/Desynced</span></td><td class="exp2">SST bloqueado. Verifica el puerto <b>4444</b>; si no resuelve, SST manual (abajo).</td></tr>'+
    '</tbody></table></div>';
  b+=allBand("Rollback · con todas las instancias apagadas",
    step(1,"Apagar en orden inverso","Del último nodo hacia el nodo 1.",
      cmd("En cada nodo, del último al primero",["sudo orbit shutdown"]))+
    step(2,"Restaurar snapshots","Todos los miembros al mismo punto en el tiempo.",
      '<div class="danger" style="margin:0"><b>Nunca restaures un solo nodo desde snapshot con el clúster arriba:</b> provoca divergencia de datos.</div>')+
    step(3,"Encender en orden y validar","Primero el nodo 1, luego los secundarios uno por uno.",
      cmd("Cada nodo, tras encender",["sudo orbit app status"])+
      expTxt('<span class="inline">Application: Active</span> antes de encender el siguiente.')));
  var sst=step(1,"En el nodo 1 — "+pri.h,"",
    cmd("Nodo 1 · reiniciar el clúster Galera",["sudo orbit cluster status","sudo systemctl stop mysql",
      "sudo rm /var/lib/mysql/galera.cache","sudo rm /var/lib/mysql/grastate.dat",
      "sudo rm /var/lib/mysql/multi-master.info","sudo galera_new_cluster"]));
  N.slice(1).forEach(function(n,i){
    sst+=step(i+2,"En el nodo "+(i+2)+" — "+n.h,"",
      cmd("Nodo "+(i+2)+" · rehacer el datadir",["sudo systemctl stop mysql",
        "sudo mv /var/lib/mysql /var/lib/mysql-$(date +%d%m%y%H%M)",
        "sudo install -d /var/lib/mysql -o mysql -g mysql",
        "# confirmar la replicación en /etc/mysql/conf.d/galera.cnf",
        "# en otra terminal: sudo tail -f /var/log/mysql/mysql-error.log",
        "sudo systemctl start mysql"])+
      expOut(["WSREP: members = "+state.count+"/"+state.count+"(joined/total)",
              "WSREP: Member 0.0 ("+n.h+") synced with group."]));
  });
  b+=allBand("SST manual · solo con todas las instancias detenidas",
    sst+'<div class="danger" style="margin:14px 0 0"><b>El SST manual borra el datadir del secundario.</b> Snapshot previo obligatorio.</div>');
  h+=phase(11,"Contingencia y reversión","Qué es ruido, qué es falla y cómo volver atrás.",b);

  $("out").innerHTML=h;wire();
}

/* ---------- verdict ---------- */
function verdict(){
  var v,c;
  if(state.count===2&&!state.arb){c="v-crit";
    v="<b>Failover del primario: MANUAL</b>2 nodos sin árbitro no es HA automática. Si cae el nodo 1, el sobreviviente queda en solo lectura hasta que alguien ejecute <span class=\\"inline\\">orbit application master</span>. Marca <b>Árbitro</b> o sube a 3 nodos.";}
  else if(state.count===2&&state.arb){c="v-ok";
    v="<b>Failover automático · 3 miembros</b>2 nodos + árbitro cubre la caída de cualquier miembro y la partición de red. App Primary Failover habilitado.";}
  else if(apfOK()){c="v-ok";
    v="<b>Failover automático · "+members()+" miembros</b>Número impar: quórum estable y App Primary Failover habilitado.";}
  else{c="v-warn";
    v="<b>Quórum par · "+members()+" miembros</b>Con número par el quórum es frágil ante una partición y App Primary Failover no se puede activar. Un árbitro te lleva a "+(members()+1)+".";}
  $("verdict").innerHTML='<div class="verdict '+c+'">'+v+'</div>';
}

/* ---------- sidebar nodes ---------- */
function renderNodes(){
  var h="";
  for(var i=0;i<state.count;i++){
    var n=state.nodes[i];
    h+='<div class="ncard"><div class="nh"><b>Nodo '+(i+1)+'</b><span class="pill '+(i===0?"pri":"sec")+'">'+(i===0?"Primario":"Secundario")+'</span></div>'+
      '<div class="row two"><div><label for="h'+i+'">Hostname</label><input id="h'+i+'" data-n="'+i+'" data-f="h" value="'+esc(n.h)+'"></div>'+
      '<div><label for="i'+i+'">Dirección IP</label><input id="i'+i+'" data-n="'+i+'" data-f="ip" value="'+esc(n.ip)+'"></div></div></div>';
  }
  if(state.arb)h+='<div class="ncard"><div class="nh"><b>Árbitro</b><span class="pill arb">Docker</span></div><div style="font-size:11.5px;color:var(--muted);line-height:1.45">Su IP se captura en “Red compartida”. No es una instancia Segura®: es un contenedor <span class="inline">garbd</span> que solo aporta quórum.</div></div>';
  $("nodes").innerHTML=h;
  Array.prototype.forEach.call($("nodes").querySelectorAll("input"),function(el){
    el.addEventListener("input",function(){state.nodes[+el.dataset.n][el.dataset.f]=el.value;save();build();});
  });
}

/* ---------- copy / progress ---------- */
var tmr;
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(tmr);tmr=setTimeout(function(){t.classList.remove("on");},1500);}
function copy(txt,btn){
  var ok=function(){btn.classList.add("done");btn.textContent="Copiado";toast("Copiado al portapapeles");
    setTimeout(function(){btn.classList.remove("done");btn.textContent="Copiar";},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,function(){fb(txt,ok);});
  else fb(txt,ok);
}
function fb(txt,cb){
  var ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";
  document.body.appendChild(ta);ta.select();
  try{document.execCommand("copy");cb();}catch(e){toast("No se pudo copiar");}
  document.body.removeChild(ta);
}
function prog(){
  var bx=document.querySelectorAll(".test input");if(!bx.length)return;
  var d=0;Array.prototype.forEach.call(bx,function(b){if(b.checked)d++;});
  var bar=$("pbar"),num=$("pnum");
  if(bar)bar.style.width=(d/bx.length*100)+"%";
  if(num)num.textContent=d+" / "+bx.length;
}
function wire(){
  Array.prototype.forEach.call(document.querySelectorAll(".cp"),function(b){
    b.addEventListener("click",function(){copy(b.getAttribute("data-cmd"),b);});
  });
  Array.prototype.forEach.call(document.querySelectorAll(".test input"),function(b){
    b.addEventListener("change",function(){state.tests[b.dataset.t]=b.checked;save();prog();});
  });
  prog();
}

/* ---------- bind ---------- */
function bind(id,key,num){
  var el=$(id);if(!el)return;
  if(el.type==="checkbox"){el.checked=!!state[key];el.addEventListener("change",function(){state[key]=el.checked;save();refresh();});}
  else{el.value=state[key];el.addEventListener(el.tagName==="SELECT"?"change":"input",function(){state[key]=num?+el.value:el.value;save();refresh();});}
}
function refresh(){$("arbBox").hidden=!state.arb;$("lbBox").hidden=!state.lb;renderNodes();verdict();build();}
["gw","iface","dns","dom","ntp","arbip","lbip","recip"].forEach(function(k){bind(k,k);});
bind("prefix","prefix");bind("arb","arb");bind("lb","lb");bind("nc","nc");bind("count","count",true);
refresh();
</script>

</body></html>`;
