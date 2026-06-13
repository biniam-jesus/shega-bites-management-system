/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';
import { useLanguage } from '../lib/translations';
import { Lock, Shuffle, Compass, ShieldCheck, ChefHat, UtensilsCrossed, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabaseSync } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const [selectedBranch, setSelectedBranch] = useState<'Shegawan' | 'Teyim Shega'>('Shegawan');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Waiter');
  const [pin, setPin] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Loaded employees from Supabase
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('default');
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);

  // Fetch employees from Supabase if activated
  useEffect(() => {
    async function fetchEmployees() {
      if (isSupabaseConfigured()) {
        try {
          setEmployeesLoading(true);
          let list = await supabaseSync.getEmployees();
          // Self-healing: if connected to a fresh Supabase and 'shega_employees' is empty, seed it!
          if (!list || list.length === 0) {
            const defaults = [
              { id: 'emp-1', username: 'Shegawan Admin', pin: '1234', role: 'Admin', branch: 'Shegawan' },
              { id: 'emp-2', username: 'Chef Aster', pin: '2222', role: 'Chef', branch: 'Shegawan' },
              { id: 'emp-3', username: 'Waiter Biniam', pin: '3333', role: 'Waiter', branch: 'Shegawan' },
              { id: 'emp-4', username: 'Teyim Admin', pin: '1234', role: 'Admin', branch: 'Teyim Shega' },
              { id: 'emp-5', username: 'Waiter Almaz', pin: '3333', role: 'Waiter', branch: 'Teyim Shega' }
            ];
            await supabaseSync.saveAllEmployees(defaults);
            list = defaults;
          }
          setEmployees(list);
        } catch (err) {
          console.error('Failed to load employee records from Supabase:', err);
        } finally {
          setEmployeesLoading(false);
        }
      }
    }
    fetchEmployees();
  }, [selectedBranch, selectedRole]); // Reload employees as needed or triggers

  // Update selected employee dropdown when branch or role changes
  useEffect(() => {
    setSelectedEmpId('default');
    setUsername('');
  }, [selectedBranch, selectedRole]);

  // Filter employees matching current selected branch and access role
  const filteredEmployees = employees.filter(
    emp => emp.branch === selectedBranch && emp.role === selectedRole
  );

  // Built-in standard restaurant authentication pin lookup
  const pinForRole = {
    Admin: '1234',
    Chef: '2222',
    Waiter: '3333'
  };

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();

    let finalName = '';
    
    // 1. Supabase Role Based Login Control (Active)
    if (isSupabaseConfigured() && employees.length > 0) {
      // If a specific employee is chosen
      if (selectedEmpId !== 'default' && selectedEmpId !== 'custom') {
        const emp = employees.find(e => e.id === selectedEmpId);
        if (emp) {
          if (emp.pin === pin) {
            finalName = emp.username;
          } else {
            setErrorMsg(t('incorrect_pin'));
            setPin('');
            return;
          }
        }
      } 
      // If "custom" typing, or matching user lookups
      else {
        const typedName = username.trim();
        if (!typedName) {
          setErrorMsg('Please select an employee profile or enter an operator name');
          return;
        }

        const foundEmp = employees.find(
          emp => emp.username.toLowerCase() === typedName.toLowerCase() && 
                 emp.role === selectedRole && 
                 emp.branch === selectedBranch
        );

        if (foundEmp) {
          if (foundEmp.pin === pin) {
            finalName = foundEmp.username;
          } else {
            setErrorMsg(t('incorrect_pin'));
            setPin('');
            return;
          }
        } else {
          // Allow registration of typed custom operator if standard PIN matches
          const expectedPin = pinForRole[selectedRole];
          if (pin === expectedPin) {
            const newEmp = {
              id: `emp-${Date.now()}`,
              username: typedName,
              pin: pin,
              role: selectedRole,
              branch: selectedBranch
            };
            supabaseSync.saveEmployee(newEmp);
            setEmployees(prev => [...prev, newEmp]);
            finalName = typedName;
          } else {
            setErrorMsg(t('incorrect_pin'));
            setPin('');
            return;
          }
        }
      }
    } 
    // 2. Offline Fallback Control
    else {
      const expectedPin = pinForRole[selectedRole];
      if (pin !== expectedPin) {
        setErrorMsg(t('incorrect_pin'));
        setPin('');
        return;
      }
      finalName = username.trim() || `${t(selectedRole.toLowerCase())} (${selectedBranch === 'Shegawan' ? t('shegawan_cafe') : t('teyim_shega')})`;
    }

    onLogin({
      username: finalName,
      role: selectedRole,
      branch: selectedBranch
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-gray-100 selection:bg-amber-500 selection:text-white relative" id="login_container">
      
      {/* Floating Language Switcher at the very top right of the viewport */}
      <div className="absolute top-4 right-4 flex bg-gray-800 p-0.5 rounded-lg border border-gray-700 shadow-xl z-50">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wider transition-all cursor-pointer ${
            language === 'en' 
              ? 'bg-amber-500 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('am')}
          className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
            language === 'am' 
              ? 'bg-amber-500 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          አማ
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative" id="login_card">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <div className="p-8 pb-5 text-center flex flex-col items-center border-b border-gray-800/60 relative z-10">
          <div className="p-3 bg-white/5 border border-white/10 text-amber-400 rounded-2xl mb-4 shadow-inner">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <h1 className="text-xl font-black tracking-tight text-white uppercase">{t('brand_name')}</h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> {t('pos_hub')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs font-medium">
            {t('system_desc')}
          </p>
        </div>

        {/* Phase 1 Branch Selection Tab Panel */}
        <div className="p-6 pb-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-1">
              {t('select_operating_branch')}
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-gray-900/60 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedBranch('Shegawan')}
                className={`py-3 px-2 rounded-lg text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedBranch === 'Shegawan'
                    ? 'bg-amber-500 text-black shadow-lg font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>{t('shegawan_cafe')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBranch('Teyim Shega')}
                className={`py-3 px-2 rounded-lg text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedBranch === 'Teyim Shega'
                    ? 'bg-amber-500 text-black shadow-lg font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                <span>{t('teyim_shega')}</span>
              </button>
            </div>
          </div>

          {/* Role Choice Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-1">
              {t('terminal_access_role')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { r: 'Waiter', key: 'waiter', icon: Compass },
                { r: 'Chef', key: 'chef', icon: ChefHat },
                { r: 'Admin', key: 'admin', icon: ShieldCheck }
              ].map(({ r, key, icon: IconComponent }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r as UserRole);
                    setErrorMsg('');
                  }}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedRole === r
                      ? 'border-white bg-white/10 text-white shadow-xl'
                      : 'border-transparent bg-gray-900/40 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{t(key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Supabase Employee Dropdown Selection (Dynamic Role-based Access) */}
          {isSupabaseConfigured() && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-1">
                {employeesLoading ? 'Loading Employee Profiles...' : (t('active_employee_profile') || 'Active Employee Profile')}
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedEmpId(val);
                  if (val !== 'default' && val !== 'custom') {
                    const found = employees.find(emp => emp.id === val);
                    if (found) {
                      setUsername(found.username);
                    }
                  } else {
                    setUsername('');
                  }
                  setErrorMsg('');
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="default" className="text-gray-400">-- Select {selectedRole} Account --</option>
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} className="text-white">
                    👤 {emp.username} (PIN: {emp.pin})
                  </option>
                ))}
                <option value="custom" className="text-amber-400 font-extrabold">⚙️ Register New Operator...</option>
              </select>
            </div>
          )}

          {/* Quick Optional Name Input - visible only if offline OR if 'custom' is selected from the Supabase select */}
          {(!isSupabaseConfigured() || selectedEmpId === 'custom' || filteredEmployees.length === 0) && (
            <div className="space-y-1 block animate-fade-in">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-1 mb-1">
                {isSupabaseConfigured() ? 'Enter Register Operator Name' : t('operator_name_optional')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isSupabaseConfigured() ? 'e.g. Employee Name' : t('operator_name_label')}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-center font-semibold text-white focus:outline-none focus:border-amber-500 placeholder-gray-500"
              />
            </div>
          )}
        </div>

        {/* Lock / PIN Pad Dashboard */}
        <div className="p-6 pt-0 border-t border-gray-800/40 bg-gray-900/25 space-y-4">
          <div className="pt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center w-full">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-gray-700 transition-all duration-150 ${
                    pin.length > idx 
                      ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] scale-110' 
                      : 'bg-transparent'
                  }`}
                ></span>
              ))}
            </div>
            
            {/* Displaying hint text nicely inside the lock header */}
            <p className="text-[10px] text-gray-500 text-center flex items-center gap-1 mt-0.5 font-medium">
              <Lock className="w-3 h-3" /> {t('enter_operator_pin')}
            </p>
          </div>

          {/* Custom Touch Keypad for Tablets/Phones (Safe from standard keyboard traps) */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumClick(num)}
                className="aspect-square bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center font-mono text-lg font-bold border border-gray-800/50 shadow-sm cursor-pointer transition-colors active:bg-amber-500 active:text-black"
                id={`btn_pin_${num}`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="aspect-square bg-transparent hover:bg-white/5 text-gray-400 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer uppercase tracking-wider"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="aspect-square bg-gray-905 hover:bg-gray-800 text-white rounded-full flex items-center justify-center font-mono text-lg font-bold border border-gray-800/50 shadow-sm cursor-pointer transition-colors active:bg-amber-500 active:text-black"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="aspect-square bg-transparent hover:bg-white/5 text-gray-400 rounded-full flex items-center justify-center font-bold cursor-pointer text-xs"
            >
              ⌫
            </button>
          </div>

          {/* Error Message banner */}
          <div className="min-h-[32px] flex items-center justify-center">
            {errorMsg ? (
              <p className="text-[10px] font-bold text-center text-red-400 px-2 leading-relaxed max-w-sm">
                {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] font-medium text-gray-500 text-center">
                PIN: {t('waiter')} = <span className="font-bold text-gray-400">3333</span> • {t('chef')} = <span className="font-bold text-gray-400">2222</span> • {t('admin')} = <span className="font-bold text-gray-400">1234</span>
              </p>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pin.length < 4}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              pin.length === 4
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-black'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-750'
            }`}
          >
            {t('submit_pin')}
          </button>
        </div>

      </div>
    </div>
  );
}
