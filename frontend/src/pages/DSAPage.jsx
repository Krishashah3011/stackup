import { useState, useEffect, useCallback } from 'react';
import { dsaService } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const ALL_TOPICS = ['Arrays','Strings','Linked List','Stack & Queue','Hashing','Trees','Graphs','Dynamic Programming'];
const TOPIC_META = {
  'Arrays':               {emoji:'📋',color:'#6366F1',tag:'Foundation'},
  'Strings':              {emoji:'🔤',color:'#EC4899',tag:'Foundation'},
  'Linked List':          {emoji:'🔗',color:'#8B5CF6',tag:'Intermediate'},
  'Stack & Queue':        {emoji:'📚',color:'#F59E0B',tag:'Intermediate'},
  'Hashing':              {emoji:'#️⃣',color:'#10B981',tag:'Intermediate'},
  'Trees':                {emoji:'🌳',color:'#06B6D4',tag:'Advanced'},
  'Graphs':               {emoji:'🕸️',color:'#EF4444',tag:'Advanced'},
  'Dynamic Programming':  {emoji:'⚡',color:'#8B5CF6',tag:'Advanced'},
};
const TAG_STYLES = {
  Foundation:   {bg:'color-mix(in srgb,#3B82F6 12%,transparent)',color:'#3B82F6',border:'color-mix(in srgb,#3B82F6 25%,transparent)'},
  Intermediate: {bg:'color-mix(in srgb,#F59E0B 12%,transparent)',color:'#D97706',border:'color-mix(in srgb,#F59E0B 25%,transparent)'},
  Advanced:     {bg:'color-mix(in srgb,#EF4444 12%,transparent)',color:'#DC2626',border:'color-mix(in srgb,#EF4444 25%,transparent)'},
};
const CodeIcon = p => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>;

const Ring = ({value=0,color,size=76,stroke=7}) => {
  const r=(size-stroke)/2,circ=2*Math.PI*r,dash=(value/100)*circ;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.8s ease-out'}}/>
    </svg>
  );
};

const Modal = ({title,onClose,children,wide=false}) => (
  <div className="modal-overlay">
    <div className={`modal-panel animate-scale-in ${wide?'max-w-2xl':''}`}>
      <div className="modal-header">
        <h2 className="font-bold" style={{color:'var(--text)'}}>{title}</h2>
        <button onClick={onClose} style={{color:'var(--text-3)'}} className="hover:opacity-70 transition-opacity">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const TopicCard = ({record,onEdit,onDelete,onIncrement,incrementing}) => {
  const meta = TOPIC_META[record.topic]||{emoji:'📌',color:'var(--primary)',tag:'Foundation'};
  const tag  = TAG_STYLES[meta.tag]||TAG_STYLES.Foundation;
  const done = record.progress===100;
  const r=32, circ=2*Math.PI*r, dash=(record.progress/100)*circ;

  return (
    <div className="card hover:shadow-md transition-all duration-200 group flex flex-col gap-4"
      style={done?{borderColor:'color-mix(in srgb,#10B981 30%,transparent)',background:'color-mix(in srgb,#10B981 3%,var(--surface))'}:{}}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{background:`color-mix(in srgb,${meta.color} 14%,transparent)`,border:`1px solid color-mix(in srgb,${meta.color} 28%,transparent)`}}>
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate" style={{color:'var(--text)'}}>{record.topic}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{background:tag.bg,color:tag.color,border:`1px solid ${tag.border}`}}>{meta.tag}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <button className="p-1.5 rounded-lg transition-all" onClick={()=>onEdit(record)} style={{color:'var(--text-3)'}}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--primary)';e.currentTarget.style.background='color-mix(in srgb,var(--primary) 10%,transparent)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.background='transparent';}}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button className="p-1.5 rounded-lg transition-all" onClick={()=>onDelete(record)} style={{color:'var(--text-3)'}}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--danger)';e.currentTarget.style.background='color-mix(in srgb,var(--danger) 10%,transparent)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.background='transparent';}}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <svg width={76} height={76} className="-rotate-90">
            <circle cx={38} cy={38} r={r} fill="none" stroke="var(--border)" strokeWidth={7}/>
            <circle cx={38} cy={38} r={r} fill="none" stroke={done?'#10B981':meta.color} strokeWidth={7}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.8s ease-out'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black leading-none" style={{color:'var(--text)'}}>{record.progress}</span>
            <span className="text-[9px]" style={{color:'var(--text-3)'}}>%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-black" style={{color:done?'#10B981':meta.color}}>{record.solvedProblems}</span>
            <span className="text-sm" style={{color:'var(--text-3)'}}>/ {record.totalProblems}</span>
          </div>
          <p className="text-xs" style={{color:'var(--text-3)'}}>problems solved</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
            <div className="h-full rounded-full transition-all duration-700" style={{width:`${record.progress}%`,background:done?'#10B981':meta.color}}/>
          </div>
        </div>
      </div>

      <div className="pt-3" style={{borderTop:'1px solid var(--border)'}}>
        {done ? (
          <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{color:'#10B981'}}>
            ✅ Completed!
          </div>
        ) : (
          <button disabled={incrementing===record._id}
            onClick={()=>onIncrement(record._id)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
            style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text-2)'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-2)';}}
          >
            {incrementing===record._id ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <>+ Mark 1 Solved</>}
          </button>
        )}
      </div>
    </div>
  );
};

