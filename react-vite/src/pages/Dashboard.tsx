import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Users, FileText, AlertTriangle, CheckCircle, Shield, Activity, FileWarning, Database, Download, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const KPICard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-xl flex items-center justify-between"
  >
    <div>
      <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-100">{value}</h3>
    </div>
    <div className={`p-3 rounded-full bg-${color}/20 text-${color} glow`}>
      <Icon className="w-6 h-6" />
    </div>
  </motion.div>
);

import Modal from '../components/Modal';
import { useToastStore } from '../store/toastStore';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore } from '../store/caseStore';
import { useUserStore } from '../store/userStore';
import { useTrendStore } from '../store/trendStore';
import { generateCasePDF } from '../utils/pdfExport';

const formatNames = (names: string | string[] | undefined): string => {
  if (!names) return 'Unknown';
  if (Array.isArray(names)) return names.length > 0 ? names.join(', ') : 'Unknown';
  return names;
};

const MultiNameInput = ({ name, label, required, placeholder }: { name: string, label: string, required?: boolean, placeholder?: string }) => {
  const [names, setNames] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newName = inputValue.trim().replace(/[^a-zA-Z\s]/g, '').replace(/(.)\1\1/gi, '$1$1');
      if (newName && !names.includes(newName)) {
        setNames([...names, newName]);
        setInputValue('');
      }
    }
  };

  const removeName = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {names.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {names.map((n, i) => (
            <div key={i} className="flex items-center bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
              <span>{n}</span>
              <button type="button" onClick={() => removeName(i)} className="ml-2 hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
              <input type="hidden" name={name} value={n} />
            </div>
          ))}
        </div>
      )}
      <input
        type="text"
        name={name}
        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors"
        placeholder={names.length === 0 ? placeholder : "Add another (Press Enter)"}
        value={inputValue}
        onChange={(e) => {
           let val = e.target.value.replace(/[^a-zA-Z\s,]/g, '').replace(/(.)\1\1/gi, '$1$1');
           setInputValue(val);
        }}
        onKeyDown={handleKeyDown}
        required={required && names.length === 0}
      />
    </div>
  );
};

