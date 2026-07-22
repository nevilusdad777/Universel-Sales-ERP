import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      addToast('Signed in successfully!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid email or password.', 'error');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 antialiased"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <main className="w-full max-w-[420px]">
        {/* Login Card */}
        <div className="glass-card rounded-xl p-8 flex flex-col gap-6">

          {/* Header / Brand */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-[#004ac6] rounded-lg flex items-center justify-center mb-2 shadow-sm">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
              >domain</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#191b23]">Universal Sales ERP</h1>
            <p className="text-sm text-[#434655]">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#191b23]" htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#737686]" style={{ fontSize: 20 }}>mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@us-erp.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/i, message: 'Enter a valid email address' }
                  })}
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded text-sm text-[#191b23] transition-all duration-200 input-focus-ring ${errors.email ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-[#ba1a1a] mt-0.5">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[#191b23]" htmlFor="password">Password</label>
                <a className="text-xs font-semibold tracking-wide text-[#004ac6] hover:text-[#0053db] transition-colors" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#737686]" style={{ fontSize: 20 }}>lock</span>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded text-sm text-[#191b23] transition-all duration-200 input-focus-ring ${errors.password ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
                />
              </div>
              {errors.password && <p className="text-xs text-[#ba1a1a] mt-0.5">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mt-1">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-[#c3c6d7] text-[#004ac6] cursor-pointer"
              />
              <label className="text-sm text-[#434655] cursor-pointer select-none" htmlFor="remember">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-btn"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full h-10 bg-[#2563eb] hover:bg-[#0053db] disabled:opacity-60 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors duration-200 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-[#e1e2ed]">
            <p className="text-sm text-[#434655]">
              Don't have an account?{' '}
              <a className="text-sm font-medium text-[#004ac6] hover:text-[#0053db] transition-colors" href="#">
                Contact Administrator
              </a>
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#434655]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>All systems operational</span>
        </div>
      </main>
    </div>
  );
};

export default Login;
