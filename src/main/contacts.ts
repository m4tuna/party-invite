import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface RawContact {
  name: string
  emails: string[]
  phones: string[]
}

export async function importFromApple(): Promise<RawContact[]> {
  const script = `var app = Application("Contacts"); app.includeStandardAdditions = true; var people = app.people(); JSON.stringify(people.map(function(p) { try { return { name: p.name(), emails: p.emails().map(function(e) { return e.value() }), phones: p.phones().map(function(ph) { return ph.value() }) }; } catch(e) { return null; } }).filter(Boolean));`
  const { stdout } = await execAsync(`osascript -l JavaScript -e '${script}'`, { timeout: 15000 })
  return JSON.parse(stdout.trim())
}

export async function importFromGmail(accessToken: string): Promise<RawContact[]> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json() as any
  return (data.connections || []).map((c: any) => ({
    name: c.names?.[0]?.displayName || 'Unknown',
    emails: (c.emailAddresses || []).map((e: any) => e.value as string),
    phones: (c.phoneNumbers || []).map((p: any) => p.value as string),
  }))
}