const DeskOfficerDashboard = () => {
  const { cases, addCase } = useCaseStore();
  const { user } = useAuthStore();
  const [isFirModalOpen, setFirModalOpen] = useState(false);
  const [selectedFir, setSelectedFir] = useState<any>(null);
  const { addToast } = useToastStore();

  // Full Karnataka district + landmark coordinate lookup
  const KARNATAKA_COORDS: Record<string, [number, number]> = {
    // Major cities & landmarks
    'ramakrishna nagar': [12.2828, 76.6235], 'ramakrishnagar': [12.2828, 76.6235],
    'agrahara': [12.2985, 76.6521],
    'vijayanagar': [12.9560, 77.5350], 'hebbal': [13.0354, 77.5988],
    'koramangala': [12.9352, 77.6245], 'jayanagar': [12.9308, 77.5831],
    'jp nagar': [12.9107, 77.5857], 'indiranagar': [12.9784, 77.6408],
    'whitefield': [12.9698, 77.7499], 'electronic city': [12.8399, 77.6770],
    'om beach': [14.7133, 74.3183], 'gokarna': [14.5479, 74.3188],
    'malpe beach': [13.3533, 74.6938], 'panambur beach': [12.9636, 74.8060],
    // All 31 Karnataka districts (used as fallback when location string matches district)
    'bengaluru': [12.9716, 77.5946], 'bangalore': [12.9716, 77.5946],
    'bengaluru rural': [13.1986, 77.5682],
    'mysuru': [12.2958, 76.6394], 'mysore': [12.2958, 76.6394],
    'hubballi': [15.3647, 75.1240], 'hubli': [15.3647, 75.1240],
    'dharwad': [15.4589, 75.0078],
    'mangaluru': [12.9141, 74.8560], 'mangalore': [12.9141, 74.8560],
    'belagavi': [15.8497, 74.4977], 'belgaum': [15.8497, 74.4977],
    'kalaburagi': [17.3297, 76.8343], 'gulbarga': [17.3297, 76.8343],
    'davangere': [14.4644, 75.9218],
    'ballari': [15.1394, 76.9214], 'bellary': [15.1394, 76.9214],
    'tumakuru': [13.3379, 77.1173], 'tumkur': [13.3379, 77.1173],
    'shivamogga': [13.9299, 75.5681], 'shimoga': [13.9299, 75.5681],
    'vijayapura': [16.8302, 75.7100], 'bijapur': [16.8302, 75.7100],
    'raichur': [16.2120, 77.3566],
    'udupi': [13.3409, 74.7421],
    'hassan': [13.0068, 76.0996],
    'chikkamagaluru': [13.3161, 75.7720], 'chikmagalur': [13.3161, 75.7720],
    'kodagu': [12.4244, 75.7382], 'madikeri': [12.4244, 75.7382], 'coorg': [12.4244, 75.7382],
    'mandya': [12.5218, 76.8951],
    'chamarajanagar': [11.9261, 76.9437],
    'chikkaballapur': [13.4355, 77.7315],
    'chitradurga': [14.2251, 76.4020],
    'gadag': [15.4316, 75.6269],
    'koppal': [15.3474, 76.1547],
    'bagalkote': [16.1691, 75.6960], 'bagalkot': [16.1691, 75.6960],
    'bidar': [17.9104, 77.5199],
    'yadgir': [16.7689, 77.1381],
    'haveri': [14.7957, 75.4004],
    'uttara kannada': [14.9807, 74.5815], 'karwar': [14.8136, 74.1285],
    'dakshina kannada': [12.8700, 75.2479],
    'kolar': [13.1360, 78.1294],
    'ramanagara': [12.7161, 77.2820],
    'vijayanagara': [15.1394, 76.9214],
    'bengaluru north': [13.0827, 77.5878],
  };

  const handleNewFir = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const incidentType = formData.get('incidentType') || 'Cyber Crime';
    const caseCategory = formData.get('caseCategory') || 'FIR';
    const complainantNames = (formData.getAll('complainantName') as string[]).filter(n => n.trim().length > 0);
    const victimNames = (formData.getAll('victimName') as string[]).filter(n => n.trim().length > 0);
    const suspectNames = (formData.getAll('suspectName') as string[]).filter(n => n.trim().length > 0);
    
    const complainantName = complainantNames.length > 0 ? complainantNames : ['Unknown'];
    const victimName = victimNames.length > 0 ? victimNames : ['Unknown'];
    const suspectName = suspectNames.length > 0 ? suspectNames : ['Unknown'];
    const district = formData.get('district') || 'Bengaluru';
    const incidentLocation = formData.get('incidentLocation') as string || '';
    
    let categoryCode = '1';
    if (caseCategory === 'UDR') categoryCode = '3';
    else if (caseCategory === 'Zero FIR') categoryCode = '8';
    else if (caseCategory === 'PAR') categoryCode = '4';

    const districtId = '0443';
    const psId = '0006';
    const year = new Date().getFullYear().toString();
    
    // Find highest serial number among existing cases
    const maxSerial = cases.reduce((max, c) => {
      const serialStr = c.id ? c.id.slice(-5) : '';
      const serialNum = parseInt(serialStr, 10);
      return !isNaN(serialNum) && serialNum > max ? serialNum : max;
    }, 0);
    
    const nextSerialNum = maxSerial + 1;
    const serial = nextSerialNum.toString().padStart(5, '0');
    const crimeNo = `${categoryCode}${districtId}${psId}${year}${serial}`;
    
    addToast('Geocoding location...', 'info');
    let lat: number | undefined, lng: number | undefined;

    if (incidentLocation) {
      // 1. Try Nominatim with Karnataka, India scope for accuracy
      try {
        const query = encodeURIComponent(`${incidentLocation}, Karnataka, India`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.warn('Nominatim geocoding failed, using local lookup:', err);
      }

      // 2. Fallback: local keyword lookup if Nominatim returned nothing
      if (!lat || !lng) {
        const locLower = incidentLocation.toLowerCase();
        for (const [key, coords] of Object.entries(KARNATAKA_COORDS)) {
          if (locLower.includes(key)) {
            [lat, lng] = coords;
            break;
          }
        }
      }
    }
    
    const newCase = {
      id: crimeNo,
      caseNo: `${year}${serial}`,
      type: incidentType.toString(),
      status: 'Initial Review',
      assignee: 'Unassigned',
      complainantName,
      victimName,
      suspectName,
      district,
      location: incidentLocation,   // Save the raw location string
      lat,
      lng,
      date: new Date().toLocaleDateString('en-IN'),
      creator: user?.name
    };
    
    addCase(newCase);
    addToast(`${caseCategory} filed! Location pinned on Digital Twin map.`, 'success');
    setFirModalOpen(false);
  };

  const handleStrictNameInput = (e: React.FormEvent<HTMLInputElement>) => {
    let val = e.currentTarget.value.replace(/[^a-zA-Z]/g, '');
    val = val.replace(/(.)\1\1/gi, '$1$1');
    e.currentTarget.value = val;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-100 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary" /> Station House Desk
        </h3>
        <button 
          onClick={() => setFirModalOpen(true)}
          className="bg-primary hover:bg-primary/80 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-lg shadow-primary/25"
        >
          + File New FIR
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((c, idx) => (
          <motion.div
            key={c.id || `case-${idx}`}
            whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(99,102,241,0.25)' }}
            onClick={() => setSelectedFir(c)}
            className="glass p-5 rounded-xl border-l-4 border-l-primary flex flex-col justify-between h-40 cursor-pointer group"
          >
             <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-400 font-mono">{c.id}</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/20 text-primary font-bold uppercase">{c.status}</span>
                </div>
                <h4 className="font-semibold text-white truncate mb-1 group-hover:text-primary transition-colors">{c.type}</h4>
                <p className="text-xs text-gray-500">Complainant: {formatNames(c.complainantName)}</p>
             </div>
             <div className="flex justify-between items-center mt-2">
               <span className="text-xs text-gray-600">Assignee: {c.assignee}</span>
               <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">View Details →</span>
             </div>
          </motion.div>
        ))}
        {cases.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-10 glass rounded-xl">
            No FIRs filed recently.
          </div>
        )}
      </div>

      <Modal isOpen={isFirModalOpen} onClose={() => setFirModalOpen(false)} title="File New FIR" maxWidth="max-w-3xl">
        <form onSubmit={handleNewFir} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <MultiNameInput name="complainantName" label="Complainant Name" required={true} placeholder="Enter full name" />
            </div>
            <div>
              <MultiNameInput name="victimName" label="Victim Name" placeholder="Enter full name (if known)" />
            </div>
            <div className="md:col-span-2">
              <MultiNameInput name="suspectName" label="Primary Suspect Name" placeholder="Enter name (if known)" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Case Category <span className="text-danger">*</span></label>
              <select name="caseCategory" required defaultValue="" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                <option value="" disabled>Select category...</option>
                <option>FIR</option>
                <option>UDR</option>
                <option>Zero FIR</option>
                <option>PAR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Incident Type <span className="text-danger">*</span></label>
              <select name="incidentType" required defaultValue="Cyber Crime" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                <option value="" disabled>Select category...</option>
                <option>Cyber Crime</option>
                <option>Theft / Burglary</option>
                <option>Assault / Violence</option>
                <option>Financial Fraud</option>
                <option>Missing Person</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date & Time <span className="text-danger">*</span></label>
              <input required type="datetime-local" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">District <span className="text-danger">*</span></label>
              <select name="district" required defaultValue="Bengaluru" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                <option value="Bengaluru">Bengaluru</option>
                <option value="Bengaluru Rural">Bengaluru Rural</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
                <option value="Mangaluru">Mangaluru (Dakshina Kannada)</option>
                <option value="Belagavi">Belagavi</option>
                <option value="Kalaburagi">Kalaburagi</option>
                <option value="Davangere">Davangere</option>
                <option value="Ballari">Ballari</option>
                <option value="Tumakuru">Tumakuru</option>
                <option value="Shivamogga">Shivamogga</option>
                <option value="Vijayapura">Vijayapura</option>
                <option value="Raichur">Raichur</option>
                <option value="Udupi">Udupi</option>
                <option value="Hassan">Hassan</option>
                <option value="Chikkamagaluru">Chikkamagaluru</option>
                <option value="Kodagu">Kodagu (Coorg)</option>
                <option value="Mandya">Mandya</option>
                <option value="Chamarajanagar">Chamarajanagar</option>
                <option value="Chikkaballapur">Chikkaballapur</option>
                <option value="Chitradurga">Chitradurga</option>
                <option value="Gadag">Gadag</option>
                <option value="Koppal">Koppal</option>
                <option value="Bagalkote">Bagalkote</option>
                <option value="Bidar">Bidar</option>
                <option value="Yadgir">Yadgir</option>
                <option value="Haveri">Haveri</option>
                <option value="Uttara Kannada">Uttara Kannada</option>
                <option value="Kolar">Kolar</option>
                <option value="Ramanagara">Ramanagara</option>
                <option value="Vijayanagara">Vijayanagara</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location of Incident <span className="text-danger">*</span></label>
              <input name="incidentLocation" onInput={handleStrictNameInput} required type="text" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" placeholder="Enter address or landmark" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Brief Description</label>
            <textarea required rows={3} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors resize-none" placeholder="Provide a summary of the incident..."></textarea>
          </div>

          <div className="pt-2 border-t border-white/10 mt-2">
            <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg mt-2 transition-colors flex justify-center items-center">
              Submit Official FIR Draft
            </button>
          </div>
        </form>
      </Modal>

      {/* FIR Detail Modal */}
      <Modal isOpen={!!selectedFir} onClose={() => setSelectedFir(null)} title="FIR Details" maxWidth="max-w-2xl">
        {selectedFir && (
          <div className="space-y-5 text-sm">
            {/* Header banner */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Crime Reference Number</p>
                <p className="text-lg font-bold text-primary font-mono">{selectedFir.id}</p>
              </div>
              <span className="text-[11px] px-3 py-1.5 rounded-full bg-primary/20 text-primary font-bold uppercase">{selectedFir.status}</span>
            </div>

            {/* 2-col grid of fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Incident Type</p>
                <p className="text-gray-100 font-medium">{selectedFir.type || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Complainant Name</p>
                <p className="text-gray-100">{formatNames(selectedFir.complainantName) || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Victim Name</p>
                <p className="text-gray-100">{formatNames(selectedFir.victimName) || '—'}</p>
              </div>
              <div className="col-span-2 bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary Suspect(s)</p>
                <p className="text-gray-100 font-medium">{formatNames(selectedFir.suspectName) || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-gray-100">{selectedFir.assignee || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">District</p>
                <p className="text-gray-100">{selectedFir.district || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Filed</p>
                <p className="text-gray-100">{selectedFir.date || '—'}</p>
              </div>
            </div>

            {/* Location */}
            {selectedFir.location && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Location of Incident</p>
                <p className="text-gray-100 bg-black/20 rounded-lg p-3">{selectedFir.location}</p>
              </div>
            )}

            {/* Filed By */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-gray-500">Filed by: <span className="text-gray-300 font-medium">{selectedFir.creator || user?.name || 'Unknown'}</span></p>
              <button
                onClick={() => setSelectedFir(null)}
                className="text-xs bg-white/10 hover:bg-primary/30 text-gray-300 hover:text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const InvestigatorDashboard = () => {
  const { cases, updateCase } = useCaseStore();
  const { users } = useUserStore();
  const { user } = useAuthStore();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseToReassign, setCaseToReassign] = useState<any>(null);
  const [isTasksModalOpen, setTasksModalOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, caseId: '104430006202600001', title: 'Submit Charge Sheet for 202600001', due: 'Due today by 17:00', color: 'warning' },
    { id: 2, caseId: '104430006202600001', title: 'Interrogate suspect Ravi Kumar', due: 'Scheduled for 14:30', color: 'danger' },
    { id: 3, caseId: '104430006202600001', title: 'Collect Cyber Forensic Report', due: 'Ready at lab', color: 'primary' },
    { id: 4, caseId: '104430006202600001', title: 'Review CCTV footage from MG Road', due: 'Due tomorrow', color: 'primary' },
    { id: 5, caseId: '104430006202600003', title: 'File preliminary report for Case #202600003', due: 'Due today', color: 'warning' }
  ]);
  
  const activeTasks = useMemo(() => {
    return tasks.filter(t => t.caseId === selectedCase?.id);
  }, [tasks, selectedCase]);
  const { addToast } = useToastStore();
  const { addEvent } = useTimelineStore();

  const handleDownload = (c?: any) => {
    const caseToDownload = (c && c.id) ? c : selectedCase;
    if (!caseToDownload) return;
    
    try {
      if (generateCasePDF(caseToDownload)) {
        addToast('Case PDF report downloaded successfully', 'success');
      } else {
        addToast('Failed to generate PDF report', 'error');
      }
      if (selectedCase && caseToDownload.id === selectedCase.id) {
        setSelectedCase(null);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      addToast('Failed to generate PDF report', 'error');
    }
  };

  const handleReassignSubmit = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assignee = formData.get('assignee') as string;
    const reason = formData.get('reason') as string;
    const notes = formData.get('notes') as string;
    
    // Add to Timeline Engine
    addEvent({
      caseId: caseToReassign.id,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: 'Case Reassigned',
      type: 'action',
      desc: `Case transferred to ${assignee}. Reason: ${reason}. Notes: ${notes || 'None provided'}`,
      iconName: 'UserPlus',
      color: 'text-primary',
      bg: 'bg-primary/20'
    });

    updateCase(caseToReassign.id, { assignee, status: 'Re-Assigned' });
    addToast(`Case ${caseToReassign.id} formally reassigned to ${assignee}`, 'success');
    setCaseToReassign(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-100 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" /> Active Case Board
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cases.filter(c => c.assignee !== 'Unassigned' && c.assignee && user?.name && c.assignee.toLowerCase().includes(user.name.toLowerCase().replace('officer ', '').trim())).map(c => (
            <motion.div 
              key={c.id} 
              whileHover={{ y: -4 }} 
              className="glass p-5 rounded-xl border-l-4 border-l-primary flex flex-col justify-between h-40"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-400">{c.id}</span>
                </div>
                <h4 className="font-semibold text-white truncate mb-1">{c.type}</h4>
                <div onClick={(e) => e.stopPropagation()}>
                  {c.status === 'Completed' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(c); }}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded py-1.5 text-xs font-semibold flex items-center justify-center transition-colors"
                    >
                      <Download className="w-3 h-3 mr-1" /> Download PDF
                    </button>
                  ) : (
                    <select 
                      value={c.status}
                      onChange={(e) => {
                        updateCase(c.id, { status: e.target.value });
                        addToast(`Status updated for Case ${c.id}`, 'success');
                      }}
                      className="bg-transparent border border-gray-300 dark:border-white/20 rounded px-2 py-1 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-primary w-full"
                    >
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Assigned">Assigned</option>
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Investigation">Investigation</option>
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Evidence Collection">Evidence Collection</option>
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Pending Interrogation">Pending Interrogation</option>
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Charge Sheet Prep">Charge Sheet Prep</option>
                      <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex justify-end items-center mt-2 pt-2 border-t border-white/5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCase(c);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  View Details →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="glass p-6 rounded-xl flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-warning" /> Pending Actions
        </h3>
        <div className="space-y-4 flex-1">
          <AnimatePresence>
            {activeTasks.length === 0 ? (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-gray-500 text-sm italic py-4 text-center">No pending actions for this case.</motion.p>
            ) : activeTasks.map(task => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-black/30 rounded-lg border border-white/5 flex items-start cursor-pointer hover:bg-black/50 transition-colors" 
                onClick={() => {
                  setTasks(prev => prev.filter(t => t.id !== task.id));
                  addToast('Task marked as complete', 'success');
                }}
              >
                <div className={`w-2 h-2 rounded-full bg-${task.color} mt-1.5 mr-3 flex-shrink-0`}></div>
                <div>
                  <p className="text-sm text-gray-300">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.due}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button 
          onClick={() => setTasksModalOpen(true)}
          className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
        >
          View All Tasks
        </button>
      </div>

      <Modal isOpen={isTasksModalOpen} onClose={() => setTasksModalOpen(false)} title={`Tasks for ${selectedCase?.id || 'Case'}`}>
        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <div className="p-3 text-gray-500 text-center italic">No tasks available.</div>
          ) : activeTasks.map((t, idx) => (
            <div key={t.id} className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
              {idx + 1}. {t.title} ({t.due})
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="Case Details">
        {selectedCase && (
          <div className="space-y-4 text-gray-300">
            <p><strong>FIR Number:</strong> {selectedCase.id}</p>
            <p><strong>Type:</strong> {selectedCase.type}</p>
            <p><strong>Status:</strong> {selectedCase.status}</p>
            <div className="pt-4 border-t border-white/10 flex space-x-3">
              <button onClick={handleDownload} className="bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-lg text-sm transition-colors">
                Download Full Report
              </button>
              {selectedCase.status !== 'Completed' && (
                <button onClick={() => { 
                  setCaseToReassign(selectedCase);
                  setSelectedCase(null); 
                }} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors">
                  Reassign Case
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!caseToReassign} onClose={() => setCaseToReassign(null)} title="Reassign Case">
        {caseToReassign && (
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-warning font-semibold">You are reassigning Case: {caseToReassign.id}</p>
              <p className="text-xs text-warning/70 mt-1">This action will transfer ownership and remove the case from your active board.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Officer / Division <span className="text-danger">*</span></label>
              <select name="assignee" required defaultValue="" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                <option value="" disabled>Select target assignee...</option>
                {users.filter(u => u.status === 'Active' && u.role !== 'Desk Officer').map(u => (
                  <option key={u.id} value={`${u.name} (${u.division})`}>
                    {u.name} ({u.division}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Reason for Reassignment <span className="text-danger">*</span></label>
              <select name="reason" required defaultValue="" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                <option value="" disabled>Select reason...</option>
                <option>Jurisdiction Transfer</option>
                <option>Requires Specialized Skills</option>
                <option>Conflict of Interest</option>
                <option>Workload Distribution</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Handover Notes</label>
              <textarea name="notes" rows={3} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors resize-none" placeholder="Provide context for the next investigator..."></textarea>
            </div>

            <div className="pt-2 border-t border-white/10 mt-2 flex space-x-3">
              <button type="button" onClick={() => setCaseToReassign(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-lg mt-2 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg mt-2 transition-colors">
                Confirm Handover
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const SupervisorDashboard = () => {
  const { addToast } = useToastStore();
  const { addEvent } = useTimelineStore();
  const { cases, updateCase, fetchCases } = useCaseStore();
  const { users } = useUserStore();
  const { trends, fetchTrends } = useTrendStore();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [customDate, setCustomDate] = useState('');
  
  useEffect(() => {
    fetchCases();
    fetchTrends();
  }, [fetchCases, fetchTrends]);
  const [activeTab, setActiveTab] = useState<'overview' | 'dispatch' | 'active'>('overview');
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showRoster, setShowRoster] = useState(false);
  const [escalationHistory, setEscalationHistory] = useState<any[]>([]);
  
  const [escalations, setEscalations] = useState<any[]>([]);

  // Build teams dynamically from the global user store, grouped by division
  const dynamicTeams = useMemo(() => {
    const divisionMap = new Map<string, { lead: string; memberCount: number }>();
    
    const activeUsers = users.filter(u => u.status === 'Active' && u.division !== 'Headquarters');
    
    activeUsers.forEach(u => {
      const existing = divisionMap.get(u.division);
      if (!existing) {
        divisionMap.set(u.division, {
          lead: u.role === 'Supervisor' ? u.name : 'Unassigned',
          memberCount: 1
        });
      } else {
        // If this user is a supervisor, they become the lead
        if (u.role === 'Supervisor' && existing.lead === 'Unassigned') {
          divisionMap.set(u.division, { ...existing, lead: u.name, memberCount: existing.memberCount + 1 });
        } else {
          divisionMap.set(u.division, { ...existing, memberCount: existing.memberCount + 1 });
        }
      }
    });

    return Array.from(divisionMap.entries()).map(([division, info], idx) => {
      // Estimate clearance and case count based on member count
      const baseClearance = 75 + (idx % 3) * 5;
      const divisionCases = cases.filter(c => {
        const typeStr = typeof c.type === 'string' ? c.type.toLowerCase() : '';
        const divStr = typeof division === 'string' ? division.toLowerCase() : '';
        return (typeStr && divStr && typeStr.includes(divStr.split(' ')[0])) ||
               (typeStr && divStr && typeStr.includes('cyber') && divStr.includes('cyber'));
      }).length || Math.max(1, info.memberCount * 2);
      const clearance = Math.min(99, Math.max(30, baseClearance - divisionCases));
      return {
        id: idx + 1,
        name: `${division} Unit`,
        lead: info.lead,
        clearance,
        activeCases: divisionCases,
        members: info.memberCount,
      };
    });
  }, [users, cases]);

  const handleAction = (id: number, actionName: string, type: string) => {
    const escToProcess = escalations.find(e => e.id === id);
    if (escToProcess) {
      setEscalationHistory(prev => [{ ...escToProcess, resolution: actionName, resType: type }, ...prev]);
    }
    setEscalations(prev => prev.filter(esc => esc.id !== id));
    addToast(`${actionName} processed successfully`, type === 'danger' ? 'error' : type as any);

    if (actionName === 'Approve Backup') {
       addEvent({
         caseId: '104430006202600001',
         date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
         title: 'Tactical Backup Deployed',
         type: 'action',
         desc: `Supervisory override: Tactical backup dispatched to assist Unit Beta at Sector 4 raid. Action formally authorized by Command.`,
         iconName: 'Shield',
         color: 'text-danger',
         bg: 'bg-danger/20'
       });
       addToast('Tactical units dispatched and logged to Case Timeline!', 'success');
    } else if (actionName === 'Approve') {
       addEvent({
         caseId: '104430006202600001',
         date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
         title: 'Personnel Action: Leave Approved',
         type: 'info',
         desc: `Leave request for Insp. Suresh P approved. Active caseload temporarily delegated to secondary officer.`,
         iconName: 'CheckCircle',
         color: 'text-success',
         bg: 'bg-success/20'
       });
       addToast('Leave recorded in personnel file and Case Timeline updated.', 'success');
    }
  };

  const handleDownload = (c?: any) => {
    const caseToDownload = c;
    if (!caseToDownload) return;
    
    try {
      if (generateCasePDF(caseToDownload)) {
        addToast('Case PDF report downloaded successfully', 'success');
      } else {
        addToast('Failed to generate PDF report', 'error');
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      addToast('Failed to generate PDF report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Active Officers" value={users.filter(u => u.status === 'Active').length} icon={Users} color="primary" />
        <KPICard title="Pending Leave Requests" value={escalations.filter(e => e.type === 'warning').length + 17} icon={FileWarning} color="warning" />
        <KPICard title="Critical Escalations" value={escalations.filter(e => e.type === 'danger').length + 2} icon={AlertTriangle} color="danger" />
      </div>
      
      <div className="flex space-x-2 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === 'overview' ? 'border-primary text-primary bg-primary/10 shadow-[inset_0_-2px_10px_rgba(59,130,246,0.1)]' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <Activity className="w-4 h-4 inline-block mr-2" /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === 'dispatch' ? 'border-primary text-primary bg-primary/10 shadow-[inset_0_-2px_10px_rgba(59,130,246,0.1)]' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <Database className="w-4 h-4 inline-block mr-2" /> Dispatch Hub
          {cases.filter(c => c.assignee === 'Unassigned').length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-bold">
              {cases.filter(c => c.assignee === 'Unassigned').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === 'active' ? 'border-primary text-primary bg-primary/10 shadow-[inset_0_-2px_10px_rgba(59,130,246,0.1)]' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <AlertTriangle className="w-4 h-4 inline-block mr-2" /> Active Operations
          {cases.filter(c => c.assignee !== 'Unassigned').length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
              {cases.filter(c => c.assignee !== 'Unassigned').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-200">Unit Performance Tracking</h3>
            <button 
              onClick={() => setShowRoster(true)}
              className="text-primary text-sm hover:underline"
            >
              View Full Roster
            </button>
          </div>
          <div className="w-full h-[250px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicTeams} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#ccc' }} />
                <Bar dataKey="activeCases" name="Active Cases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clearance" name="Clearance %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-primary/50 text-white font-bold text-xs uppercase tracking-wider bg-black/20">
                  <th className="py-3 px-4">Unit / Division</th>
                  <th className="py-3 px-4">Lead Officer</th>
                  <th className="py-3 px-4">Active Cases</th>
                  <th className="py-3 px-4 text-right">Clearance Rate</th>
                </tr>
              </thead>
              <tbody>
                {dynamicTeams.map((team) => (
                  <tr 
                    key={team.id} 
                    className="hover:bg-white/10 transition-colors cursor-pointer" 
                    onClick={() => setSelectedTeam(team)}
                  >
                    <td className="py-4 px-4 font-semibold text-gray-200">{team.name}</td>
                    <td className="py-4 px-4 text-gray-300">{team.lead}</td>
                    <td className="py-4 px-4 text-gray-300">{team.activeCases} cases</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <div className="w-24 h-2 bg-black/40 rounded-full mr-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${team.clearance >= 80 ? 'bg-success' : team.clearance >= 60 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${team.clearance}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-200 w-10 text-right">{team.clearance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Command Escalations
          </h3>
          <div className="flex-1 space-y-4">
            {escalations.length > 0 ? escalations.map(esc => (
              <div key={esc.id} className={`p-4 bg-${esc.type}/10 border border-${esc.type}/20 rounded-lg`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-${esc.type} font-bold text-sm`}>{esc.title}</span>
                  <span className="text-xs text-gray-500">{esc.time}</span>
                </div>
                <p className="text-sm text-gray-300">{esc.message}</p>
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={() => handleAction(esc.id, esc.btn1, 'success')}
                    className={`bg-${esc.type} hover:bg-${esc.type}/80 ${esc.type === 'warning' ? 'text-black' : 'text-white'} px-3 py-1.5 rounded text-xs font-semibold`}
                  >
                    {esc.btn1}
                  </button>
                  <button 
                    onClick={() => handleAction(esc.id, esc.btn2, 'info')}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs"
                  >
                    {esc.btn2}
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-10">No pending escalations</div>
            )}
          </div>
          
          {escalationHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Action History</h4>
              <div className="space-y-3">
                {escalationHistory.map((hist, i) => (
                  <div key={`${hist.id}-${i}`} className="p-3 bg-black/20 rounded-lg flex justify-between items-center border border-white/5">
                    <div>
                      <p className="text-sm text-gray-300 font-medium">{hist.title}</p>
                      <p className="text-xs text-gray-500 truncate w-48" title={hist.message}>{hist.message}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold bg-${hist.resType}/20 text-${hist.resType}`}>
                      {hist.resolution}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ongoing Trends Section */}
        <div className="xl:col-span-3 glass p-6 rounded-xl flex flex-col mt-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-200">Ongoing Crime Trends</h3>
            <div className="flex items-center space-x-4">
              <div className="flex bg-black/40 p-1 rounded-lg px-3">
                <input 
                  type="date" 
                  className="bg-transparent text-gray-300 text-sm border-none outline-none focus:ring-0" 
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    fetchTrends(e.target.value);
                  }}
                  title="Select Base Date"
                />
              </div>
              <div className="flex bg-black/40 p-1 rounded-lg">
                <button onClick={() => setTimeframe('daily')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${timeframe === 'daily' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Daily</button>
                <button onClick={() => setTimeframe('weekly')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${timeframe === 'weekly' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Weekly</button>
                <button onClick={() => setTimeframe('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${timeframe === 'monthly' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
              </div>
            </div>
          </div>
          <div className="w-full h-[300px]">
            {trends && trends[timeframe] ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends[timeframe]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCleared" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#ccc' }} />
                  <Area type="monotone" dataKey="activeCases" name="Active Cases" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="clearedCases" name="Cleared Cases" stroke="#10b981" fillOpacity={1} fill="url(#colorCleared)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">Loading trends...</div>
            )}
          </div>
        </div>

      </div>
      )}

      {activeTab === 'dispatch' && (
        <div className="glass p-6 rounded-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-200">Dispatch & Triage Hub</h3>
              <p className="text-sm text-gray-400 mt-1">Bulk assign incoming cases to active officers and divisions.</p>
            </div>
            
            <div className="flex space-x-3 items-center">
              <div className="relative">
                <input 
                  list="officers-list"
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  placeholder="Search officer..."
                  className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none w-64"
                />
                <datalist id="officers-list">
                  {users.filter(u => u.status === 'Active' && !['Super Admin', 'Supervisor', 'Desk Officer'].includes(u.role)).map(u => (
                    <option key={u.id} value={`${u.name} (${u.division})`}>
                      {u.name} - {u.division}
                    </option>
                  ))}
                </datalist>
              </div>
              <button 
                onClick={() => {
                  if (!bulkAssignee) return addToast('Please select an assignee first', 'warning');
                  if (selectedCases.length === 0) return addToast('Please select at least one case', 'warning');
                  
                  selectedCases.forEach(id => {
                    updateCase(id, { assignee: bulkAssignee, status: 'Assigned' });
                  });
                  addToast(`${selectedCases.length} case(s) successfully assigned to ${bulkAssignee}`, 'success');
                  setSelectedCases([]);
                  setBulkAssignee('');
                }}
                disabled={selectedCases.length === 0 || !bulkAssignee}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Bulk Assign ({selectedCases.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/5">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-black/60 border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-400 text-primary focus:ring-primary"
                      checked={selectedCases.length === cases.length && cases.length > 0}
                      onChange={(e) => setSelectedCases(e.target.checked ? cases.map(c => c.id) : [])}
                    />
                  </th>
                  <th className="px-5 py-4">Case ID</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter(c => c.assignee === 'Unassigned').map((c) => (
                  <tr key={c.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-400 text-primary focus:ring-primary"
                        checked={selectedCases.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCases([...selectedCases, c.id]);
                          else setSelectedCases(selectedCases.filter(id => id !== c.id));
                        }}
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-800 dark:text-gray-200">{c.id}</td>
                    <td className="px-5 py-4">{c.type}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        c.status === 'Investigation' ? 'bg-primary/20 text-primary' : 
                        c.status === 'Assigned' ? 'bg-success/20 text-success' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs ${c.assignee === 'Unassigned' ? 'text-warning font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                        {c.assignee || 'Unassigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="glass p-6 rounded-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">Active Operations</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage cases currently assigned to personnel.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/5">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-black/60 border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-4">Case ID</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Assignee</th>
                  <th className="px-5 py-4">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter(c => c.assignee !== 'Unassigned').map((c) => (
                  <tr key={c.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-800 dark:text-gray-200">{c.id}</td>
                    <td className="px-5 py-4">{c.type}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-primary">
                        {c.assignee}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {c.status === 'Completed' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(c); }}
                          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded px-3 py-1.5 text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" /> Download PDF
                        </button>
                      ) : (
                        <select 
                          value={c.status}
                          onChange={(e) => {
                            updateCase(c.id, { status: e.target.value });
                            addToast(`Status updated for Case ${c.id}`, 'success');
                          }}
                          className="bg-transparent border border-gray-300 dark:border-white/20 rounded px-2 py-1 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                        >
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Assigned">Assigned</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Re-Assigned">Re-Assigned</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Investigation">Investigation</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Evidence Collection">Evidence Collection</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Pending Interrogation">Pending Interrogation</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Charge Sheet Prep">Charge Sheet Prep</option>
                          <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value="Completed">Completed</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTeam && (
        <Modal isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} title={`${selectedTeam.name} Overview`}>
          <div className="space-y-4 mt-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-400">Lead Officer</h4>
              <p className="text-lg font-bold text-white">{selectedTeam.lead}</p>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Active Caseload</h4>
                <p className="text-2xl font-bold text-primary">{selectedTeam.activeCases}</p>
              </div>
              <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Clearance Rate</h4>
                <p className="text-2xl font-bold text-success">{selectedTeam.clearance}%</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Recent Unit Activity</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-success shrink-0" /> 
                  <span>Active case reports updated successfully by {selectedTeam.lead.split(' ')[1]}.</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 text-warning shrink-0" /> 
                  <span>Forensic evidence queued for processing in Central Lab.</span>
                </li>
              </ul>
            </div>
            <button onClick={() => setSelectedTeam(null)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg mt-6 transition-colors">
              Close Overview
            </button>
          </div>
        </Modal>
      )}

      {showRoster && (
        <Modal isOpen={showRoster} onClose={() => setShowRoster(false)} title="Full Unit Roster">
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 mb-2 px-2">
              <div>OFFICER NAME</div>
              <div>RANK</div>
              <div>STATUS</div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {users
                .map(emp => (
                <div key={emp.id} className="grid grid-cols-3 text-sm p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-lg items-center border border-white/5">
                  <div className="font-semibold text-gray-200">{emp.name}</div>
                  <div className="text-gray-400">{emp.role}</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${emp.status === 'Active' ? 'bg-success' : 'bg-warning'}`}></div>
                    <span className={`text-xs ${emp.status === 'Active' ? 'text-success' : 'text-warning'}`}>{emp.status}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-gray-500 text-sm italic text-center py-4">No personnel found.</div>
              )}
            </div>
            <button onClick={() => setShowRoster(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg mt-4 transition-colors">
              Close Roster
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { addToast } = useToastStore();
  const { users } = useUserStore();
  const { cases } = useCaseStore();
  const { events } = useTimelineStore();
  const { trends, fetchTrends } = useTrendStore();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Derived real-time metrics
  const totalUsers = users.length;
  const activeSessionsCount = users.filter(u => u.status === 'Active').length;
  const systemAlertsCount = events.filter(e => e.type === 'alert' || e.type === 'warning').length;

  // Chart data generation based on real stores
  const roleDistribution = useMemo(() => {
    const counts = users.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const caseStatusData = useMemo(() => {
    const counts = cases.reduce((acc: any, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [cases]);
  
  const recentEventsData = useMemo(() => {
    const timeline: any = {};
    events.slice().reverse().forEach((e: any) => {
      const d = e.date || 'Unknown';
      timeline[d] = (timeline[d] || 0) + 1;
    });
    return Object.entries(timeline).slice(-7).map(([date, count]) => ({ date, count }));
  }, [events]);

  const handleSystemAction = (action: string) => {
    if (action === 'Cache Clearance') {
      setIsClearingCache(true);
      addToast('System cache clearing initiated...', 'info');
      setTimeout(() => {
        setIsClearingCache(false);
        addToast('System cache cleared. Resources freed.', 'success');
      }, 1500);
    } else if (action === 'Database Backup') {
      addToast('Database backup compiling...', 'info');
      setTimeout(() => {
        addToast('Database backup downloaded successfully.', 'success');
      }, 1000);
    } else if (action === 'Maintenance Mode') {
      setIsMaintenanceMode(prev => {
        const newVal = !prev;
        addToast(newVal ? 'System entered Maintenance Mode' : 'System resumed normal operations', newVal ? 'warning' : 'success');
        return newVal;
      });
    }
  };

  const handleExportLogs = () => {
    const csvRows = ['Timestamp,Event Type,Description,Status'];
    events.slice().reverse().forEach(log => csvRows.push(`"${log.date} ${log.time}","${log.title}","${log.desc}",${log.type === 'alert' ? 'Flagged' : 'Success'}`));
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Security_Audit_Logs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Security Audit Logs exported successfully', 'success');
  };

  return (
  <div className="space-y-6">
    <AnimatePresence>
      {isMaintenanceMode && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-danger/20 border border-danger text-danger p-4 rounded-xl flex items-center justify-center font-bold shadow-[0_0_15px_rgba(2ef,68,68,0.2)]"
        >
          <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" />
          SYSTEM IS CURRENTLY IN MAINTENANCE MODE. ALL NON-ADMIN ACCESS BLOCKED.
        </motion.div>
      )}
    </AnimatePresence>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard title="Total System Users" value={totalUsers} icon={Users} color="primary" />
      <KPICard title="Active Sessions" value={activeSessionsCount} icon={Activity} color="success" />
      <KPICard title="System Alerts" value={systemAlertsCount} icon={AlertTriangle} color="danger" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Case Status */}
      <div className="glass p-6 rounded-xl flex flex-col justify-between">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Live Case Distribution</h3>
        <div className="flex-1 min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={caseStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" fontSize={11} tickFormatter={(val) => val.split(' ')[0]} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} itemStyle={{ color: '#fff' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {caseStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: User Roles */}
      <div className="glass p-6 rounded-xl flex flex-col justify-between">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">User Roles Distribution</h3>
        <div className="flex-1 min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} itemStyle={{ color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#ccc' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Chart 3: Ongoing Crime Trends (Replacing Event Volume Trends) */}
      <div className="glass p-6 rounded-xl flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Ongoing Crime Trends</h3>
          <div className="flex items-center space-x-3">
            <div className="flex bg-black/40 p-1 rounded-lg px-2">
              <input 
                type="date" 
                className="bg-transparent text-gray-300 text-xs border-none outline-none focus:ring-0" 
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  fetchTrends(e.target.value);
                }}
                title="Select Base Date"
              />
            </div>
            <div className="flex bg-black/40 p-1 rounded-lg">
              <button onClick={() => setTimeframe('daily')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${timeframe === 'daily' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}>D</button>
              <button onClick={() => setTimeframe('weekly')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${timeframe === 'weekly' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}>W</button>
              <button onClick={() => setTimeframe('monthly')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${timeframe === 'monthly' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}>M</button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-[250px]">
          {trends && trends[timeframe] ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends[timeframe]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActiveSA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClearedSA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#ccc' }} />
                <Area type="monotone" dataKey="activeCases" name="Active Cases" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActiveSA)" />
                <Area type="monotone" dataKey="clearedCases" name="Cleared Cases" stroke="#10b981" fillOpacity={1} fill="url(#colorClearedSA)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading trends...</div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex space-x-3">
             <button 
                onClick={() => handleSystemAction('Cache Clearance')} 
                disabled={isClearingCache}
                className={`flex-1 ${isClearingCache ? 'bg-white/20 text-gray-400 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-white'} py-2 rounded-lg text-sm transition-colors border border-white/10`}
             >
                {isClearingCache ? 'Clearing...' : 'Clear Cache'}
             </button>
             <button onClick={() => handleSystemAction('Database Backup')} className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg text-sm transition-colors border border-primary/30">Force Backup</button>
             <button onClick={() => handleSystemAction('Maintenance Mode')} className={`flex-1 ${isMaintenanceMode ? 'bg-danger hover:bg-danger/80 text-white border-danger' : 'bg-danger/20 hover:bg-danger/30 text-danger border-danger/30'} py-2 rounded-lg text-sm transition-colors border`}>
                {isMaintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode'}
             </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass p-6 rounded-xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Recent Security Audits</h3>
          <button onClick={handleExportLogs} className="bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/25 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center">
            <Download className="w-4 h-4 mr-1.5" />
            Export Logs
          </button>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Event Type</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.filter(e => e && e.title && e.desc).slice().reverse().slice(0, 5).map((log, idx) => (
                <tr key={`${log.date}-${log.time}-${idx}`} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-gray-300 whitespace-nowrap">{log.date} {log.time}</td>
                  <td className="py-3 text-gray-200">{log.title}</td>
                  <td className="py-3 text-gray-400 text-xs truncate max-w-[150px]" title={log.desc}>{log.desc}</td>
                  <td className="py-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                      log.type === 'action' ? 'text-success bg-success/10' :
                      log.type === 'warning' ? 'text-warning bg-warning/10' :
                      log.type === 'alert' ? 'text-danger bg-danger/10' :
                      'text-primary bg-primary/10'
                    }`}>
                      {log.type === 'alert' ? 'Flagged' : log.type === 'warning' ? 'Warning' : 'Success'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};

const Dashboard = () => {
  const role = useAuthStore((state) => state.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-100">
          Command Dashboard <span className="text-sm font-normal text-primary ml-2 bg-primary/10 px-2 py-1 rounded">Role: {role}</span>
        </h2>
      </div>
      
      {role === 'Desk Officer' && <DeskOfficerDashboard />}
      {['Investigator', 'Cyber Specialist', 'Forensic Analyst', 'Intelligence Officer', 'Evidence Custodian', 'Patrol Officer'].includes(role || '') && <InvestigatorDashboard />}
      {role === 'Supervisor' && <SupervisorDashboard />}
      {(role === 'Super Admin' || !role) && <SuperAdminDashboard />}

      
    </div>
  );
};

export default Dashboard;
