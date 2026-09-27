import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

// Engine and explorer answers never change for a position, and both services rate-limit.
// Caching them on disk makes re-runs (after editing the prompt, say) free and fast.
export class DiskCache {
  constructor(private readonly dir: string) {}

  async get<T>(namespace: string, key: string): Promise<T | undefined> {
    try {
      return JSON.parse(await readFile(this.file(namespace, key), 'utf8')) as T
    } catch {
      return undefined
    }
  }

  async set(namespace: string, key: string, value: unknown): Promise<void> {
    const file = this.file(namespace, key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(value))
  }

  async wrap<T>(namespace: string, key: string, produce: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(namespace, key)
    if (cached !== undefined) return cached
    const value = await produce()
    await this.set(namespace, key, value)
    return value
  }

  private file(namespace: string, key: string): string {
    const hash = createHash('sha1').update(key).digest('hex')
    return path.join(this.dir, namespace, `${hash}.json`)
  }
}
