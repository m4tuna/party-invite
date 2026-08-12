import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const execAsync = promisify(exec)

export interface RawContact {
  name: string
  emails: string[]
  phones: string[]
}

export async function importFromApple(): Promise<RawContact[]> {
  const script = `
import Contacts
import Foundation

let store = CNContactStore()
let sema = DispatchSemaphore(value: 0)
var output: [[String: Any]] = []

store.requestAccess(for: .contacts) { granted, _ in
  defer { sema.signal() }
  guard granted else { return }
  let keys: [CNKeyDescriptor] = [
    CNContactGivenNameKey as CNKeyDescriptor,
    CNContactFamilyNameKey as CNKeyDescriptor,
    CNContactOrganizationNameKey as CNKeyDescriptor,
    CNContactEmailAddressesKey as CNKeyDescriptor,
    CNContactPhoneNumbersKey as CNKeyDescriptor,
  ]
  let req = CNContactFetchRequest(keysToFetch: keys)
  try? store.enumerateContacts(with: req) { c, _ in
    var name = [c.givenName, c.familyName].filter { !$0.isEmpty }.joined(separator: " ")
    if name.isEmpty { name = c.organizationName.isEmpty ? "Unknown" : c.organizationName }
    let emails = c.emailAddresses.map { $0.value as String }
    let phones = c.phoneNumbers.map { $0.value.stringValue }
    output.append(["name": name, "emails": emails, "phones": phones])
  }
}
sema.wait()

if let data = try? JSONSerialization.data(withJSONObject: output),
   let str = String(data: data, encoding: .utf8) {
  print(str)
} else {
  print("[]")
}
`
  const tmpFile = path.join(os.tmpdir(), 'party-invite-contacts.swift')
  try {
    fs.writeFileSync(tmpFile, script, 'utf8')
    const { stdout } = await execAsync(`swift "${tmpFile}"`, { timeout: 30000 })
    const parsed = JSON.parse(stdout.trim())
    return Array.isArray(parsed) ? parsed.filter((c: RawContact) => c && c.name && c.name !== 'Unknown') : []
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
  }
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
