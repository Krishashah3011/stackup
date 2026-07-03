import { useState, useEffect, useCallback } from 'react';
import { aptitudeService } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const ALL_CATEGORIES = ['Quantitative Aptitude','Logical Reasoning','Verbal Ability','Data Interpretation'];
const CATEGORY_META = {
  'Quantitative Aptitude': {emoji:'🔢',color:'#6366F1',desc:'Numbers, percentages, algebra'},
  'Logical Reasoning':     {emoji:'🧩',color:'#8B5CF6',desc:'Patterns, sequences, puzzles'},
  'Verbal Ability':        {emoji:'📖',color:'#10B981',desc:'Grammar, vocabulary, comprehension'},
  'Data Interpretation':   {emoji:'📊',color:'#F59E0B',desc:'Charts, tables, graphs'},
};
const ChartIcon = p => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;

const Ring = ({value=0,color,size=68,stroke=7}) => {
  const r=(size-stroke)/2,circ=2*Math.PI*r,dash=(Math.min(value,100)/100)*circ;
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

const SliderField = ({label,value,onChange,color='var(--primary)'}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="label mb-0">{label}</label>
      <span className="text-lg font-black" style={{color}}>{value}%</span>
    </div>
    <input type="range" min="0" max="100" step="1" value={value}
      onChange={e=>onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{accentColor:color}}/>
    <div className="flex justify-between text-[10px] mt-1" style={{color:'var(--text-muted)'}}>
      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
    </div>
  </div>
);

const CategoryCard = ({record,onEdit,onDelete,onLogSession}) => {
  const meta = CATEGORY_META[record.category]||{emoji:'📌',color:'var(--primary)',desc:''};
  const topicPct = record.totalTopics>0?Math.round((record.completedTopics/record.totalTopics)*100):0;
  const scoreColor = record.score>=80?'#10B981':record.score>=60?'#F59E0B':'#EF4444';

  return (
    <div className="card hover:shadow-md transition-all duration-200 group flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{background:`color-mix(in srgb,${meta.color} 12%,transparent)`,border:`1px solid color-mix(in srgb,${meta.color} 25%,transparent)`}}>
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate" style={{color:'var(--text)'}}>{record.category}</h3>
            <p className="text-xs truncate" style={{color:'var(--text-3)'}}>{meta.desc}</p>
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

      {/* Score/Accuracy rings */}
      <div className="flex items-center justify-around py-3 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
        {[{v:record.score,color:scoreColor,label:'Score %'},{v:record.accuracy,color:meta.color,label:'Accuracy %'}].map(({v,color,label})=>(
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="relative">
              <Ring value={v} color={color} size={68} stroke={7}/>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-black" style={{color:'var(--text)'}}>{v}</span>
              </div>
            </div>
            <p className="text-[10px]" style={{color:'var(--text-3)'}}>{label}</p>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-black" style={{color:'var(--text)'}}>{record.completedTopics}</span>
          <span className="text-[10px]" style={{color:'var(--text-3)'}}>/{record.totalTopics} topics</span>
        </div>
      </div>

      {/* Topic progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{color:'var(--text-3)'}}>Topics completed</span>
          <span style={{color:'var(--text-2)'}}>{topicPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
          <div className="h-full rounded-full transition-all duration-700" style={{width:`${topicPct}%`,background:meta.color}}/>
        </div>
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text-2)'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-2)';}}
        onClick={()=>onLogSession(record)}>
        📝 Log Practice Session
      </button>
    </div>
  );
};

const UntrackedCard = ({category,onAdd}) => {
  const meta = CATEGORY_META[category]||{emoji:'📌',color:'var(--primary)'};
  return (
    <button onClick={()=>onAdd(category)}
      className="card flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-all group"
      style={{borderStyle:'dashed',borderColor:'var(--border)'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl opacity-40 group-hover:opacity-80 transition-opacity"
        style={{background:`color-mix(in srgb,${meta.color} 10%,transparent)`}}>{meta.emoji}</div>
      <p className="font-medium text-sm text-center px-2" style={{color:'var(--text-3)'}}>{category}</p>
      <span className="text-xs font-semibold" style={{color:'var(--primary)'}}>+ Add</span>
    </button>
  );
};

const AptitudePage = () => {
  const [records,setRecords]   = useState([]);
  const [summary,setSummary]   = useState(null);
  const [loading,setLoading]   = useState(true);
  const [saving,setSaving]     = useState(false);
  const [showAdd,setShowAdd]   = useState(false);
  const [showBulk,setShowBulk] = useState(false);
  const [editRec,setEditRec]   = useState(null);
  const [deleteRec,setDeleteRec] = useState(null);
  const [sessionRec,setSessionRec] = useState(null);
  const [form,setForm]         = useState({category:'',completedTopics:'0',totalTopics:'10',score:0,accuracy:0});
  const [formErrors,setFormErrors] = useState({});
  const [sessionForm,setSessionForm] = useState({score:70,accuracy:70,topicsCompleted:1});
  const [bulkForm,setBulkForm] = useState({});

  const trackedCats   = records.map(r=>r.category);
  const untrackedCats = ALL_CATEGORIES.filter(c=>!trackedCats.includes(c));

  const fetchAll = useCallback(async()=>{
    try{const[pr,sr]=await Promise.all([aptitudeService.getAll(),aptitudeService.getSummary()]);setRecords(pr.data.data);setSummary(sr.data.data);}
    catch{toast.error('Failed to load aptitude progress');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{fetchAll();},[fetchAll]);

  const openAdd=(c=null)=>{setForm({category:c||untrackedCats[0]||'',completedTopics:'0',totalTopics:'10',score:0,accuracy:0});setFormErrors({});setShowAdd(true);};
  const openBulk=()=>{const init={};untrackedCats.forEach(c=>{init[c]={enabled:untrackedCats.length<=2,score:0,accuracy:0,completedTopics:0,totalTopics:10};});setBulkForm(init);setShowBulk(true);};
  const openEdit=rec=>{setForm({category:rec.category,completedTopics:String(rec.completedTopics),totalTopics:String(rec.totalTopics),score:rec.score,accuracy:rec.accuracy});setFormErrors({});setEditRec(rec);};
  const openSession=rec=>{setSessionForm({score:rec.score,accuracy:rec.accuracy,topicsCompleted:1});setSessionRec(rec);};

  const validateForm=()=>{const e={};if(!form.category)e.category='Required';if(!form.totalTopics||Number(form.totalTopics)<1)e.totalTopics='Must be ≥1';if(Number(form.completedTopics)>Number(form.totalTopics))e.completedTopics='Cannot exceed total';setFormErrors(e);return!Object.keys(e).length;};

  const handleAdd=async e=>{e.preventDefault();if(!validateForm())return;setSaving(true);try{await aptitudeService.create({category:form.category,completedTopics:Number(form.completedTopics),totalTopics:Number(form.totalTopics),score:form.score,accuracy:form.accuracy});toast.success(`"${form.category}" added!`);setShowAdd(false);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleUpdate=async e=>{e.preventDefault();if(!validateForm())return;setSaving(true);try{await aptitudeService.update(editRec._id,{completedTopics:Number(form.completedTopics),totalTopics:Number(form.totalTopics),score:form.score,accuracy:form.accuracy});toast.success('Updated');setEditRec(null);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleLogSession=async e=>{e.preventDefault();setSaving(true);try{const{data}=await aptitudeService.logSession(sessionRec._id,sessionForm);toast.success(`Session logged for "${sessionRec.category}"`);setRecords(p=>p.map(r=>r._id===sessionRec._id?data.data:r));setSessionRec(null);aptitudeService.getSummary().then(({data:s})=>setSummary(s.data)).catch(()=>{});}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleBulkAdd=async e=>{e.preventDefault();const categories=Object.entries(bulkForm).filter(([,v])=>v.enabled).map(([category,v])=>({category,completedTopics:Number(v.completedTopics)||0,totalTopics:Number(v.totalTopics)||10,score:Number(v.score)||0,accuracy:Number(v.accuracy)||0}));if(!categories.length){toast.error('Enable at least one category');return;}setSaving(true);try{const{data}=await aptitudeService.bulkCreate(categories);toast.success(data.message);setShowBulk(false);fetchAll();}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);};};
  const handleDelete=async()=>{if(!deleteRec)return;try{await aptitudeService.delete(deleteRec._id);toast.success(`"${deleteRec.category}" removed`);setDeleteRec(null);fetchAll();}catch{toast.error('Failed');}};

  if(loading) return <div className="flex justify-center py-32"><Spinner size="lg"/></div>;

  const SliderSection=()=>(
    <div className="space-y-5 p-4 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
      <SliderField label="Current Score" value={form.score} onChange={v=>setForm(f=>({...f,score:v}))} color="var(--primary)"/>
      <SliderField label="Accuracy" value={form.accuracy} onChange={v=>setForm(f=>({...f,accuracy:v}))} color="var(--success)"/>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary */}
      {records.length>0&&summary&&(
        <div className="card" style={{background:'linear-gradient(135deg,color-mix(in srgb,var(--primary) 5%,var(--surface)),var(--surface))'}}>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-5 flex-shrink-0">
              {[{v:summary.avgScore,color:'var(--primary)',label:'Avg Score'},{v:summary.avgAccuracy,color:'var(--success)',label:'Avg Accuracy'}].map(({v,color,label})=>(
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Ring value={v} color={color} size={80} stroke={8}/>
                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-black" style={{color:'var(--text)'}}>{v}</span></div>
                  </div>
                  <p className="text-[10px]" style={{color:'var(--text-3)'}}>{label}</p>
                </div>
              ))}
            </div>
            <div className="hidden sm:block w-px" style={{background:'var(--border)'}}/>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              {[
                {label:'Categories',value:`${summary.categoriesTracked}/4`,color:'var(--text)'},
                {label:'Topics Done',value:summary.totalTopicsCompleted,sub:`/${summary.totalTopicsAvail}`,color:'var(--primary)'},
                ...(summary.bestCategory?[{label:'Strongest',value:summary.bestCategory.category,sub:`${summary.bestCategory.score}%`,color:'var(--success)'}]:[]),
                ...(summary.weakestCategory?[{label:'Needs Work',value:summary.weakestCategory.category,sub:`${summary.weakestCategory.score}%`,color:'var(--warning)'}]:[]),
              ].map(({label,value,sub,color})=>(
                <div key={label}>
                  <p className="text-xs" style={{color:'var(--text-3)'}}>{label}</p>
                  <p className="font-bold text-base mt-0.5 truncate" style={{color}}>{value}{sub&&<span className="text-xs font-normal" style={{color:'var(--text-3)'}}>{sub}</span>}</p>
                </div>
              ))}
            </div>
          </div>
          {summary.untrackedCategories?.length>0&&(
            <div className="mt-4 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{borderTop:'1px solid var(--border)'}}>
              <p className="text-xs" style={{color:'var(--text-3)'}}>Not tracking: <span style={{color:'var(--text-2)'}}>{summary.untrackedCategories.join(', ')}</span></p>
              {summary.untrackedCategories.length>1&&<button className="text-xs font-semibold hover:underline" style={{color:'var(--primary)'}} onClick={openBulk}>Add all {summary.untrackedCategories.length} at once →</button>}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{color:'var(--text-3)'}}>{records.length} / {ALL_CATEGORIES.length} categories tracked</p>
        <div className="flex items-center gap-2">
          {untrackedCats.length>1&&<button className="btn-secondary btn-sm" onClick={openBulk}>📋 Bulk Add</button>}
          <button className="btn-primary flex items-center gap-2" onClick={()=>openAdd()} disabled={untrackedCats.length===0}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Category
          </button>
        </div>
      </div>

      {!records.length&&<EmptyState icon={ChartIcon} title="No aptitude categories tracked yet" description="Track scores and accuracy across 4 key aptitude areas." action={<div className="flex gap-3 flex-wrap justify-center"><button className="btn-primary" onClick={openBulk}>Bulk Add All</button><button className="btn-secondary" onClick={()=>openAdd()}>Add Single</button></div>}/>}

      {records.length>0&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {records.map(rec=><CategoryCard key={rec._id} record={rec} onEdit={openEdit} onDelete={setDeleteRec} onLogSession={openSession}/>)}
          {untrackedCats.map(c=><UntrackedCard key={c} category={c} onAdd={openAdd}/>)}
        </div>
      )}

      {untrackedCats.length===0&&records.length>0&&<p className="text-center text-sm py-2" style={{color:'var(--text-3)'}}>🎯 All 4 aptitude categories are tracked. Keep practicing!</p>}

      {/* Add modal */}
      {showAdd&&(
        <Modal title="Add Aptitude Category" onClose={()=>setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4" noValidate>
            <div>
              <label className="label">Category</label>
              <select className={`input-field ${formErrors.category?'error':''}`} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {untrackedCats.map(c=><option key={c} value={c}>{CATEGORY_META[c]?.emoji} {c}</option>)}
              </select>
              {formErrors.category&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.category}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Topics</label>
                <input type="number" min="1" className={`input-field ${formErrors.totalTopics?'error':''}`} placeholder="10" value={form.totalTopics} onChange={e=>setForm({...form,totalTopics:e.target.value})}/>
                {formErrors.totalTopics&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.totalTopics}</p>}
              </div>
              <div>
                <label className="label">Completed</label>
                <input type="number" min="0" className={`input-field ${formErrors.completedTopics?'error':''}`} placeholder="0" value={form.completedTopics} onChange={e=>setForm({...form,completedTopics:e.target.value})}/>
                {formErrors.completedTopics&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{formErrors.completedTopics}</p>}
              </div>
            </div>
            <SliderSection/>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Adding…':'Add Category'}</button>
              <button type="button" className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editRec&&(
        <Modal title={`Edit — ${editRec.category}`} onClose={()=>setEditRec(null)}>
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <span className="text-2xl">{CATEGORY_META[editRec.category]?.emoji}</span>
              <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{editRec.category}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Total Topics</label><input type="number" min="1" className="input-field" value={form.totalTopics} onChange={e=>setForm({...form,totalTopics:e.target.value})}/></div>
              <div><label className="label">Completed</label><input type="number" min="0" className="input-field" value={form.completedTopics} onChange={e=>setForm({...form,completedTopics:e.target.value})}/></div>
            </div>
            <SliderSection/>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Saving…':'Update'}</button>
              <button type="button" className="btn-secondary" onClick={()=>setEditRec(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Session modal */}
      {sessionRec&&(
        <Modal title={`Log Session — ${sessionRec.category}`} onClose={()=>setSessionRec(null)}>
          <form onSubmit={handleLogSession} className="space-y-5" noValidate>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <span className="text-2xl">{CATEGORY_META[sessionRec.category]?.emoji}</span>
              <div>
                <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{sessionRec.category}</p>
                <p className="text-xs" style={{color:'var(--text-3)'}}>Current: {sessionRec.score}% score · {sessionRec.accuracy}% accuracy</p>
              </div>
            </div>
            <div className="space-y-5 p-4 rounded-xl" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <SliderField label="Session Score" value={sessionForm.score} onChange={v=>setSessionForm(f=>({...f,score:v}))} color="var(--primary)"/>
              <SliderField label="Session Accuracy" value={sessionForm.accuracy} onChange={v=>setSessionForm(f=>({...f,accuracy:v}))} color="var(--success)"/>
            </div>
            <div>
              <label className="label">Topics Completed This Session</label>
              <input type="number" min="0" className="input-field" value={sessionForm.topicsCompleted} onChange={e=>setSessionForm(f=>({...f,topicsCompleted:Number(e.target.value)}))}/>
              <p className="text-xs mt-1.5" style={{color:'var(--text-muted)'}}>Score is rolling average: 30% new + 70% existing</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Logging…':'Log Session'}</button>
              <button type="button" className="btn-secondary" onClick={()=>setSessionRec(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk modal */}
      {showBulk&&(
        <Modal title="Bulk Add Aptitude Categories" onClose={()=>setShowBulk(false)} wide>
          <form onSubmit={handleBulkAdd}>
            <p className="text-sm mb-4" style={{color:'var(--text-3)'}}>Enable the categories you want to track.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {untrackedCats.map(cat=>{
                const meta=CATEGORY_META[cat],val=bulkForm[cat]||{enabled:false,score:0,accuracy:0,completedTopics:0,totalTopics:10};
                return (
                  <div key={cat} className="p-4 rounded-xl border transition-all" style={{background:val.enabled?'color-mix(in srgb,var(--primary) 5%,var(--surface))':'var(--surface-2)',borderColor:val.enabled?'var(--primary)':'var(--border)'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" checked={val.enabled} onChange={e=>setBulkForm(f=>({...f,[cat]:{...val,enabled:e.target.checked}}))}/>
                      <span className="text-xl">{meta?.emoji}</span>
                      <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{cat}</p>
                    </div>
                    {val.enabled&&(
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="label">Total Topics</label><input type="number" min="1" className="input-field text-sm py-1.5" placeholder="10" value={val.totalTopics} onChange={e=>setBulkForm(f=>({...f,[cat]:{...val,totalTopics:e.target.value}}))}/></div>
                          <div><label className="label">Completed</label><input type="number" min="0" className="input-field text-sm py-1.5" placeholder="0" value={val.completedTopics} onChange={e=>setBulkForm(f=>({...f,[cat]:{...val,completedTopics:e.target.value}}))}/></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span style={{color:'var(--text-3)'}}>Score</span><span style={{color:'var(--primary)'}}>{val.score}%</span></div>
                          <input type="range" min="0" max="100" className="w-full h-1.5" style={{accentColor:'var(--primary)'}} value={val.score} onChange={e=>setBulkForm(f=>({...f,[cat]:{...val,score:Number(e.target.value)}}))}/>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span style={{color:'var(--text-3)'}}>Accuracy</span><span style={{color:'var(--success)'}}>{val.accuracy}%</span></div>
                          <input type="range" min="0" max="100" className="w-full h-1.5" style={{accentColor:'var(--success)'}} value={val.accuracy} onChange={e=>setBulkForm(f=>({...f,[cat]:{...val,accuracy:Number(e.target.value)}}))}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Adding…':`Add ${Object.values(bulkForm).filter(v=>v.enabled).length} Categor${Object.values(bulkForm).filter(v=>v.enabled).length===1?'y':'ies'}`}</button>
              <button type="button" className="btn-secondary" onClick={()=>setShowBulk(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteRec&&(
        <Modal title="Remove Category?" onClose={()=>setDeleteRec(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{color:'var(--text-2)'}}>Remove <strong style={{color:'var(--text)'}}>{deleteRec.category}</strong>? Score ({deleteRec.score}%) and progress will be lost.</p>
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
export default AptitudePage;