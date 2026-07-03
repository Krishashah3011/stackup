import { useState, useEffect, useCallback, useRef } from 'react';
import { applicationService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUSES = ['Applied','OA Scheduled','OA Cleared','Interview Scheduled','Selected','Rejected'];
const ALL_FILTERS = ['All',...STATUSES];
const PIPELINE = [
  {key:'Applied',color:'#3B82F6',emoji:'📤'},{key:'OA Scheduled',color:'#F59E0B',emoji:'📝'},
  {key:'OA Cleared',color:'#F59E0B',emoji:'✅'},{key:'Interview Scheduled',color:'#8B5CF6',emoji:'🎤'},
  {key:'Selected',color:'#10B981',emoji:'🏆'},{key:'Rejected',color:'#EF4444',emoji:'❌'},
];
const SORT_OPTIONS = [{value:'createdAt',label:'Date Added'},{value:'appliedDate',label:'Applied Date'},{value:'company',label:'Company'},{value:'status',label:'Status'}];
const EMPTY_FORM = {company:'',role:'',package:'',status:'Applied',appliedDate:new Date().toISOString().split('T')[0],notes:''};

const BriefcaseIcon = p => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;

const Modal = ({title,onClose,children,size='lg'}) => {
  const maxW = size==='sm'?'max-w-sm':size==='md'?'max-w-md':'max-w-lg';
  return (
    <div className="modal-overlay">
      <div className={`modal-panel animate-scale-in ${maxW}`}>
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
};

const AppForm = ({initial=EMPTY_FORM,onSubmit,onCancel,loading}) => {
  const [form,setForm]=useState(initial);
  const [errors,setErrors]=useState({});
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:''}));};
  const validate=()=>{const e={};if(!form.company.trim())e.company='Required';if(!form.role.trim())e.role='Required';if(form.notes.length>500)e.notes='Max 500 chars';setErrors(e);return !Object.keys(e).length;};
  const handleSubmit=ev=>{ev.preventDefault();if(validate())onSubmit(form);};
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Company *</label>
          <input className={`input-field ${errors.company?'error':''}`} placeholder="Google…" value={form.company} onChange={e=>set('company',e.target.value)}/>
          {errors.company&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.company}</p>}
        </div>
        <div>
          <label className="label">Role *</label>
          <input className={`input-field ${errors.role?'error':''}`} placeholder="SWE…" value={form.role} onChange={e=>set('role',e.target.value)}/>
          {errors.role&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.role}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Package</label>
          <input className="input-field" placeholder="₹12 LPA" value={form.package} onChange={e=>set('package',e.target.value)}/>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={e=>set('status',e.target.value)}>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Applied Date</label>
        <input type="date" className="input-field" value={form.appliedDate} onChange={e=>set('appliedDate',e.target.value)} max={new Date().toISOString().split('T')[0]}/>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="label mb-0">Notes</label>
          <span className="text-xs" style={{color:form.notes.length>450?'var(--warning)':'var(--text-muted)'}}>{form.notes.length}/500</span>
        </div>
        <textarea className={`input-field resize-none ${errors.notes?'error':''}`} rows={3} placeholder="Any notes…" value={form.notes} onChange={e=>set('notes',e.target.value)} maxLength={500}/>
        {errors.notes&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.notes}</p>}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading?<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</>:'Save application'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const Drawer = ({app,onClose,onEdit,onDelete,onStatusChange,updatingStatus}) => {
  const fmt=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
  const days=d=>{if(!d)return null;const diff=Math.floor((Date.now()-new Date(d))/86400000);return diff===0?'Today':diff===1?'Yesterday':`${diff} days ago`;};
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative w-full max-w-sm flex flex-col h-full animate-slide-up shadow-2xl" onClick={e=>e.stopPropagation()}
        style={{background:'var(--surface)',borderLeft:'1px solid var(--border)'}}>
        <div className="flex items-start justify-between p-5 flex-shrink-0" style={{borderBottom:'1px solid var(--border)'}}>
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-black truncate" style={{color:'var(--text)'}}>{app.company}</h2>
            <p className="text-sm truncate" style={{color:'var(--text-3)'}}>{app.role}</p>
          </div>
          <button onClick={onClose} style={{color:'var(--text-3)'}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          <div>
            <p className="label">Current Status</p>
            <StatusBadge status={app.status}/>
          </div>
          <div>
            <p className="label">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s=>(
                <button key={s} disabled={app.status===s||!!updatingStatus} onClick={()=>onStatusChange(app._id,s)}
                  className="text-xs px-3 py-2 rounded-xl border font-medium transition-all text-left"
                  style={{
                    background: app.status===s?'color-mix(in srgb, var(--primary) 12%, transparent)':'var(--surface-2)',
                    borderColor: app.status===s?'var(--primary)':'var(--border)',
                    color: app.status===s?'var(--primary)':'var(--text-2)',
                    cursor: app.status===s?'default':'pointer',
                  }}>
                  {updatingStatus===s?'Updating…':s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <p className="text-xs" style={{color:'var(--text-3)'}}>Package</p>
              <p className="text-sm font-semibold mt-0.5" style={{color:'var(--text)'}}>{app.package||'Not disclosed'}</p>
            </div>
            <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              <p className="text-xs" style={{color:'var(--text-3)'}}>Applied</p>
              <p className="text-sm font-semibold mt-0.5" style={{color:'var(--text)'}}>{days(app.appliedDate)}</p>
            </div>
          </div>
          {app.notes&&<div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <p className="text-xs mb-1" style={{color:'var(--text-3)'}}>Notes</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{color:'var(--text-2)'}}>{app.notes}</p>
          </div>}
          <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <p className="text-xs" style={{color:'var(--text-3)'}}>Applied Date</p>
            <p className="text-sm font-semibold mt-0.5" style={{color:'var(--text)'}}>{fmt(app.appliedDate)}</p>
          </div>
        </div>
        <div className="flex gap-3 p-5 flex-shrink-0" style={{borderTop:'1px solid var(--border)'}}>
          <button className="btn-primary flex-1 text-sm" onClick={()=>onEdit(app)}>✏️ Edit</button>
          <button className="btn-danger text-sm" onClick={()=>onDelete(app)}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
};

const TrackerPage = () => {
  const [applications,setApplications]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [filter,setFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('createdAt');
  const [order,setOrder]=useState('desc');
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [deleting,setDeleting]=useState(null);
  const [viewing,setViewing]=useState(null);
  const [updatingStatus,setUpdatingStatus]=useState(null);
  const searchRef=useRef(null);
  const timer=useRef(null);

  const fetchApplications=useCallback(async()=>{
    try {
      const q={sort,order,...(filter!=='All'&&{status:filter}),...(search.trim()&&{search:search.trim()})};
      const {data}=await applicationService.getAll(q);
      setApplications(data.data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  },[filter,search,sort,order]);

  const fetchStats=useCallback(async()=>{
    try{const{data}=await applicationService.getStats();setStats(data.data);}catch{}
  },[]);

  useEffect(()=>{fetchStats();},[fetchStats]);
  useEffect(()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>fetchApplications(),300);return()=>clearTimeout(timer.current);},[fetchApplications]);

  const handleSortClick=field=>{if(sort===field)setOrder(o=>o==='asc'?'desc':'asc');else{setSort(field);setOrder('asc');}};
  const counts=stats?.counts||{};
  const totalApps=counts.total||0;

  const handleCreate=async form=>{setSaving(true);try{await applicationService.create(form);toast.success('Application added!');setShowModal(false);await Promise.all([fetchApplications(),fetchStats()]);}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);}};
  const handleUpdate=async form=>{setSaving(true);try{await applicationService.update(editing._id,form);toast.success('Updated');setEditing(null);setViewing(null);await Promise.all([fetchApplications(),fetchStats()]);}catch(err){toast.error(err.response?.data?.message||'Failed');}finally{setSaving(false);}};
  const handleDelete=async()=>{try{await applicationService.delete(deleting._id);toast.success(`${deleting.company} removed`);setDeleting(null);setViewing(null);await Promise.all([fetchApplications(),fetchStats()]);}catch{toast.error('Failed');}};
  const handleStatusChange=async(id,status)=>{setUpdatingStatus(status);try{await applicationService.update(id,{status});toast.success(`Status → "${status}"`);setApplications(p=>p.map(a=>a._id===id?{...a,status}:a));if(viewing?._id===id)setViewing(v=>({...v,status}));fetchStats();}catch{toast.error('Failed');}finally{setUpdatingStatus(null);};};

  const SortTh=({field,children,className=''})=>(
    <th className={`table-header-cell cursor-pointer hover:opacity-70 select-none ${className}`} onClick={()=>handleSortClick(field)}>
      {children}{sort===field&&<span className="ml-1">{order==='asc'?'↑':'↓'}</span>}
    </th>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Pipeline strip */}
      {!loading&&(
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{color:'var(--text-2)'}}>Application Pipeline</p>
            <span className="text-xs" style={{color:'var(--text-3)'}}>{totalApps} total</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PIPELINE.map(stage=>{
              const count=counts[stage.key]||0,pct=totalApps>0?Math.round((count/totalApps)*100):0,isActive=filter===stage.key;
              return (
                <button key={stage.key} onClick={()=>setFilter(isActive?'All':stage.key)}
                  className="flex flex-col items-center p-2.5 rounded-xl border transition-all text-center"
                  style={{
                    background:isActive?`color-mix(in srgb, ${stage.color} 10%, transparent)`:'var(--surface-2)',
                    borderColor:isActive?stage.color:'var(--border)',
                  }}>
                  <span className="text-base mb-1">{stage.emoji}</span>
                  <span className="text-lg font-black" style={{color:isActive?stage.color:'var(--text)'}}>{count}</span>
                  <span className="text-[10px] leading-tight" style={{color:'var(--text-3)'}}>{stage.key.replace(' Scheduled','').replace(' Cleared','✓')}</span>
                  {totalApps>0&&<span className="text-[10px] mt-0.5" style={{color:isActive?stage.color:'var(--text-muted)'}}>{pct}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text-3)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input ref={searchRef} className="input-field pl-9" placeholder="Search company or role…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity" onClick={()=>setSearch('')} style={{color:'var(--text-3)'}}>✕</button>}
        </div>
        <select className="input-field sm:w-48" value={filter} onChange={e=>setFilter(e.target.value)}>
          {ALL_FILTERS.map(s=><option key={s} value={s}>{s}{s!=='All'&&counts[s]!==undefined?` (${counts[s]})`:''}</option>)}
        </select>
        <select className="input-field sm:w-44 lg:hidden" value={`${sort}-${order}`} onChange={e=>{const[f,o]=e.target.value.split('-');setSort(f);setOrder(o);}}>
          {SORT_OPTIONS.flatMap(o=>[<option key={`${o.value}-desc`} value={`${o.value}-desc`}>{o.label} ↓</option>,<option key={`${o.value}-asc`} value={`${o.value}-asc`}>{o.label} ↑</option>])}
        </select>
        <button className="btn-primary flex items-center gap-2 flex-shrink-0" onClick={()=>setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Application
        </button>
      </div>

      {!loading&&<p className="text-xs" style={{color:'var(--text-3)'}}>Showing {applications.length} application{applications.length!==1?'s':''}{filter!=='All'?` · "${filter}"`:''}{search?` · matching "${search}"`:''}</p>}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading?<div className="flex justify-center py-16"><Spinner size="lg"/></div>
        :applications.length===0?<EmptyState icon={BriefcaseIcon} title={search||filter!=='All'?'No matching applications':'No applications yet'} description={search||filter!=='All'?'Try clearing filters.':'Start tracking your placement journey.'} action={<div className="flex gap-3 justify-center flex-wrap"><button className="btn-primary" onClick={()=>setShowModal(true)}>Add Application</button>{(search||filter!=='All')&&<button className="btn-secondary" onClick={()=>{setSearch('');setFilter('All');}}>Clear Filters</button>}</div>}/>
        :<div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <SortTh field="company">Company</SortTh>
                <SortTh field="role" className="hidden sm:table-cell">Role</SortTh>
                <th className="table-header-cell hidden md:table-cell">Package</th>
                <SortTh field="status">Status</SortTh>
                <SortTh field="appliedDate" className="hidden lg:table-cell">Applied</SortTh>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app=>(
                <tr key={app._id} className="table-row cursor-pointer" onClick={()=>setViewing(app)}>
                  <td className="table-cell">
                    <p className="font-semibold" style={{color:'var(--text)'}}>{app.company}</p>
                    <p className="text-xs sm:hidden" style={{color:'var(--text-3)'}}>{app.role}</p>
                  </td>
                  <td className="table-cell hidden sm:table-cell" style={{color:'var(--text-2)'}}>{app.role}</td>
                  <td className="table-cell hidden md:table-cell text-xs" style={{color:'var(--text-3)'}}>{app.package&&app.package!=='Not disclosed'?app.package:'—'}</td>
                  <td className="table-cell"><StatusBadge status={app.status}/></td>
                  <td className="table-cell hidden lg:table-cell text-xs" style={{color:'var(--text-3)'}}>{app.appliedDate?new Date(app.appliedDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                  <td className="table-cell" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg transition-all" title="Edit" onClick={()=>setEditing(app)} style={{color:'var(--text-3)'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--primary)';e.currentTarget.style.background='color-mix(in srgb, var(--primary) 10%, transparent)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.background='transparent';}}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button className="p-1.5 rounded-lg transition-all" title="Delete" onClick={()=>setDeleting(app)} style={{color:'var(--text-3)'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--danger)';e.currentTarget.style.background='color-mix(in srgb, var(--danger) 10%, transparent)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.background='transparent';}}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      {showModal&&<Modal title="Add Application" onClose={()=>setShowModal(false)}><AppForm onSubmit={handleCreate} onCancel={()=>setShowModal(false)} loading={saving}/></Modal>}
      {editing&&<Modal title="Edit Application" onClose={()=>setEditing(null)}><AppForm initial={{company:editing.company,role:editing.role,package:editing.package==='Not disclosed'?'':(editing.package||''),status:editing.status,appliedDate:editing.appliedDate?new Date(editing.appliedDate).toISOString().split('T')[0]:new Date().toISOString().split('T')[0],notes:editing.notes||''}} onSubmit={handleUpdate} onCancel={()=>setEditing(null)} loading={saving}/></Modal>}
      {deleting&&(
        <Modal title="Delete Application?" onClose={()=>setDeleting(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm" style={{color:'var(--text-2)'}}>Remove application to <strong style={{color:'var(--text)'}}>{deleting.company}</strong>?</p>
            <div className="flex gap-3">
              <button className="flex-1 btn text-white rounded-xl py-2.5" style={{background:'var(--danger)'}} onClick={handleDelete}>Delete</button>
              <button className="btn-secondary flex-1" onClick={()=>setDeleting(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {viewing&&<Drawer app={viewing} onClose={()=>setViewing(null)} onEdit={app=>{setEditing(app);setViewing(null);}} onDelete={app=>{setDeleting(app);setViewing(null);}} onStatusChange={handleStatusChange} updatingStatus={updatingStatus}/>}
    </div>
  );
};
export default TrackerPage;