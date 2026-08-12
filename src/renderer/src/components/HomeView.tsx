import { useState } from 'react'
import { usePartyStore } from '../store/partyStore'
import InviteDesignStep from './InviteDesignStep'
import GuestsStep from './GuestsStep'
import SendStep from './SendStep'
import DashboardStep from './DashboardStep'
import SettingsModal from './SettingsModal'
import MyPartiesModal from './MyPartiesModal'
import type { Party } from '../types'

type Step = 0 | 1 | 2 | 3

const STEPS = [
  { label: 'Design' },
  { label: 'Guests' },
  { label: 'Send' },
  { label: 'Dashboard' },
]

const DEFAULT_ACCENT = '#ff6b35'

export default function HomeView() {
  const { currentParty, auth, setCurrentParty, setGuests } = usePartyStore()
  const [step, setStep] = useState<Step>(0)
  const [accent, setAccent] = useState(currentParty?.accent_color || DEFAULT_ACCENT)
  const [showSettings, setShowSettings] = useState(false)
  const [showParties, setShowParties] = useState(false)

  function handlePartySelected(party: Party) {
    setAccent(party.accent_color || DEFAULT_ACCENT)
    setStep(1)
  }

  function handleNewParty() {
    setCurrentParty(null)
    setGuests([])
    setAccent(DEFAULT_ACCENT)
    setStep(0)
  }

  const partyEmoji = currentParty?.emoji || '🎉'
  const partyName = currentParty?.name || 'Party Invite'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f0f' }}>
      {/* Drag region */}
      <div style={{ height: '32px', WebkitAppRegion: 'drag' as any, flexShrink: 0 }} />

      {/* Header */}
      <div
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
          WebkitAppRegion: 'no-drag' as any,
        }}
      >
        {/* Left: emoji + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '16px' }}>{partyEmoji}</span>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partyName}
          </span>
        </div>

        {/* Right: gear + My Parties */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '15px', padding: '4px', lineHeight: 1 }}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowParties(true)}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px', fontWeight: 500, padding: '4px', lineHeight: 1 }}
          >
            My Parties
          </button>
          {auth?.user && (
            <button
              onClick={() => window.api.logout().then(() => usePartyStore.getState().setAuth(null))}
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '11px', padding: '4px' }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
          gap: '0',
        }}
      >
        {STEPS.map((s, i) => {
          const isCurrent = step === i
          const isPast = step > i
          const isFuture = step < i
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <button
                onClick={() => isPast ? setStep(i as Step) : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: isPast ? 'pointer' : 'default',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isCurrent ? accent : isPast ? accent + '40' : '#1f1f1f',
                    border: `1.5px solid ${isCurrent ? accent : isPast ? accent + '60' : '#2a2a2a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {isPast ? (
                    <span style={{ color: accent, fontSize: '10px', fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ color: isCurrent ? 'white' : '#444', fontSize: '10px', fontWeight: 700 }}>{i + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'white' : isPast ? '#666' : '#3a3a3a', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: step > i ? accent + '40' : '#222', margin: '0 6px', minWidth: '8px' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {step === 0 && (
          <InviteDesignStep
            onContinue={() => setStep(1)}
            accent={accent}
            onAccentChange={setAccent}
          />
        )}
        {step === 1 && (
          <GuestsStep
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
            accent={accent}
          />
        )}
        {step === 2 && (
          <SendStep
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
            accent={accent}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        {step === 3 && (
          <DashboardStep
            onNewParty={handleNewParty}
            accent={accent}
          />
        )}
      </div>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showParties && (
        <MyPartiesModal
          onClose={() => setShowParties(false)}
          onSelect={handlePartySelected}
          onNewParty={handleNewParty}
        />
      )}
    </div>
  )
}
