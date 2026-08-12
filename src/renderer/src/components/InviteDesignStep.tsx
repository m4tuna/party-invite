import { useState, useRef } from 'react'
import { usePartyStore } from '../store/partyStore'

interface Props {
  onContinue: () => void
  accent: string
  onAccentChange: (color: string) => void
}

const EMOJI_PRESETS = ['🎉', '🎊', '🥳', '🍕', '🎶', '🌊']
const COLOR_SWATCHES = ['#ff6b35', '#6366f1', '#22c55e', '#ec4899', '#f59e0b', '#06b6d4']

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '10px',
  color: 'white',
  fontSize: '14px',
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

function formatDateDisplay(dateStr: string, timeStr: string): string {
  if (!dateStr) return ''
  const dt = new Date(`${dateStr}T${timeStr || '00:00'}`)
  const date = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const time = timeStr ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
  return time ? `${date} at ${time}` : date
}

export default function InviteDesignStep({ onContinue, accent, onAccentChange }: Props) {
  const { currentParty, setCurrentParty, setParties, parties } = usePartyStore()

  const [name, setName] = useState(currentParty?.name || '')
  const [emoji, setEmoji] = useState(currentParty?.emoji || '🎉')
  const [date, setDate] = useState(currentParty?.date ? currentParty.date.slice(0, 10) : '')
  const [time, setTime] = useState(currentParty?.date ? currentParty.date.slice(11, 16) : '')
  const [location, setLocation] = useState(currentParty?.location || '')
  const [description, setDescription] = useState(currentParty?.description || '')
  const [imageUrl, setImageUrl] = useState(currentParty?.cover_image_url || '')
  const [saving, setSaving] = useState(false)
  const [customColor, setCustomColor] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentParty) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const url = await window.api.uploadCoverImage({
          partyId: currentParty.id,
          imageData: base64,
          mimeType: file.type,
        })
        setImageUrl(url)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const dateTime = date ? (time ? `${date}T${time}:00` : `${date}T00:00:00`) : undefined
      const party = await window.api.createParty({
        name: name.trim(),
        date: dateTime,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        emoji,
        accent_color: accent,
      })
      setCurrentParty(party)
      await window.api.setCurrentParty(party.id)
      // Update parties list
      const updated = await window.api.listParties()
      setParties(updated)
      onContinue()
    } finally {
      setSaving(false)
    }
  }

  // Preview card data
  const previewName = name || 'Your Party Name'
  const previewEmoji = emoji
  const previewDate = formatDateDisplay(date, time)
  const previewLocation = location || ''
  const previewDesc = description || ''

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Party Name */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Party Name</label>
          <input
            placeholder="Summer Rooftop Party"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ ...INPUT, fontSize: '16px', fontWeight: 600 }}
          />
        </div>

        {/* Emoji */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Emoji</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {EMOJI_PRESETS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  background: emoji === e ? 'rgba(255,255,255,0.12)' : '#111',
                  border: `1px solid ${emoji === e ? '#555' : '#2a2a2a'}`,
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="✏️"
              style={{ ...INPUT, width: '60px', textAlign: 'center', fontSize: '18px', padding: '6px 8px' }}
              maxLength={2}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Date & Time</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...INPUT, flex: 1, colorScheme: 'dark' }}
            />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{ ...INPUT, flex: 1, colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Location</label>
          <input
            placeholder="123 Main St, Apt 4B"
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={INPUT}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
          <textarea
            placeholder="Come hang out! Bring your good vibes."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...INPUT, resize: 'none', lineHeight: '1.5' }}
          />
        </div>

        {/* Accent Color */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Accent Color</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {COLOR_SWATCHES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onAccentChange(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: c,
                  border: accent === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  outline: accent === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#555', fontSize: '12px' }}>#</span>
              <input
                placeholder="custom"
                value={customColor}
                onChange={e => {
                  setCustomColor(e.target.value)
                  if (/^[0-9a-fA-F]{6}$/.test(e.target.value)) onAccentChange('#' + e.target.value)
                }}
                style={{ ...INPUT, width: '72px', padding: '6px 8px', fontSize: '12px' }}
                maxLength={6}
              />
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Cover Image (optional)</label>
          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={imageUrl} alt="Cover" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #2a2a2a' }} />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px', padding: '3px 8px' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              onClick={() => currentParty ? fileInputRef.current?.click() : undefined}
              style={{
                border: '1px dashed #333',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: currentParty ? 'pointer' : 'default',
                background: '#111',
              }}
            >
              {uploading ? (
                <span style={{ color: '#666', fontSize: '13px' }}>Uploading…</span>
              ) : currentParty ? (
                <span style={{ color: '#555', fontSize: '13px' }}>Click to upload JPG or PNG</span>
              ) : (
                <span style={{ color: '#444', fontSize: '13px' }}>Save the party first to upload an image</span>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{
            background: name.trim() ? accent : '#222',
            color: name.trim() ? 'white' : '#555',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 24px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
            marginTop: '4px',
          }}
        >
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
      </form>

      {/* Live preview card */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '4px 12px', background: '#111', borderBottom: '1px solid #2a2a2a' }}>
          <span style={{ color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</span>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '8px' }}>{previewEmoji}</div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>{previewName}</div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {previewDate && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px' }}>📅</span>
              <span style={{ color: '#ccc', fontSize: '12px' }}>{previewDate}</span>
            </div>
          )}
          {previewLocation && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px' }}>📍</span>
              <span style={{ color: '#ccc', fontSize: '12px' }}>{previewLocation}</span>
            </div>
          )}
          {previewDesc && (
            <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0', lineHeight: 1.4 }}>{previewDesc}</p>
          )}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'inline-block', background: '#22c55e', color: 'white', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: 600 }}>
              I'm attending!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
