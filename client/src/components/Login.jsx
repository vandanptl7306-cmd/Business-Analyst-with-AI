// client/src/components/Login.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// Validation Schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function Login({ onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await login(data);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await googleLogin(credentialResponse.credential);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to your IntellectBill AI account</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 text-sm rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-center animate-pulse">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              placeholder="name@company.com"
              {...register('email')}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-slate-700'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Authenticating...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setApiError('Google sign-in was cancelled or encountered an error.')}
          theme="filled_dark"
          size="large"
          width="100%"
          shape="rectangular"
        />
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <button
          onClick={onToggleMode}
          className="font-semibold text-brand-400 hover:text-brand-300 transition-colors focus:outline-none"
        >
          Create an account
        </button>
      </p>
    </div>
  );
}
