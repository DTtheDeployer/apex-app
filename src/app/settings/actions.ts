'use server'

import { createCipheriv, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { BotConfig } from '@/types'

function encryptKey(plaintext: string): string {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) throw new Error('ENCRYPTION_KEY env var is not set')
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

type SettingsPayload = Pick<
  BotConfig,
  | 'hl_wallet_address'
  | 'symbols'
  | 'leverage'
  | 'max_position_pct'
  | 'max_daily_loss_pct'
  | 'max_positions'
  | 'testnet'
  | 'discord_webhook_url'
  | 'telegram_bot_token'
  | 'telegram_chat_id'
  | 'email_alerts'
  | 'bot_enabled'
>

export async function saveSettings(
  settings: Partial<SettingsPayload>,
  privateKey: string
): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const update: Record<string, unknown> = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    if (privateKey) {
      update.hl_private_key_enc = encryptKey(privateKey)
    }

    const { error } = await supabase
      .from('bot_configs')
      .update(update)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Save failed' }
  }
}
