// client/src/components/Register.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// Validation Schema using Zod
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name must be less than 50 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function Register({ onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register: signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const { name, email, password } = data;
      const response = await signup({ name, email, password });
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please check details or try again.');
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
          Create Account
        </h2>
        <p className="mt-2 text-sm text-slate-400">Register as Administrator for IntellectBill AI</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 text-sm rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-center animate-pulse">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Jane Doe"
              {...register('name')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-slate-700'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

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
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
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
              className={`w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
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

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={`w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Registering...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="relative my-5">
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
          onError={() => setApiError('Google registration was cancelled or encountered an error.')}
          theme="filled_dark"
          size="large"
          width="100%"
          shape="rectangular"
        />
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button
          onClick={onToggleMode}
          className="font-semibold text-brand-400 hover:text-brand-300 transition-colors focus:outline-none"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
