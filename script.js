function getArray(id){
  let val=document.getElementById(id).value.trim();
  return val?val.split(" ").map(Number):[];
}

function run(){
  let at=getArray("arrival");
  let bt=getArray("burst");
  let pr=getArray("priority");
  let q=parseInt(document.getElementById("quantum").value)||2;
  let algo=document.getElementById("algo").value;

  let p=[];
  for(let i=0;i<at.length;i++){
    p.push({
      pid:"P"+(i+1),
      arrival:at[i],
      burst:bt[i],
      priority:pr[i]||0,
      remaining:bt[i]
    });
  }

  if(algo==="fcfs") fcfs([...p]);
  if(algo==="sjf") sjf([...p]);
  if(algo==="srtf") srtf([...p]);
  if(algo==="priority_np") priorityNP([...p]);
  if(algo==="priority_p") priorityP([...p]);
  if(algo==="rr") rr([...p],q);
}

function display(p,gantt){
  let table=document.getElementById("table");
  table.innerHTML="<tr><th>PID</th><th>CT</th><th>TAT</th><th>WT</th></tr>";

  let totalWT=0,totalTAT=0;

  p.forEach(proc=>{
    totalWT+=proc.wt;
    totalTAT+=proc.tat;

    table.innerHTML+=`
    <tr>
      <td>${proc.pid}</td>
      <td>${proc.ct}</td>
      <td>${proc.tat}</td>
      <td>${proc.wt}</td>
    </tr>`;
  });

  document.getElementById("avg").innerText=
    "Avg WT="+(totalWT/p.length).toFixed(2)+
    " | Avg TAT="+(totalTAT/p.length).toFixed(2);

  drawGantt(gantt);
}

/* PERFECT GANTT */
function drawGantt(gantt){
  let g=document.getElementById("gantt");
  let t=document.getElementById("timeline");

  g.innerHTML="";
  t.innerHTML="";

  const scale=30;

  g.style.position="relative";
  g.style.height="60px";

  let merged=[];
  gantt.forEach(item=>{
    if(merged.length && merged[merged.length-1].pid===item.pid){
      merged[merged.length-1].end=item.end;
    }else{
      merged.push({...item});
    }
  });

  merged.forEach((item,i)=>{
    let duration=item.end-item.start;

    let block=document.createElement("div");
    block.className="block";
    block.innerText=item.pid;
    block.style.position="absolute";
    block.style.left=(item.start*scale)+"px";
    block.style.width=(duration*scale)+"px";

    g.appendChild(block);

    let time=document.createElement("div");
    time.innerText=item.start;
    time.style.left=(item.start*scale)+"px";
    t.appendChild(time);

    if(i===merged.length-1){
      let end=document.createElement("div");
      end.innerText=item.end;
      end.style.left=(item.end*scale)+"px";
      t.appendChild(end);
    }
  });
}

//////////////// ALGORITHMS //////////////////

// FCFS
function fcfs(p){
  p.sort((a,b)=>a.arrival-b.arrival);
  let time=0,gantt=[];

  p.forEach(proc=>{
    if(time<proc.arrival) time=proc.arrival;

    let start=time,end=time+proc.burst;

    proc.ct=end;
    proc.tat=end-proc.arrival;
    proc.wt=proc.tat-proc.burst;

    gantt.push({pid:proc.pid,start,end});
    time=end;
  });

  display(p,gantt);
}

// SJF
function sjf(p){
  let time=0,done=[],gantt=[];

  while(p.length){
    let avail=p.filter(x=>x.arrival<=time);
    if(!avail.length){time++;continue;}

    avail.sort((a,b)=>a.burst-b.burst);
    let proc=avail[0];

    let start=time,end=time+proc.burst;

    proc.ct=end;
    proc.tat=end-proc.arrival;
    proc.wt=proc.tat-proc.burst;

    gantt.push({pid:proc.pid,start,end});
    time=end;

    done.push(proc);
    p=p.filter(x=>x!==proc);
  }

  display(done,gantt);
}

// SRTF
function srtf(p){
  let time=0,complete=0,n=p.length,gantt=[];

  while(complete<n){
    let avail=p.filter(x=>x.arrival<=time && x.remaining>0);
    if(!avail.length){time++;continue;}

    avail.sort((a,b)=>a.remaining-b.remaining);
    let proc=avail[0];

    let start=time;
    proc.remaining--;
    time++;

    gantt.push({pid:proc.pid,start,end:time});

    if(proc.remaining===0){
      proc.ct=time;
      proc.tat=time-proc.arrival;
      proc.wt=proc.tat-proc.burst;
      complete++;
    }
  }

  display(p,gantt);
}

// Priority NP
function priorityNP(p){
  let time=0,done=[],gantt=[];

  while(p.length){
    let avail=p.filter(x=>x.arrival<=time);
    if(!avail.length){time++;continue;}

    avail.sort((a,b)=>a.priority-b.priority);
    let proc=avail[0];

    let start=time,end=time+proc.burst;

    proc.ct=end;
    proc.tat=end-proc.arrival;
    proc.wt=proc.tat-proc.burst;

    gantt.push({pid:proc.pid,start,end});
    time=end;

    done.push(proc);
    p=p.filter(x=>x!==proc);
  }

  display(done,gantt);
}

// Priority Preemptive
function priorityP(p){
  let time=0,complete=0,n=p.length,gantt=[];

  while(complete<n){
    let avail=p.filter(x=>x.arrival<=time && x.remaining>0);
    if(!avail.length){time++;continue;}

    avail.sort((a,b)=>a.priority-b.priority);
    let proc=avail[0];

    let start=time;
    proc.remaining--;
    time++;

    gantt.push({pid:proc.pid,start,end:time});

    if(proc.remaining===0){
      proc.ct=time;
      proc.tat=time-proc.arrival;
      proc.wt=proc.tat-proc.burst;
      complete++;
    }
  }

  display(p,gantt);
}

// Round Robin
function rr(p,q){
  p.sort((a,b)=>a.arrival-b.arrival);

  let time=0,queue=[],i=0,gantt=[];

  while(queue.length || i<p.length){

    if(queue.length===0 && time<p[i].arrival){
      time=p[i].arrival;
    }

    while(i<p.length && p[i].arrival<=time){
      queue.push(p[i]);
      i++;
    }

    let proc=queue.shift();

    let start=time;
    let exec=Math.min(q,proc.remaining);

    time+=exec;
    proc.remaining-=exec;

    gantt.push({pid:proc.pid,start,end:time});

    while(i<p.length && p[i].arrival<=time){
      queue.push(p[i]);
      i++;
    }

    if(proc.remaining>0){
      queue.push(proc);
    }else{
      proc.ct=time;
      proc.tat=time-proc.arrival;
      proc.wt=proc.tat-proc.burst;
    }
  }

  display(p,gantt);
}
