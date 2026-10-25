import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { registrationUrl } from '../lib/format.js'

export function CopyLinkButton({ eventId }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl(eventId))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку на регистрацию:', registrationUrl(eventId))
    }
  }
  return (
    <button type="button" className="btn btn--secondary btn--sm" onClick={copy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Ссылка скопирована' : 'Ссылка на регистрацию'}
    </button>
  )
}
