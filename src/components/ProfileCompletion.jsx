import React, { useState } from 'react';
import { api } from '../lib/api';
import { LEADERS } from '../lib/leaders';
import { User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = {
  primaryRed: '#e42935',
  darkGray: '#494949',
  slateBlue: '#1e293b',
  brightBlue: '#4bb3d4',
};

export default function ProfileCompletion({ profile, onComplete }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [fullName, setFullName] = useState(profile?.name || '');
  const [selectedLeader, setSelectedLeader] = useState(profile?.leader_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      setError(language === 'es' 
        ? 'Por favor ingresa tu nombre completo (mínimo 2 caracteres)'
        : 'Please enter your full name (minimum 2 characters)');
      return;
    }

    if (!selectedLeader) {
      setError(language === 'es'
        ? 'Por favor selecciona tu líder'
        : 'Please select your leader');
      return;
    }

    setLoading(true);

    try {
      const { data, error: updateError } = await api.updateProfile({
        name: fullName.trim(),
        leader_name: selectedLeader
      });

      if (updateError) {
        setError(updateError.message || (language === 'es' 
          ? 'Error al actualizar el perfil'
          : 'Error updating profile'));
        setLoading(false);
        return;
      }

      // Profile updated successfully
      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      setError(err.message || (language === 'es'
        ? 'Error inesperado'
        : 'Unexpected error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #e42935 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="https://salmon-sea-0b3caa70f.1.azurestaticapps.net/src/fic/Logo-Forte_Full_logo-H.png" 
              alt="FORTE" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <User size={24} style={{ color: COLORS.primaryRed }} />
            <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>
              {language === 'es' ? 'Completa tu Perfil' : 'Complete Your Profile'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {language === 'es' 
              ? 'Para usar la aplicación, necesitamos que completes tu información básica'
              : 'To use the app, we need you to complete your basic information'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === 'es' ? 'Nombre Completo *' : 'Full Name *'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={language === 'es' ? 'Ingresa tu nombre completo' : 'Enter your full name'}
              required
              minLength={2}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-slate-500">
              {language === 'es' 
                ? 'Este será el nombre que se mostrará en tus solicitudes'
                : 'This will be the name displayed on your requests'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === 'es' ? 'Selecciona tu Líder *' : 'Select Your Leader *'}
            </label>
            <select
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">
                {language === 'es' ? '-- Selecciona un líder --' : '-- Select a leader --'}
              </option>
              {LEADERS.map((leader, index) => (
                <option key={index} value={leader.name}>
                  {leader.name} - {leader.department}
                </option>
              ))}
            </select>
            {selectedLeader && (
              <p className="text-xs text-slate-500 mt-1">
                {LEADERS.find(l => l.name === selectedLeader)?.department}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  {language === 'es' ? '¿Por qué necesitamos esta información?' : 'Why do we need this information?'}
                </p>
                <p className="text-blue-700">
                  {language === 'es'
                    ? 'Tu líder será quien apruebe tus solicitudes de vacaciones y permisos. Asegúrate de seleccionar el líder correcto de tu departamento.'
                    : 'Your leader will be the one who approves your vacation and permission requests. Make sure to select the correct leader from your department.'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim() || !selectedLeader}
            className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primaryRed }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{language === 'es' ? 'Guardando...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>{language === 'es' ? 'Completar Perfil' : 'Complete Profile'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

