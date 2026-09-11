import { ridersRepository } from './riders.repository.js'
import { errors } from '../../lib/errors.js'

export const ridersService = {
  async getProfile(userId: string) {
    let rider = await ridersRepository.findByUserId(userId)
    if (!rider) {
      rider = await ridersRepository.create(userId)
    }
    return rider
  },

  /** Profile as the rider app needs it: rider stats + user name/phone/email. */
  async getFullProfile(userId: string) {
    await this.getProfile(userId)
    const profile = await ridersRepository.findProfileByUserId(userId)
    if (!profile) throw errors.notFound('Rider profile not found')
    return profile
  },

  async updateProfile(userId: string, data: { name?: string; email?: string; preferredPaymentMethod?: string }) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    const { name, email, ...riderData } = data
    if (name !== undefined || email !== undefined) {
      await ridersRepository.updateUser(userId, { name, email })
    }
    if (riderData.preferredPaymentMethod !== undefined) {
      await ridersRepository.update(rider.id, riderData)
    }
    return this.getFullProfile(userId)
  },

  // Saved Places
  async listSavedPlaces(userId: string) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    return ridersRepository.listSavedPlaces(rider.id)
  },

  async addSavedPlace(userId: string, data: { label: string; name: string; address: string; lat: number; lng: number }) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    return ridersRepository.createSavedPlace(rider.id, data)
  },

  async removeSavedPlace(userId: string, placeId: string) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    await ridersRepository.deleteSavedPlace(placeId, rider.id)
  },

  // Emergency Contacts
  async listEmergencyContacts(userId: string) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    return ridersRepository.listEmergencyContacts(rider.id)
  },

  async addEmergencyContact(userId: string, data: { name: string; phone: string; shareTrips?: boolean }) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    return ridersRepository.createEmergencyContact(rider.id, data)
  },

  async removeEmergencyContact(userId: string, contactId: string) {
    const rider = await ridersRepository.findByUserId(userId)
    if (!rider) throw errors.notFound('Rider profile not found')
    await ridersRepository.deleteEmergencyContact(contactId, rider.id)
  },
}