const UntrackedCard = ({topic,onAdd}) => {
  const meta = TOPIC_META[topic]||{emoji:'📌',color:'var(--primary)'};
  return (
    <button onClick={()=>onAdd(topic)}
      className="card flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all group"
      style={{borderStyle:'dashed',borderColor:'var(--border)'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl opacity-40 group-hover:opacity-80 transition-opacity"
        style={{background:`color-mix(in srgb,${meta.color} 10%,transparent)`}}>{meta.emoji}</div>
      <p className="font-medium text-sm transition-colors" style={{color:'var(--text-3)'}}>{topic}</p>
      <span className="text-xs font-semibold" style={{color:'var(--primary)'}}>+ Add</span>
    </button>
  );
};

const DSAPage = () => {
  const [records,setRecords]   = useState([]);
  const [summary,setSummary]   = useState(null);
  const [loading,setLoading]   = useState(true);
  const [saving,setSaving]     = useState(false);
  const [incrementing,setIncrementing] = useState(null);
  const [showAdd,setShowAdd]   = useState(false);
  const [showBulk,setShowBulk] = useState(false);
  const [editRec,setEditRec]   = useState(null);
  const [deleteRec,setDeleteRec] = useState(null);
  const [form,setForm]         = useState({topic:'',totalProblems:'',solvedProblems:'0'});
  const [formErrors,setFormErrors] = useState({});
  const [bulkForm,setBulkForm] = useState({});

  const trackedTopics   = records.map(r=>r.topic);
  const untrackedTopics = ALL_TOPICS.filter(t=>!trackedTopics.includes(t));

  const fetchAll = useCallback(async()=>{
    try {
      const [pr,sr] = await Promise.all([dsaService.getAll(),dsaService.getSummary()]);
      setRecords(pr.data.data); setSummary(sr.data.data);
    } catch { toast.error('Failed to load DSA progress'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{fetchAll();},[fetchAll]);

  const openAdd=(t=null)=>{setForm({topic:t||untrackedTopics[0]||'',totalProblems:'',solvedProblems:'0'});setFormErrors({});setShowAdd(true);};
  const openBulk=()=>{const init={};untrackedTopics.forEach(t=>{init[t]={total:'',solved:'0',enabled:untrackedTopics.length<=4};});setBulkForm(init);setShowBulk(true);};
  const openEdit=rec=>{setForm({topic:rec.topic,totalProblems:String(rec.totalProblems),solvedProblems:String(rec.solvedProblems)});setFormErrors({});setEditRec(rec);};

  const validateForm=()=>{const e={};if(!form.topic)e.topic='Required';if(!form.totalProblems||Number(form.totalProblems)<1)e.totalProblems='Must be ≥1';if(Number(form.solvedProblems)<0)e.solvedProblems='Cannot be negative';if(Number(form.solvedProblems)>Number(form.totalProblems))e.solvedProblems='Cannot exceed total';setFormErrors(e);return !Object.keys(e).length;};

  const handleAdd=async e=>{e.preventDefault();if(!validateForm())return;setSaving(true);try{await dsaService.create({topic:form.topic,totalProblems:Number(form.totalProblems),solvedProblems:Number(form.solvedProblems)});toast.success(`"${form.topic}" added!`);setShowAdd(false);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleUpdate=async e=>{e.preventDefault();if(!validateForm())return;setSaving(true);try{await dsaService.update(editRec._id,{totalProblems:Number(form.totalProblems),solvedProblems:Number(form.solvedProblems)});toast.success('Updated');setEditRec(null);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleIncrement=async id=>{setIncrementing(id);try{const{data}=await dsaService.increment(id);setRecords(p=>p.map(r=>r._id===id?data.data:r));toast.success(data.message);dsaService.getSummary().then(({data:s})=>setSummary(s.data)).catch(()=>{});}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setIncrementing(null);};};
  const handleDelete=async()=>{if(!deleteRec)return;try{await dsaService.delete(deleteRec._id);toast.success(`"${deleteRec.topic}" removed`);setDeleteRec(null);fetchAll();}catch{toast.error('Failed');}};
  const handleBulkAdd=async e=>{e.preventDefault();const topics=Object.entries(bulkForm).filter(([,v])=>v.enabled&&v.total&&Number(v.total)>=1).map(([topic,v])=>({topic,totalProblems:Number(v.total),solvedProblems:Number(v.solved)||0}));if(!topics.length){toast.error('Enable at least one topic');return;}setSaving(true);try{const{data}=await dsaService.bulkCreate(topics);toast.success(data.message);setShowBulk(false);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};

  if(loading) return <div className="flex justify-center py-32"><Spinner size="lg"/></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary banner */}
      {records.length>0&&summary&&(
        <div className="card" style={{background:'linear-gradient(135deg,color-mix(in srgb,var(--primary) 6%,var(--surface)),var(--surface))'}}>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <Ring value={summary.overallProgress} color="var(--primary)" size={88} stroke={9}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{color:'var(--text)'}}>{summary.overallProgress}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs" style={{color:'var(--text-3)'}}>Overall Progress</p>
                <p className="text-3xl font-black" style={{color:'var(--primary)'}}>{summary.totalSolved}<span className="text-slate-400 text-base font-normal">/{summary.totalProblems}</span></p>
                <p className="text-xs" style={{color:'var(--text-3)'}}>problems solved</p>
              </div>
            </div>
            <div className="hidden sm:block w-px" style={{background:'var(--border)'}}/>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              {[
                {label:'Topics Tracked',value:`${summary.topicsTracked}/8`,color:'var(--text)'},
                {label:'Completed',value:summary.completedTopics,color:'var(--success)'},
                ...(summary.bestTopic?[{label:'Best Topic',value:summary.bestTopic.topic,sub:`${summary.bestTopic.progress}%`,color:'var(--success)'}]:[]),
                ...(summary.weakestTopic?[{label:'Needs Work',value:summary.weakestTopic.topic,sub:`${summary.weakestTopic.progress}%`,color:'var(--warning)'}]:[]),
              ].map(({label,value,sub,color})=>(
                <div key={label}>
                  <p className="text-xs" style={{color:'var(--text-3)'}}>{label}</p>
                  <p className="font-bold text-lg mt-0.5 truncate" style={{color}}>{value}</p>
                  {sub&&<p className="text-xs" style={{color:'var(--text-3)'}}>{sub}</p>}
                </div>
              ))}
            </div>
          </div>
          {summary.untrackedTopics?.length>0&&(
            <div className="mt-4 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{borderTop:'1px solid var(--border)'}}>
              <p className="text-xs" style={{color:'var(--text-3)'}}>Not tracking: <span style={{color:'var(--text-2)'}}>{summary.untrackedTopics.join(', ')}</span></p>
              {summary.untrackedTopics.length>1&&<button className="text-xs font-semibold hover:underline" style={{color:'var(--primary)'}} onClick={openBulk}>Add all {summary.untrackedTopics.length} at once →</button>}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{color:'var(--text-3)'}}>{records.length} / {ALL_TOPICS.length} topics tracked{summary?.completedTopics>0?` · ${summary.completedTopics} completed`:''}</p>
        <div className="flex items-center gap-2">
          {untrackedTopics.length>1&&<button className="btn-secondary btn-sm flex items-center gap-1.5" onClick={openBulk}>📋 Bulk Add</button>}
          <button className="btn-primary flex items-center gap-2" onClick={()=>openAdd()} disabled={untrackedTopics.length===0}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Topic
          </button>
        </div>
      </div>

      {!records.length&&<EmptyState icon={CodeIcon} title="No DSA topics tracked yet" description="Track your problem-solving progress across 8 essential topics." action={<div className="flex gap-3 flex-wrap justify-center"><button className="btn-primary" onClick={openBulk}>Bulk Add All Topics</button><button className="btn-secondary" onClick={()=>openAdd()}>Add Single Topic</button></div>}/>}

      {records.length>0&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {records.map(rec=><TopicCard key={rec._id} record={rec} onEdit={openEdit} onDelete={setDeleteRec} onIncrement={handleIncrement} incrementing={incrementing}/>)}
          {untrackedTopics.map(t=><UntrackedCard key={t} topic={t} onAdd={openAdd}/>)}
        </div>
      )}

      {untrackedTopics.length===0&&records.length>0&&(
        <p className="text-center text-sm py-2" style={{color:'var(--text-3)'}}>🎯 All 8 topics are tracked.{summary?.completedTopics===8?' All completed! 🏆':' Keep solving!'}</p>
      )}

      {/* Add modal */}
      {showAdd&&(
        <Modal title="Add DSA Topic" onClose={()=>setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4" noValidate>
            <div>
              <label className="label">Topic</label>
              <select className={`input-field ${formErrors.topic?'error':''}`} value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}>
                {untrackedTopics.map(t=><option key={t} value={t}>{TOPIC_META[t]?.emoji} {t}</option>)}
              </select>
              {formErrors.topic&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.topic}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Problems</label>
                <input type="number" min="1" className={`input-field ${formErrors.totalProblems?'error':''}`} placeholder="50" value={form.totalProblems} onChange={e=>setForm({...form,totalProblems:e.target.value})}/>
                {formErrors.totalProblems&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.totalProblems}</p>}
              </div>
              <div>
                <label className="label">Already Solved</label>
                <input type="number" min="0" className={`input-field ${formErrors.solvedProblems?'error':''}`} placeholder="0" value={form.solvedProblems} onChange={e=>setForm({...form,solvedProblems:e.target.value})}/>
                {formErrors.solvedProblems&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.solvedProblems}</p>}
              </div>
            </div>
            {form.totalProblems&&Number(form.totalProblems)>0&&(
              <div className="p-3 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                <div className="flex justify-between text-xs mb-1.5" style={{color:'var(--text-3)'}}>
                  <span>Preview</span><span>{Math.min(100,Math.round(((Number(form.solvedProblems)||0)/Number(form.totalProblems))*100))}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,Math.round(((Number(form.solvedProblems)||0)/(Number(form.totalProblems)||1))*100))}%`,background:'var(--primary)'}}/>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Adding…':'Add Topic'}</button>
              <button type="button" className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editRec&&(
        <Modal title={`Edit — ${editRec.topic}`} onClose={()=>setEditRec(null)}>
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <span className="text-xl">{TOPIC_META[editRec.topic]?.emoji}</span>
              <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{editRec.topic}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Problems</label>
                <input type="number" min="1" className="input-field" value={form.totalProblems} onChange={e=>setForm({...form,totalProblems:e.target.value})}/>
              </div>
              <div>
                <label className="label">Solved</label>
                <input type="number" min="0" className="input-field" value={form.solvedProblems} onChange={e=>setForm({...form,solvedProblems:e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Saving…':'Update Progress'}</button>
              <button type="button" className="btn-secondary" onClick={()=>setEditRec(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk modal */}
      {showBulk&&(
        <Modal title="Bulk Add DSA Topics" onClose={()=>setShowBulk(false)} wide>
          <form onSubmit={handleBulkAdd}>
            <p className="text-sm mb-4" style={{color:'var(--text-3)'}}>Enable the topics you want to track and fill in problem counts.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {untrackedTopics.map(topic=>{
                const meta=TOPIC_META[topic],val=bulkForm[topic]||{total:'',solved:'0',enabled:false};
                return (
                  <div key={topic} className="p-4 rounded-xl border transition-all" style={{background:val.enabled?'color-mix(in srgb,var(--primary) 5%,var(--surface))':'var(--surface-2)',borderColor:val.enabled?'var(--primary)':'var(--border)'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" checked={val.enabled} onChange={e=>setBulkForm(f=>({...f,[topic]:{...val,enabled:e.target.checked}}))}/>
                      <span className="text-base">{meta?.emoji}</span>
                      <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{topic}</p>
                    </div>
                    {val.enabled&&(
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="label">Total</label>
                          <input type="number" min="1" className="input-field text-sm py-1.5" placeholder="50" value={val.total} onChange={e=>setBulkForm(f=>({...f,[topic]:{...val,total:e.target.value}}))}/>
                        </div>
                        <div>
                          <label className="label">Solved</label>
                          <input type="number" min="0" className="input-field text-sm py-1.5" placeholder="0" value={val.solved} onChange={e=>setBulkForm(f=>({...f,[topic]:{...val,solved:e.target.value}}))}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Adding…':`Add ${Object.values(bulkForm).filter(v=>v.enabled).length} Topic(s)`}</button>
              <button type="button" className="btn-secondary" onClick={()=>setShowBulk(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteRec&&(
        <Modal title="Remove Topic?" onClose={()=>setDeleteRec(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{color:'var(--text-2)'}}>Remove <strong style={{color:'var(--text)'}}>{deleteRec.topic}</strong>? Progress ({deleteRec.solvedProblems}/{deleteRec.totalProblems} solved) will be lost.</p>
            <div className="flex gap-3">
              <button className="flex-1 btn rounded-xl py-2.5 text-white" style={{background:'var(--danger)'}} onClick={handleDelete}>Remove</button>
              <button className="btn-secondary flex-1" onClick={()=>setDeleteRec(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default DSAPage;