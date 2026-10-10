import React, { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';

interface FormPageProps {
  onAction: (msg: string) => void;
}

export const FormPage: React.FC<FormPageProps> = ({ onAction }) => {
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '', agree: false });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = 'Name is required';
    if (!values.email.trim() || !values.email.includes('@')) e.email = 'Valid email required';
    if (!values.subject.trim()) e.subject = 'Subject is required';
    if (!values.message.trim()) e.message = 'Message is required';
    if (!values.agree) e.agree = 'You must agree to proceed';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitted(true);
    setErrors({});
    onAction(`Form submitted by ${values.name}!`);
  };

  const handleReset = () => {
    setValues({ name: '', email: '', subject: '', message: '', agree: false });
    setSubmitted(false);
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-10 text-center space-y-4">
          <CheckCircle size={48} className="text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Form Submitted!</h1>
          <p className="text-slate-300">Thanks, <strong className="text-white">{values.name}</strong>. Your message has been received.</p>
          <div className="bg-card border border-white/5 rounded-xl p-4 text-left space-y-1 text-sm">
            <div className="text-slate-400">From: <span className="text-white">{values.email}</span></div>
            <div className="text-slate-400">Subject: <span className="text-white">{values.subject}</span></div>
            <div className="text-slate-400">Message: <span className="text-white">{values.message}</span></div>
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            data-handsfree-target="form-reset"
            data-handsfree-label="Submit Another"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Sample Form</h1>
        <p className="text-slate-400 text-sm">
          Practice dwell-clicking fields and voice dictation.
          Click a field to focus it, then say <span className="text-primary font-medium">"start dictation"</span> to type.
        </p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="form-name">Full Name *</label>
          <input
            id="form-name"
            type="text"
            value={values.name}
            onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
            placeholder="Your full name"
            className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
            data-handsfree-target="field-name"
            data-handsfree-label="Name Field"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="form-email">Email Address *</label>
          <input
            id="form-email"
            type="email"
            value={values.email}
            onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
            placeholder="you@example.com"
            className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
            data-handsfree-target="field-email"
            data-handsfree-label="Email Field"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="form-subject">Subject *</label>
          <input
            id="form-subject"
            type="text"
            value={values.subject}
            onChange={e => setValues(v => ({ ...v, subject: e.target.value }))}
            placeholder="Brief subject line"
            className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
            data-handsfree-target="field-subject"
            data-handsfree-label="Subject Field"
          />
          {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="form-message">Message *</label>
          <textarea
            id="form-message"
            rows={4}
            value={values.message}
            onChange={e => setValues(v => ({ ...v, message: e.target.value }))}
            placeholder="Write your message here…"
            className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all resize-none"
            data-handsfree-target="field-message"
            data-handsfree-label="Message Field"
          />
          {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="form-agree"
            type="checkbox"
            checked={values.agree}
            onChange={e => setValues(v => ({ ...v, agree: e.target.checked }))}
            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
            data-handsfree-target="field-agree"
            data-handsfree-label="Agree Checkbox"
          />
          <label htmlFor="form-agree" className="text-sm text-slate-300 cursor-pointer">
            I agree that this is a demo form and no data is actually sent anywhere.
          </label>
        </div>
        {errors.agree && <p className="text-red-400 text-xs -mt-3">{errors.agree}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.25)]"
            data-handsfree-target="form-submit"
            data-handsfree-label="Submit Form"
          >
            <Send size={16} /> Submit
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-card hover:bg-card-hover text-slate-300 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary border border-white/10"
            data-handsfree-target="form-clear"
            data-handsfree-label="Clear Form"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
