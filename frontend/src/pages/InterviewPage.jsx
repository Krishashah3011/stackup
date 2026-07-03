import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../services/api';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const TABS = [
  {key:'hrQuestions',label:'HR',emoji:'🤝',desc:'Behavioral & culture fit'},
  {key:'technicalQuestions',label:'Technical',emoji:'💻',desc:'Role & skills-based'},
  {key:'projectQuestions',label:'Projects',emoji:'🚀',desc:'Practical experience'},
  {key:'systemDesignQuestions',label:'System Design',emoji:'🏗️',desc:'Architecture & scalability'},
];
const DIFFICULTIES = ['Mixed','Easy','Medium','Hard'];
const DIFF_STYLES = {
  Easy:   {bg:'color-mix(in srgb,#10B981 12%,transparent)',color:'#059669',border:'color-mix(in srgb,#10B981 25%,transparent)'},
  Medium: {bg:'color-mix(in srgb,#F59E0B 12%,transparent)',color:'#D97706',border:'color-mix(in srgb,#F59E0B 25%,transparent)'},
  Hard:   {bg:'color-mix(in srgb,#EF4444 12%,transparent)',color:'#DC2626',border:'color-mix(in srgb,#EF4444 25%,transparent)'},
  Mixed:  {bg:'color-mix(in srgb,var(--primary) 12%,transparent)',color:'var(--primary)',border:'color-mix(in srgb,var(--primary) 25%,transparent)'},
};
const parseDifficulty = q => {const m=q.match(/^\[(Easy|Medium|Hard)\]/i);return m?{tag:m[1],text:q.replace(/^\[(?:Easy|Medium|Hard)\]\s*/i,'')}:{tag:null,text:q};};

