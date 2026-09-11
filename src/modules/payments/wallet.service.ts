import { ledgerRepository } from './ledger.repository.js'
import { errors } from '../../lib/errors.js'

export const walletService = {
  async getBalance(ownerId: string, ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner') {
    const result = await ledgerRepository.getWalletBalance(ownerId, ownerType)
    return result
  },

  async getWalletTransactions(ownerId: string, ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner', limit = 50, offset = 0) {
    const wallet = await ledgerRepository.getOrCreateWallet(ownerId, ownerType)
    if (!wallet) return []

    return ledgerRepository.getWalletTransactions(wallet.id, limit, offset)
  },

  async topUp(ownerId: string, ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner', amountKobo: number, reference: string, description: string) {
    const wallet = await ledgerRepository.getOrCreateWallet(ownerId, ownerType)
    if (!wallet) throw errors.notFound('Wallet not found')

    const correlationId = `topup_${ownerId}_${Date.now()}`

    const { credit } = await ledgerRepository.createDoubleEntry({
      correlationId,
      debitAccount: 'platform_liability',
      creditAccount: ledgerRepository.getLedgerAccountForWallet(ownerType),
      amountKobo,
      currency: 'NGN',
      description,
      referenceId: ownerId,
      referenceType: 'topup',
      actorId: ownerId,
      metadata: { reference },
    })

    if (credit) {
      await ledgerRepository.createWalletTransaction({
        walletId: wallet.id,
        ledgerEntryId: credit.id,
        type: 'credit',
        amountKobo,
        description,
        referenceId: ownerId,
        referenceType: 'topup',
      })
    }

    return { success: true, balanceKobo: (await ledgerRepository.getWalletBalance(ownerId, ownerType)).balanceKobo }
  },

  async withdraw(ownerId: string, ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner', amountKobo: number, reference: string, description: string) {
    const wallet = await ledgerRepository.getOrCreateWallet(ownerId, ownerType)
    if (!wallet) throw errors.notFound('Wallet not found')

    const balance = await ledgerRepository.getWalletBalance(ownerId, ownerType)
    if (balance.balanceKobo < amountKobo) {
      throw errors.unprocessable('Insufficient balance')
    }

    const correlationId = `withdrawal_${ownerId}_${Date.now()}`

    const { debit } = await ledgerRepository.createDoubleEntry({
      correlationId,
      debitAccount: ledgerRepository.getLedgerAccountForWallet(ownerType),
      creditAccount: 'platform_liability',
      amountKobo,
      currency: 'NGN',
      description,
      referenceId: ownerId,
      referenceType: 'withdrawal',
      actorId: ownerId,
      metadata: { reference },
    })

    if (debit) {
      await ledgerRepository.createWalletTransaction({
        walletId: wallet.id,
        ledgerEntryId: debit.id,
        type: 'debit',
        amountKobo,
        description,
        referenceId: ownerId,
        referenceType: 'withdrawal',
      })
    }

    return { success: true, balanceKobo: (await ledgerRepository.getWalletBalance(ownerId, ownerType)).balanceKobo }
  },
}