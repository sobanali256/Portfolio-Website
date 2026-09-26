import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { profile } from '../data/content';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeepkerq';

type Field = 'name' | 'email' | 'subject' | 'message';
type Values = Record<Field, string>;
const EMPTY: Values = { name: '', email: '', subject: '', message: '' };

function validateForm(v: Values) {
  const errors: Partial<Record<Field, string>> = {};
  if (!v.name.trim()) errors.name = 'Please tell me your name.';
  if (!v.email.trim()) errors.email = 'I need a way to reply to you.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "That email doesn't look quite right.";
  if (!v.subject.trim()) errors.subject = "What's this about?";
  if (!v.message.trim()) errors.message = 'The message is empty.';
  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as Field;
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
    if (status === 'failed') setStatus('idle');
    if (errors[name]) setErrors(({ [name]: _, ...rest }) => rest);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateForm(values);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      setStatus('sent');
      setValues(EMPTY);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('failed');
    }
  };

  const field = (name: Field, label: string, opts: { type?: string; multiline?: boolean; autoComplete?: string } = {}) => {
    const err = errors[name];
    const cls = `peer w-full resize-none border-0 border-b bg-transparent px-0 pb-2.5 pt-1 text-[17px] text-ink outline-none transition-colors duration-200 placeholder:text-transparent focus:border-ink ${
      err ? 'border-err' : 'border-rule-strong'
    }`;
    const shared = {
      id: `cf-${name}`,
      name,
      value: values[name],
      onChange,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `cf-${name}-err` : undefined,
      className: cls,
    };
    return (
      <div className="relative">
        <label htmlFor={`cf-${name}`} className="label mb-2 block">
          {label}
        </label>
        {opts.multiline ? (
          <textarea {...shared} rows={4} />
        ) : (
          <input {...shared} type={opts.type ?? 'text'} autoComplete={opts.autoComplete} />
        )}
        <AnimatePresence>
          {err && (
            <motion.p
              id={`cf-${name}-err`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-[13px] text-err"
            >
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (status === 'sent') {
    return (
      <div role="status" className="flex min-h-[26rem] flex-col justify-center border-t border-rule-strong pt-8">
        <span className="mb-6 grid size-12 place-items-center rounded-full bg-ok text-paper">
          <Check size={22} strokeWidth={2} />
        </span>
        <p className="font-display text-4xl leading-tight text-ink">Message received.</p>
        <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">
          Thanks for writing — I read every message and I’ll get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 w-fit cursor-pointer text-[14px] font-medium text-ink"
        >
          <span className="link-draw">Send another</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-9 border-t border-rule-strong pt-8">
      <div className="grid gap-9 sm:grid-cols-2 sm:gap-6">
        {field('name', 'Name', { autoComplete: 'name' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
      </div>
      {field('subject', 'Subject')}
      {field('message', 'Message', { multiline: true })}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="group inline-flex h-12 cursor-pointer items-center gap-3 rounded-full bg-ink pl-6 pr-5 text-[15px] font-medium text-paper transition-[background-color,opacity] duration-200 hover:bg-accent hover:text-accent-ink disabled:cursor-wait disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
          <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p role="alert" className="text-[14px] text-err">
          {status === 'failed' && (
            <>
              Something went wrong. Try again, or email{' '}
              <a href={`mailto:${profile.email}`} className="underline underline-offset-2">
                {profile.email}
              </a>
              .
            </>
          )}
        </p>
      </div>
    </form>
  );
}