const QuestionCard = ({question,index,bookmarked,onBookmark,showDifficulty=false}) => {
  const [copied,setCopied] = useState(false);
  const {tag,text} = showDifficulty?parseDifficulty(question):{tag:null,text:question};
  const ds = tag?DIFF_STYLES[tag]:null;
  const handleCopy=async()=>{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1500);};
  return (
    <div className="flex gap-3 p-4 rounded-xl border transition-all group"
      style={{background:'var(--surface-2)',borderColor:'var(--border)'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
        style={{background:'color-mix(in srgb,var(--primary) 12%,transparent)',color:'var(--primary)'}}>{index+1}</span>
      <div className="flex-1 min-w-0">
        {tag&&<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border mb-1.5" style={ds}>{tag}</span>}
        <p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{text}</p>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={handleCopy} className="p-1.5 rounded-lg transition-all" title="Copy"
          style={{color:copied?'var(--success)':'var(--text-3)',background:copied?'color-mix(in srgb,var(--success) 10%,transparent)':'transparent'}}>
          {copied?'✓':<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
        </button>
        <button onClick={()=>onBookmark(index)} className="p-1.5 rounded-lg transition-all" title="Star"
          style={{color:bookmarked?'#F59E0B':'var(--text-3)'}}>
          <svg className="w-3.5 h-3.5" fill={bookmarked?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </button>
      </div>
    </div>
  );
};

const GenerateForm = ({onGenerated,generating}) => {
  const [form,setForm] = useState({company:'',role:'',skills:'',difficulty:'Mixed',rounds:'3'});
  const [errors,setErrors] = useState({});
  const POPULAR_COMPANIES = ['Google','Amazon','Microsoft','Infosys','TCS','Wipro','Flipkart','Meta'];
  const POPULAR_ROLES     = ['Software Engineer','Frontend Developer','Backend Developer','Full Stack Developer','Data Analyst','DevOps Engineer'];
  const validate=()=>{const e={};if(!form.company.trim())e.company='Required';if(!form.role.trim())e.role='Required';setErrors(e);return!Object.keys(e).length;};
  const handleSubmit=e=>{e.preventDefault();if(!validate())return;const skills=form.skills.split(',').map(s=>s.trim()).filter(Boolean);onGenerated({...form,skills,rounds:Number(form.rounds)});};
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{background:'color-mix(in srgb,var(--primary) 12%,transparent)',border:'1px solid color-mix(in srgb,var(--primary) 25%,transparent)'}}>🤖</div>
        <div>
          <h2 className="font-bold" style={{color:'var(--text)'}}>AI Interview Question Generator</h2>
          <p className="text-xs" style={{color:'var(--text-3)'}}>Powered by Google Gemini — tailored to company & role</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Company Name *</label>
            <input className={`input-field ${errors.company?'error':''}`} placeholder="Google, Infosys…" value={form.company} onChange={e=>{setForm({...form,company:e.target.value});setErrors({...errors,company:''});}}/>
            {errors.company&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.company}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_COMPANIES.map(c=><button key={c} type="button" className="text-[10px] px-2 py-0.5 rounded-lg border transition-all font-medium"
                style={{background:'var(--surface-2)',borderColor:'var(--border)',color:'var(--text-3)'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}
                onClick={()=>setForm({...form,company:c})}>{c}</button>)}
            </div>
          </div>
          <div>
            <label className="label">Role / Position *</label>
            <input className={`input-field ${errors.role?'error':''}`} placeholder="Software Engineer…" value={form.role} onChange={e=>{setForm({...form,role:e.target.value});setErrors({...errors,role:''}); }}/>
            {errors.role&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.role}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_ROLES.map(r=><button key={r} type="button" className="text-[10px] px-2 py-0.5 rounded-lg border transition-all font-medium"
                style={{background:'var(--surface-2)',borderColor:'var(--border)',color:'var(--text-3)'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}
                onClick={()=>setForm({...form,role:r})}>{r}</button>)}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Skills / Technologies</label>
          <input className="input-field" placeholder="React, Node.js, SQL… (comma separated)" value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Difficulty</label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map(d=>{const ds=DIFF_STYLES[d];return(
                <button key={d} type="button" className="py-2 rounded-xl border text-xs font-semibold transition-all"
                  style={form.difficulty===d?{...ds,fontWeight:700}:{background:'var(--surface-2)',borderColor:'var(--border)',color:'var(--text-3)'}}
                  onClick={()=>setForm({...form,difficulty:d})}>{d}</button>
              );})}
            </div>
          </div>
          <div>
            <label className="label">Rounds</label>
            <div className="flex gap-2">
              {[3,4,5].map(n=>(
                <button key={n} type="button" className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                  style={Number(form.rounds)===n?{background:'color-mix(in srgb,var(--primary) 12%,transparent)',borderColor:'var(--primary)',color:'var(--primary)'}:{background:'var(--surface-2)',borderColor:'var(--border)',color:'var(--text-3)'}}
                  onClick={()=>setForm({...form,rounds:String(n)})}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={generating}>
          {generating?<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Generating with Gemini AI…</>:<>✨ Generate Interview Questions</>}
        </button>
      </form>
    </div>
  );
};

const ResultsPanel = ({result,onReset}) => {
  const [activeTab,setActiveTab]   = useState('hrQuestions');
  const [bookmarks,setBookmarks]   = useState({});
  const [showStarred,setShowStarred] = useState(false);
  const toggleBookmark=(tabKey,idx)=>setBookmarks(p=>{const s=new Set(p[tabKey]||[]);s.has(idx)?s.delete(idx):s.add(idx);return{...p,[tabKey]:s};});
  const copyAll=tabKey=>{const qs=result[tabKey]||[];navigator.clipboard.writeText(qs.map((q,i)=>`${i+1}. ${parseDifficulty(q).text}`).join('\n'));toast.success(`${qs.length} questions copied!`);};
  const copyAllQuestions=()=>{const lines=[];TABS.forEach(tab=>{const qs=result[tab.key]||[];if(qs.length){lines.push(`\n=== ${tab.label.toUpperCase()} ===`);qs.forEach((q,i)=>lines.push(`${i+1}. ${parseDifficulty(q).text}`));}});navigator.clipboard.writeText(lines.join('\n').trim());toast.success('All questions copied!');};
  const totalQ=TABS.reduce((s,t)=>s+(result[t.key]?.length||0),0);
  const totalB=Object.values(bookmarks).reduce((s,set)=>s+set.size,0);
  const curQ=result[activeTab]||[];
  const curB=bookmarks[activeTab]||new Set();
  const displayQ=showStarred?curQ.filter((_,i)=>curB.has(i)):curQ;
  const ds=DIFF_STYLES[result.difficulty||'Mixed']||DIFF_STYLES.Mixed;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card" style={{background:'linear-gradient(135deg,color-mix(in srgb,var(--primary) 5%,var(--surface)),var(--surface))'}}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border mb-2" style={ds}>{result.difficulty||'Mixed'}</span>
            <h2 className="text-xl font-black" style={{color:'var(--text)'}}>{result.company}</h2>
            <p className="text-sm" style={{color:'var(--text-3)'}}>{result.role}</p>
            {result.skills?.length>0&&<div className="flex flex-wrap gap-1.5 mt-2">{result.skills.map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:'color-mix(in srgb,var(--primary) 10%,transparent)',color:'var(--primary)',border:'1px solid color-mix(in srgb,var(--primary) 25%,transparent)'}}>{s}</span>)}</div>}
            {result.overview&&<p className="text-xs mt-2 italic leading-relaxed" style={{color:'var(--text-3)'}}>"{result.overview}"</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black" style={{color:'var(--primary)'}}>{totalQ}</p>
            <p className="text-xs" style={{color:'var(--text-3)'}}>questions generated</p>
            {totalB>0&&<p className="text-xs mt-0.5" style={{color:'#F59E0B'}}>⭐ {totalB} starred</p>}
          </div>
        </div>
        {result.tips?.length>0&&(
          <div className="mt-4 pt-4" style={{borderTop:'1px solid var(--border)'}}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{color:'var(--text-3)'}}>💡 PREP TIPS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {result.tips.map((tip,i)=><div key={i} className="flex gap-2 text-xs" style={{color:'var(--text-3)'}}><span style={{color:'var(--primary)'}}>→</span><span>{tip}</span></div>)}
            </div>
          </div>
        )}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="flex overflow-x-auto" style={{borderBottom:'1px solid var(--border)'}}>
          {TABS.map(tab=>{const count=result[tab.key]?.length||0,stars=(bookmarks[tab.key]||new Set()).size;if(!count)return null;return(
            <button key={tab.key} onClick={()=>{setActiveTab(tab.key);setShowStarred(false);}}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 border-b-2"
              style={{borderBottomColor:activeTab===tab.key?'var(--primary)':'transparent',color:activeTab===tab.key?'var(--primary)':'var(--text-3)',background:activeTab===tab.key?'color-mix(in srgb,var(--primary) 4%,transparent)':'transparent'}}>
              <span>{tab.emoji}</span><span>{tab.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:'var(--surface-2)',color:'var(--text-3)'}}>{count}</span>
              {stars>0&&<span style={{color:'#F59E0B'}}>⭐{stars}</span>}
            </button>
          );})}
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{color:'var(--text-3)'}}>{TABS.find(t=>t.key===activeTab)?.desc}</p>
              {(bookmarks[activeTab]||new Set()).size>0&&(
                <button className="text-xs px-2 py-0.5 rounded-lg border font-semibold transition-all"
                  style={showStarred?{background:'color-mix(in srgb,#F59E0B 12%,transparent)',borderColor:'color-mix(in srgb,#F59E0B 30%,transparent)',color:'#D97706'}:{background:'var(--surface-2)',borderColor:'var(--border)',color:'var(--text-3)'}}
                  onClick={()=>setShowStarred(!showStarred)}>
                  ⭐ {showStarred?'Show all':`Starred (${(bookmarks[activeTab]||new Set()).size})`}
                </button>
              )}
            </div>
            <button className="text-xs font-semibold hover:underline flex items-center gap-1" style={{color:'var(--primary)'}} onClick={()=>copyAll(activeTab)}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy all
            </button>
          </div>
          <div className="space-y-2.5">
            {displayQ.length>0?displayQ.map((q,i)=>{const actualIdx=showStarred?curQ.indexOf(q):i;return(<QuestionCard key={actualIdx} question={q} index={showStarred?actualIdx:i} bookmarked={curB.has(actualIdx)} onBookmark={()=>toggleBookmark(activeTab,actualIdx)} showDifficulty={activeTab==='technicalQuestions'}/>);}):<p className="text-sm text-center py-6" style={{color:'var(--text-3)'}}>{showStarred?'No starred questions.':'No questions here.'}</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button className="btn-secondary text-sm" onClick={onReset}>← Generate New Set</button>
        <button className="btn-primary text-sm" onClick={copyAllQuestions}>📋 Copy All Questions</button>
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const [result,setResult]       = useState(null);
  const [generating,setGenerating] = useState(false);
  const [history,setHistory]     = useState([]);
  const [histLoading,setHistLoading] = useState(true);
  const [showHistory,setShowHistory] = useState(false);

  const fetchHistory = useCallback(async()=>{
    try{const{data}=await aiService.getInterviewHistory({limit:10});setHistory(data.data||[]);}
    catch{}finally{setHistLoading(false);}
  },[]);
  useEffect(()=>{fetchHistory();},[fetchHistory]);

  const handleGenerate=async formData=>{setGenerating(true);setResult(null);try{const{data}=await aiService.generateInterview(formData);setResult(data.data);toast.success('Interview questions generated!');fetchHistory();}catch(err){toast.error(err.response?.data?.message||'Failed to generate. Try again.');}finally{setGenerating(false);};};
  const handleLoadSession=async id=>{try{const{data}=await aiService.getInterviewSession(id);setResult(data.data);setShowHistory(false);}catch{toast.error('Failed to load session');}};
  const handleDeleteSession=async id=>{try{await aiService.deleteInterviewSession(id);toast.success('Deleted');setHistory(p=>p.filter(s=>s._id!==id));if(result?._id===id)setResult(null);}catch{toast.error('Failed');}};

  return (
    <div className="animate-fade-in">
      <div className="flex gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          {generating&&(
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce-soft"
                style={{background:'color-mix(in srgb,var(--primary) 12%,transparent)',border:'1px solid color-mix(in srgb,var(--primary) 25%,transparent)'}}>🤖</div>
              <p className="font-bold text-lg" style={{color:'var(--text)'}}>Generating your interview set…</p>
              <p className="text-sm mt-1.5 max-w-xs mx-auto" style={{color:'var(--text-3)'}}>Gemini AI is crafting personalised HR, technical, project & system design questions</p>
              <div className="mt-6 max-w-xs mx-auto h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                <div className="h-full rounded-full animate-pulse" style={{width:'65%',background:'linear-gradient(90deg,var(--primary),var(--accent))'}}/>
              </div>
            </div>
          )}
          {!result&&!generating&&<GenerateForm onGenerated={handleGenerate} generating={generating}/>}
          {result&&!generating&&<ResultsPanel result={result} onReset={()=>setResult(null)}/>}
        </div>

        {/* History sidebar */}
        <div className={`flex-shrink-0 transition-all duration-300 ${showHistory?'w-64':'w-0 overflow-hidden'} hidden lg:block`}>
          {showHistory&&(
            <div className="card p-0 overflow-hidden sticky top-24">
              <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:'1px solid var(--border)'}}>
                <h3 className="font-semibold text-sm" style={{color:'var(--text-2)'}}>Past Sessions</h3>
                <span className="text-xs" style={{color:'var(--text-3)'}}>{history.length}</span>
              </div>
              <div className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {histLoading?<div className="flex justify-center py-6"><Spinner/></div>
                :history.length>0?(
                  <div className="space-y-1">
                    {history.map(s=>{
                      const d=Math.floor((Date.now()-new Date(s.createdAt))/86400000);
                      const dl=d===0?'Today':d===1?'Yesterday':`${d}d ago`;
                      const ds=DIFF_STYLES[s.difficulty||'Mixed']||DIFF_STYLES.Mixed;
                      return(
                        <div key={s._id} className="flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-all group"
                          style={{background:result?._id===s._id?'color-mix(in srgb,var(--primary) 8%,transparent)':'transparent',border:`1px solid ${result?._id===s._id?'var(--primary)':'transparent'}`}}
                          onMouseEnter={e=>{if(result?._id!==s._id)e.currentTarget.style.background='var(--surface-2)';}}
                          onMouseLeave={e=>{if(result?._id!==s._id)e.currentTarget.style.background='transparent';}}
                          onClick={()=>handleLoadSession(s._id)}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate" style={{color:'var(--text)'}}>{s.company}</p>
                            <p className="text-[10px] truncate" style={{color:'var(--text-3)'}}>{s.role}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px]" style={{color:'var(--text-muted)'}}>{dl}</span>
                              {s.difficulty&&<span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={ds}>{s.difficulty}</span>}
                            </div>
                          </div>
                          <button onClick={e=>{e.stopPropagation();handleDeleteSession(s._id);}} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{color:'var(--text-3)'}}
                            onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
                            onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ):<p className="text-xs text-center py-8" style={{color:'var(--text-muted)'}}>No past sessions yet</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      {history.length>0&&(
        <div className="hidden lg:flex justify-end mt-2">
          <button className="text-xs font-semibold hover:underline flex items-center gap-1.5" style={{color:'var(--text-3)'}} onClick={()=>setShowHistory(!showHistory)}>
            🕐 {showHistory?'Hide past sessions':`Past sessions (${history.length})`}
          </button>
        </div>
      )}
    </div>
  );
};
export default InterviewPage;