// classification: PUBLIC
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** An interrupted/failed real run invalidates prior success before work starts. */
export async function withVerifyHealth(run, { file, dryRun = false } = {}) {
  if (dryRun) return run()
  const save = async (ok, counts, errorCode) => {
    await mkdir(path.dirname(file), { recursive: true })
    const temp = `${file}.${process.pid}.tmp`
    await writeFile(temp, JSON.stringify({checkedAt:new Date().toISOString(),ok,counts,errorCode},null,2)+'\n')
    await rename(temp,file)
  }
  await save(false,null,'IN_PROGRESS')
  try {
    const counts = await run()
    if (!counts || !Number.isInteger(counts.checked) || counts.checked < 1) throw new Error('Empty verification result')
    await save(true,counts,null)
    return counts
  } catch (error) {
    await save(false,null,'VERIFY_FAILED')
    throw error
  }
}

/** Record combined weekly outcomes; null exits represent an incomplete run. */
export async function writeWeeklyHealth(file, verifyExit = null, discoverExit = null) {
  const validExit = value => value === null || (Number.isInteger(value) && value >= 0 && value <= 255)
  if (!validExit(verifyExit) || !validExit(discoverExit)) throw new Error('Invalid exit status')
  const result = { checkedAt: new Date().toISOString(),
    ok: [0, 1].includes(verifyExit) && discoverExit === 0, verifyExit, discoverExit,
    errorCode: verifyExit === null || discoverExit === null ? 'IN_PROGRESS' : null }
  await mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.${process.pid}.tmp`
  await writeFile(temp, JSON.stringify(result, null, 2) + '\n')
  await rename(temp, file)
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [file, verify, discover] = process.argv.slice(2)
    if (!file) throw new Error('Missing output')
    await writeWeeklyHealth(file, verify === undefined ? null : Number(verify), discover === undefined ? null : Number(discover))
  } catch { console.error('Weekly health evidence could not be saved'); process.exitCode = 2 }
}
