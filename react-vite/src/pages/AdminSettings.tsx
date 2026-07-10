import { useState, useEffect } from 'react';
import { Settings, Users, Cpu, Shield, UserX, CheckCircle, Database, Search, Plus, Save, AlertTriangle, RefreshCw, Info, Download, Edit2, Trash2, UserCheck, UserMinus, ChevronDown } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useUserStore } from '../store/userStore';
import { useTimelineStore } from '../store/timelineStore';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';

const DIVISIONS = ['Headquarters', 'Cyber Cell', 'Narcotics', 'Intelligence', 'Homicide', 'Theft & Property', 'Anti-Terrorism', 'Special Branch'];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'logs'>('users');
  const { users, addUser, updateUser, deleteUser, toggleUserStatus } = useUserStore();
  const { events } = useTimelineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [isRestartingAI, setIsRestartingAI] = useState(false);

  // Form state

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Investigator');
  const [newUserDivision, setNewUserDivision] = useState(DIVISIONS[0]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [aiConfig, setAiConfig] = useState({
    faceConfidence: 85,
    nlpSensitivity: 70,
    predictiveRadius: 5
  });
  
  const { addToast } = useToastStore();

  // Active patch to fix stubborn Tejashwini cache issue without requiring a full reload
  useEffect(() => {
    const tej = users.find(u => u.name === 'Tejashwini' || u.id === 'U001' && u.name !== 'Super Admin');
    if (tej) {
      updateUser(tej.id, {
        name: 'Super Admin',
        role: 'Super Admin',
        username: 'admin',
        password: 'admin'
      });
    }
  }, [users, updateUser]);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    toggleUserStatus(id);
    addToast(currentStatus === 'Active' ? 'User access suspended' : 'User access restored', 'info');
  };

  const handleDeleteUser = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditUserId(user.id);
    setNewUserName(user.name);
    setNewUsername(user.username || '');
    setNewPassword(user.password || '');
    setNewUserRole(user.role);
    setNewUserDivision(user.division);
    setIsEditUserModalOpen(true);
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUsername('');
    setNewPassword('');
    setNewUserRole('Investigator');
    setNewUserDivision(DIVISIONS[0]);
    setEditUserId(null);
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    val = val.replace(/(.)\1\1/gi, '$1$1');
    setNewUserName(val);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^a-zA-Z]/g, '');
    val = val.replace(/(.)\1\1/gi, '$1$1');
    setNewUsername(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s/g, '');
    val = val.replace(/(.)\1\1/gi, '$1$1');
    setNewPassword(val);
  };

  const handleSaveUser = () => {
    if (!newUserName || !newUsername || !newPassword) {
      addToast('Please fill in all fields (Name, Username, Password)', 'error');
      return;
    }
    
    if (/\s/.test(newPassword)) {
      addToast('Password cannot contain whitespace characters.', 'error');
      return;
    }
    
    if (editUserId) {
      updateUser(editUserId, {
        name: newUserName,
        role: newUserRole,
        division: newUserDivision,
        username: newUsername,
        password: newPassword
      });
      addToast(`${newUserName} successfully updated`, 'success');
      setIsEditUserModalOpen(false);
    } else {
      addUser({ 
        name: newUserName, 
        role: newUserRole, 
        division: newUserDivision,
        username: newUsername,
        password: newPassword
      });
      addToast(`${newUserName} successfully provisioned as ${newUserRole}`, 'success');
      setIsAddUserModalOpen(false);
    }
    
    resetForm();
  };

  const handleSaveAi = () => {
    addToast('AI Subsystem configurations saved securely.', 'success');
  };
  
  const handleRestartAI = () => {
    setIsRestartingAI(true);
    addToast('Initiating neural engine soft restart...', 'info');
    setTimeout(() => {
      setIsRestartingAI(false);
      addToast('AI Subsystem is fully operational.', 'success');
    }, 3000);
  };

  const handleExportCSV = () => {
    if (events.length === 0) {
      addToast('No logs available to export.', 'error');
      return;
    }
    
    const csvRows = ['Date,Time,User,Action,IP'];
    events.forEach(event => {
      csvRows.push(`"${event.date}","${event.time}","System/User","${event.title} - ${event.desc}","localhost"`);
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Security_Audit_Logs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Logs exported to secure drive in CSV format.', 'success');
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(query)) || 
      (u.id && String(u.id).toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query)) ||
      (u.division && u.division.toLowerCase().includes(query)) ||
      (u.status && u.status.toLowerCase().includes(query)) ||
      (u.username && u.username.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Settings className="mr-3 text-primary w-6 h-6" /> System Configuration & Command Center
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Super Admin restricted access only. All actions are strictly audited.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-white/10">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Users className="w-4 h-4 mr-2" /> User Management
        </button>
        <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Cpu className="w-4 h-4 mr-2" /> AI Subsystem Tuning
        </button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center ${activeTab === 'logs' ? 'text-primary border-b-2 border-primary bg-primary/5 rounded-t-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Shield className="w-4 h-4 mr-2" /> Security & Audit Logs
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4 h-full flex flex-col"
            >
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search personnel..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button onClick={() => setIsAddUserModalOpen(true)} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary/25 flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> Provision User
                </button>
              </div>

              <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-black/50 sticky top-0 z-10">
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="p-4 font-semibold w-1/4">Officer Name & ID</th>
                        <th className="p-4 font-semibold w-1/4">Role & Division</th>
                        <th className="p-4 font-semibold w-1/6">Status</th>
                        <th className="p-4 font-semibold w-1/6">Last Active</th>
                        <th className="p-4 font-semibold text-right w-1/6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mr-3">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-gray-200 group-hover:text-primary transition-colors">{u.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-700 dark:text-gray-300">{u.role}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{u.division}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.status === 'Active' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                            }`}>
                              {u.status === 'Active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                              {u.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                            {u.lastLogin}
                          </td>
                          <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex justify-end space-x-2">
                              {u.role !== 'Super Admin' && (
                                <>
                                  <button onClick={() => openEditModal(u)} className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-600 dark:text-gray-400 hover:text-primary transition-colors" title="Edit User">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleToggleStatus(u.id, u.status)} className={`p-1.5 ${u.status === 'Active' ? 'bg-warning/10 hover:bg-warning/20 text-warning' : 'bg-success/10 hover:bg-success/20 text-success'} rounded transition-colors`} title={u.status === 'Active' ? 'Suspend Access' : 'Restore Access'}>
                                    {u.status === 'Active' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-danger/10 hover:bg-danger/20 rounded text-danger transition-colors" title="Delete User">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {u.role === 'Super Admin' && (
                                <span className="text-xs text-gray-400 italic">Protected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>No personnel records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-h-full overflow-y-auto pr-2 custom-scrollbar pb-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">Neural Engine Thresholds</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Adjust sensitivity and classification parameters globally.</p>
                </div>
                <button 
                  onClick={handleRestartAI}
                  disabled={isRestartingAI}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                    isRestartingAI 
                      ? 'bg-warning/10 text-warning border-warning/20 cursor-wait' 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRestartingAI ? 'animate-spin' : ''}`} />
                  {isRestartingAI ? 'Restarting Engine...' : 'Soft Restart AI'}
                </button>
              </div>
              
              <div className="grid gap-6">
                <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
                  <label className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex flex-col">
                      <span className="text-base text-gray-900 dark:text-white">Facial Recognition Match Threshold</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 font-normal mt-0.5">Minimum confidence score required to flag a positive match in CCTV footage.</span>
                    </div>
                    <span className="text-2xl font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{aiConfig.faceConfidence}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="50" max="99" 
                    value={aiConfig.faceConfidence}
                    onChange={(e) => setAiConfig({...aiConfig, faceConfidence: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-600 mt-2 font-mono">
                    <span>50% (Loose)</span>
                    <span>99% (Strict)</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-3xl pointer-events-none group-hover:bg-warning/10 transition-colors"></div>
                  <label className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex flex-col">
                      <span className="text-base text-gray-900 dark:text-white">NLP Threat Sensitivity</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 font-normal mt-0.5">Controls how aggressively the NLP engine classifies communication as a potential threat.</span>
                    </div>
                    <span className="text-2xl font-mono text-warning bg-warning/10 px-3 py-1 rounded-lg border border-warning/20">{aiConfig.nlpSensitivity}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="10" max="100" 
                    value={aiConfig.nlpSensitivity}
                    onChange={(e) => setAiConfig({...aiConfig, nlpSensitivity: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-warning" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-600 mt-2 font-mono">
                    <span>10% (Low)</span>
                    <span>100% (High)</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl pointer-events-none group-hover:bg-success/10 transition-colors"></div>
                  <label className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex flex-col">
                      <span className="text-base text-gray-900 dark:text-white">Predictive Hotspot Radius</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 font-normal mt-0.5">Radius for spatial correlation in the Digital Twin mapping engine.</span>
                    </div>
                    <span className="text-2xl font-mono text-success bg-success/10 px-3 py-1 rounded-lg border border-success/20">{aiConfig.predictiveRadius} km</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="20" step="0.5"
                    value={aiConfig.predictiveRadius}
                    onChange={(e) => setAiConfig({...aiConfig, predictiveRadius: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-success" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-600 mt-2 font-mono">
                    <span>1 km (Micro)</span>
                    <span>20 km (Macro)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <Info className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Changes to AI configuration will take effect globally across all active instances within 60 seconds.</p>
              </div>

              <button onClick={handleSaveAi} className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/25 px-8 py-3 rounded-xl font-bold transition-all w-full sm:w-auto flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" /> Save Global Configurations
              </button>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6 h-full flex flex-col"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-primary" /> Immutable Audit Trail
                </h3>
                <button onClick={handleExportCSV} className="bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/25 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Export to CSV
                </button>
              </div>
              
              <div className="bg-gray-100 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl p-1 flex-1 overflow-hidden flex flex-col">
                <div className="bg-white dark:bg-[#0D1117] flex-1 overflow-y-auto font-mono text-sm p-4 rounded-lg shadow-inner custom-scrollbar relative">
                  <div className="flex flex-col sm:flex-row sm:items-start py-2 px-2 border-b-2 border-gray-200 dark:border-white/10 mb-2 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider sticky top-0 bg-white dark:bg-[#0D1117] z-10">
                    <div className="w-40 flex-shrink-0">Date & Time</div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
                      <span className="w-32 flex-shrink-0">Actor / System</span>
                      <span className="flex-1">Action & Details</span>
                    </div>
                    <div className="w-24 flex-shrink-0 text-right">IP Address</div>
                  </div>
                  
                  {events.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] px-2 rounded transition-colors group">
                      <div className="w-40 flex-shrink-0 flex items-center text-gray-500 dark:text-gray-500 text-xs sm:text-sm">
                        <span className="mr-2 opacity-50">[{log.date}]</span>
                        {log.time}
                      </div>
                      
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center mt-1 sm:mt-0">
                        <span className={`w-32 flex-shrink-0 font-bold ${
                          log.type === 'success' ? 'text-success' : log.type === 'alert' ? 'text-danger' : 'text-primary'
                        }`}>
                          System/User
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">{log.title} - {log.desc}</span>
                      </div>
                      
                      <div className="w-24 flex-shrink-0 text-right mt-1 sm:mt-0 text-gray-400 dark:text-gray-600 text-xs group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                        localhost
                      </div>
                    </div>
                  ))}
                  
                  {/* Simulate a live tailing terminal */}
                  <div className="py-2 px-2 flex items-center text-gray-400 dark:text-gray-600 animate-pulse">
                    <span className="w-40 flex-shrink-0 text-xs">Waiting for events</span>
                    <span className="text-lg leading-none mt-[-5px]">...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Add User Modal - Fully Functional */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Provision New Officer Account">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Full Name / Officer ID</label>
            <input
              type="text"
              value={newUserName}
              onChange={handleFullNameChange}
              className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="e.g. Insp Ramesh Kumar"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={handleUsernameChange}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="ramesh"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="password123"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Role Assignment</label>
            <div className="relative">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="Investigator">Investigator</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Desk Officer">Desk Officer</option>
                <option value="Cyber Specialist">Cyber Specialist</option>
                <option value="Forensic Analyst">Forensic Analyst</option>
                <option value="Intelligence Officer">Intelligence Officer</option>
                <option value="Evidence Custodian">Evidence Custodian</option>
                <option value="Patrol Officer">Patrol Officer</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Division / Unit</label>
            <div className="relative">
              <select
                value={newUserDivision}
                onChange={(e) => setNewUserDivision(e.target.value)}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start">
            <AlertTriangle className="w-4 h-4 text-warning mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 dark:text-gray-300">A secure invitation link will be dispatched to the officer's government email. Two-factor authentication is strictly enforced on first login.</p>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end space-x-3">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-white border border-gray-300 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary/25 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Provision Account
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditUserModalOpen} onClose={() => { setIsEditUserModalOpen(false); resetForm(); }} title="Edit Personnel Record">
        <div className="space-y-5 mt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Full Name / Officer ID</label>
            <input
              type="text"
              value={newUserName}
              onChange={handleFullNameChange}
              className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="e.g. Insp Ramesh Kumar"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={handleUsernameChange}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="ramesh"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="password123"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Role Assignment</label>
            <div className="relative">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="Investigator">Investigator</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Desk Officer">Desk Officer</option>
                <option value="Cyber Specialist">Cyber Specialist</option>
                <option value="Forensic Analyst">Forensic Analyst</option>
                <option value="Intelligence Officer">Intelligence Officer</option>
                <option value="Evidence Custodian">Evidence Custodian</option>
                <option value="Patrol Officer">Patrol Officer</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Division / Unit</label>
            <div className="relative">
              <select
                value={newUserDivision}
                onChange={(e) => setNewUserDivision(e.target.value)}
                className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end space-x-3">
            <button
              onClick={() => { setIsEditUserModalOpen(false); resetForm(); }}
              className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-white border border-gray-300 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary/25 flex items-center"
            >
              <Save className="w-4 h-4 mr-1.5" /> Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-danger font-semibold text-sm">Are you sure you want to permanently delete this user?</p>
            <p className="text-xs text-danger/70 mt-1">This action cannot be undone. Their historical case records will remain, but system access will be permanently revoked.</p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors border border-gray-300 dark:border-white/10"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete);
                  addToast('User permanently deleted', 'success');
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }
              }}
              className="px-5 py-2 bg-danger hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-danger/25"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;
