import React, { useState } from 'react';
import { Smile, Check } from 'lucide-react';

interface FormPageProps {
  onAction: (msg: string) => void;
}

export const FormPage: React.FC<FormPageProps> = ({ onAction }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onAction('Please enter your name.');
      return;
    }
    setSubmitted(true);
    onAction('Form submitted successfully!');
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setAgree(false);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4 flex flex-col items-center">
        <div className="text-primary mb-4">
          <Smile className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-white">Form Submitted!</h2>
        <p className="text-slate-300">Thank you, {name}. This is a demo form — no data was sent.</p>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          data-handsfree-target="reset-form"
          data-handsfree-label="Try Again"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Sample Form</h1>
      <p className="text-slate-400">
        Practice filling out this form using voice dictation and gesture control.
        No data is sent anywhere.
      </p>

      <form onSubmit={handleSubmit} className="bg-card border border-white/5 rounded-xl p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-white font-medium mb-1.5" htmlFor="form-name">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="form-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            data-handsfree-input="name"
            data-handsfree-label="Name field"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-medium mb-1.5" htmlFor="form-email">
            Email
          </label>
          <input
            id="form-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email (optional)"
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            data-handsfree-input="email"
            data-handsfree-label="Email field"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-white font-medium mb-1.5" htmlFor="form-message">
            Message
          </label>
          <textarea
            id="form-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message or use voice dictation"
            rows={4}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            data-handsfree-input="message"
            data-handsfree-label="Message field"
          />
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAgree(!agree)}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
              agree
                ? 'bg-primary border-primary'
                : 'bg-surface border-white/10'
            }`}
            role="checkbox"
            aria-checked={agree}
            data-handsfree-target="agree-checkbox"
            data-handsfree-label="Agreement checkbox"
          >
            {agree && <Check className="w-4 h-4 text-white" />}
          </button>
          <label className="text-slate-300 text-sm">
            I agree this is a harmless demo form and no data will be sent.
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            data-handsfree-target="submit-form"
            data-handsfree-label="Submit"
          >
            Submit Form
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
            data-handsfree-target="clear-form"
            data-handsfree-label="Clear Form"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};
